// PM IntelliHub — Google Play Console Proxy Worker
// Authenticates via Service Account JWT, calls Play Developer Reporting + Android Publisher APIs

let cachedToken = null;
let tokenExpiry = 0;

// PEM private key → ArrayBuffer for Web Crypto
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

// ArrayBuffer → base64url (for JWT signature)
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Object → base64url JSON (for JWT header/claim)
function b64url(obj) {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiry - 60 > now) {
    return cachedToken;
  }

  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const header = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim = b64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher https://www.googleapis.com/auth/playdeveloperreporting',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  });
  const toSign = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign));
  const jwt = `${toSign}.${arrayBufferToBase64Url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  cachedToken = data.access_token;
  tokenExpiry = now + 3600;
  return cachedToken;
}

// Date range helper — last N days in { year, month, day } format
function dateRange(days) {
  const end = new Date();
  const start = new Date(end - days * 86400000);
  const fmt = d => ({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  return { startDate: fmt(start), endDate: fmt(end) };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function handleLinear(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { query, variables } = body;
  if (!query) return jsonResponse({ error: 'Missing query' }, 400);

  const auth = request.headers.get('Authorization');
  if (!auth) return jsonResponse({ error: 'Missing Authorization header' }, 401);

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  return jsonResponse(data, res.status);
}

async function handleMetrics(request, env) {
  const url = new URL(request.url);
  const packageName = url.searchParams.get('package');
  const days = parseInt(url.searchParams.get('days') || '7', 10);

  if (!packageName) {
    return jsonResponse({ error: 'Missing required query param: package' }, 400);
  }

  let token;
  try {
    token = await getAccessToken(env);
  } catch (err) {
    return jsonResponse({ package: packageName, crash_rate_pct: null, anr_rate_pct: null, reviews: [], error: `Auth failed: ${err.message}` });
  }

  const authHeader = { Authorization: `Bearer ${token}` };
  const { startDate, endDate } = dateRange(days);

  // Fetch crash rate, ANR rate, and reviews in parallel
  const [crashRes, anrRes, reviewsRes] = await Promise.allSettled([
    fetch(
      `https://playdeveloperreporting.googleapis.com/v1beta1/apps/${encodeURIComponent(packageName)}/vitals/crashrate:query`,
      {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: [],
          metrics: ['crashRate7dUserWeighted'],
          dateRange: { startDate, endDate },
        }),
      }
    ),
    fetch(
      `https://playdeveloperreporting.googleapis.com/v1beta1/apps/${encodeURIComponent(packageName)}/vitals/anrrate:query`,
      {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: [],
          metrics: ['anrRate7dUserWeighted'],
          dateRange: { startDate, endDate },
        }),
      }
    ),
    fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/reviews?maxResults=5&translationLanguage=en`,
      { headers: authHeader }
    ),
  ]);

  let crash_rate_pct = null;
  let anr_rate_pct = null;
  let reviews = [];
  const errors = [];

  // Parse crash rate
  if (crashRes.status === 'fulfilled' && crashRes.value.ok) {
    try {
      const data = await crashRes.value.json();
      const row = data.rows?.[0];
      const metric = row?.metrics?.find(m => m.metric === 'crashRate7dUserWeighted');
      if (metric?.decimalValue != null) {
        crash_rate_pct = parseFloat((parseFloat(metric.decimalValue) * 100).toFixed(4));
      }
    } catch (e) {
      errors.push(`Crash rate parse error: ${e.message}`);
    }
  } else {
    const errMsg = crashRes.status === 'rejected'
      ? crashRes.reason?.message
      : `HTTP ${crashRes.value?.status}`;
    errors.push(`Crash rate fetch failed: ${errMsg}`);
  }

  // Parse ANR rate
  if (anrRes.status === 'fulfilled' && anrRes.value.ok) {
    try {
      const data = await anrRes.value.json();
      const row = data.rows?.[0];
      const metric = row?.metrics?.find(m => m.metric === 'anrRate7dUserWeighted');
      if (metric?.decimalValue != null) {
        anr_rate_pct = parseFloat((parseFloat(metric.decimalValue) * 100).toFixed(4));
      }
    } catch (e) {
      errors.push(`ANR rate parse error: ${e.message}`);
    }
  } else {
    const errMsg = anrRes.status === 'rejected'
      ? anrRes.reason?.message
      : `HTTP ${anrRes.value?.status}`;
    errors.push(`ANR rate fetch failed: ${errMsg}`);
  }

  // Parse reviews
  if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
    try {
      const data = await reviewsRes.value.json();
      reviews = (data.reviews || []).map(r => {
        const userComment = r.comments?.find(c => c.userComment)?.userComment;
        const ts = userComment?.lastModified?.seconds;
        const date = ts ? new Date(parseInt(ts, 10) * 1000).toISOString().slice(0, 10) : null;
        return {
          author: r.authorName || 'Anonymous',
          rating: userComment?.starRating ?? null,
          text: userComment?.text ?? '',
          date,
        };
      });
    } catch (e) {
      errors.push(`Reviews parse error: ${e.message}`);
    }
  } else {
    const errMsg = reviewsRes.status === 'rejected'
      ? reviewsRes.reason?.message
      : `HTTP ${reviewsRes.value?.status}`;
    errors.push(`Reviews fetch failed: ${errMsg}`);
  }

  return jsonResponse({
    package: packageName,
    crash_rate_pct,
    anr_rate_pct,
    reviews,
    error: errors.length > 0 ? errors.join('; ') : null,
  });
}

export default {
  async fetch(request, env) {
    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/metrics') {
      return handleMetrics(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/linear') {
      return handleLinear(request);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
