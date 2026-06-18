import React, { useEffect, useState, useCallback } from 'react';
import { APPS, SOURCES, DIGEST_SYSTEM_PROMPT } from '../constants.js';
import { useClaude } from '../hooks/useClaude.js';
import { fetchGooglePlayMetrics } from '../utils/googleplay.js';
import { Card } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { SkeletonCard, Skeleton } from './ui/Skeleton.jsx';

function buildMcpList(settings) {
  return Object.values(SOURCES)
    .filter(s => s.mcpUrl && settings[s.requiredKey])
    .map(s => ({
      name: s.id,
      mcpUrl: s.mcpUrl,
      token: settings[s.requiredKey],
    }));
}

function buildDigestPrompt(appLabel, mcpList, googlePlayData) {
  const hasLinear = mcpList.some(m => m.name === 'linear');
  const hasAppsflyer = mcpList.some(m => m.name === 'appsflyer');

  const sourceInstructions = [];
  if (hasLinear) {
    sourceInstructions.push(
      `- Linear: filter by the team named exactly "${appLabel}". Fetch issues with status "In Progress" or "In Review" that have not been updated in 3+ days.`
    );
  }
  if (hasAppsflyer) {
    sourceInstructions.push(
      `- AppsFlyer: find the app whose App ID contains "${appLabel.toLowerCase().replace(/\s+/g, '')}" or a close variant of it (e.g. "thrillzandroid", "playsmart"). Fetch installs and revenue for the last 24h vs 7-day average.`
    );
  }

  const gpSection = googlePlayData && !googlePlayData.error
    ? `\nPre-fetched Google Play data (use this directly, do not re-fetch):\n${JSON.stringify(googlePlayData, null, 2)}`
    : googlePlayData?.error
    ? `\nGoogle Play data fetch failed: ${googlePlayData.error}`
    : '';

  return `You are producing a daily PM digest for the "${appLabel}" product.

${sourceInstructions.length > 0
    ? `Source-specific instructions:\n${sourceInstructions.join('\n')}\n\nUse the MCP tools above to gather real data.`
    : 'No live data sources are connected. Produce a placeholder digest that clearly notes data is unavailable and suggests connecting sources in Settings.'}${gpSection}

Respond ONLY with raw JSON (no markdown fences) matching this exact schema:
{
  "summary": "string",
  "highlights": [{"label": "string", "value": "string", "trend": "up|down|flat", "status": "ok|warning|critical"}],
  "anomalies": [{"title": "string", "detail": "string", "severity": "low|medium|high"}],
  "stale_tickets": [{"id": "string", "title": "string", "assignee": "string", "days_idle": 0, "priority": "urgent|high|medium|low"}]
}`;
}

function useCountUp(target, duration = 700) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (target == null || isNaN(Number(target))) { setValue(target); return; }
    const start = performance.now();
    const num = parseFloat(target);
    const raf = requestAnimationFrame(function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(num * eased);
      if (p < 1) requestAnimationFrame(tick);
      else setValue(num);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--text-3)',
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <span style={{ flex: '0 0 auto' }}>{children}</span>
      <span style={{ height: '1px', background: 'var(--border)', flex: 1 }} />
    </div>
  );
}

function HighlightChip({ item, index }) {
  const raw = String(item.value ?? '');
  const numMatch = raw.match(/^([€$]?)(-?\d+\.?\d*)([%kKmM]?)$/);
  const numericTarget = numMatch ? parseFloat(numMatch[2]) : null;
  const prefix = numMatch ? numMatch[1] : '';
  const suffix = numMatch ? numMatch[3] : '';

  const animated = useCountUp(numericTarget, 700 + index * 80);

  const statusColor = { ok: 'var(--ok)', warning: 'var(--warn)', critical: 'var(--crit)' }[item.status] ?? 'var(--text-1)';
  const trendArrow = item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→';
  const trendColor = item.trend === 'up' ? 'var(--ok)' : item.trend === 'down' ? 'var(--crit)' : 'var(--text-3)';

  const displayValue = numericTarget != null
    ? `${prefix}${suffix.toLowerCase() === '%' ? animated.toFixed(2) : Math.round(animated).toLocaleString('en')}${suffix}`
    : raw;

  return (
    <div
      className="animate-slide-up"
      style={{
        animationDelay: `${index * 50}ms`,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '16px 18px',
        flex: '1 1 150px',
        minWidth: 140,
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
        {item.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, color: statusColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {displayValue}
        </span>
        <span style={{ fontSize: 14, color: trendColor }}>{trendArrow}</span>
      </div>
    </div>
  );
}

function AnomalyItem({ item, index }) {
  const borderColor = { high: 'var(--crit)', medium: 'var(--warn)', low: 'var(--ok)' }[item.severity] ?? 'var(--border)';
  return (
    <div
      className="animate-slide-left"
      style={{
        animationDelay: `${index * 60}ms`,
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{item.title}</span>
        <Badge variant={item.severity}>{item.severity}</Badge>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{item.detail}</div>
    </div>
  );
}

function TicketRow({ ticket }) {
  const priorityBadge = {
    urgent: 'urgent',
    high: 'high',
    medium: 'medium',
    low: 'low',
  }[ticket.priority] || 'neutral';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr 130px 90px 80px',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 'var(--r-md)',
        background: 'var(--bg-elevated)',
        marginBottom: 6,
        alignItems: 'center',
        fontSize: 13,
      }}
    >
      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-text)' }}>
        {ticket.id}
      </code>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--text-1)',
        }}
        title={ticket.title}
      >
        {ticket.title}
      </span>
      <span style={{ color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ticket.assignee || '—'}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--warn)', fontWeight: 500 }}>
        {ticket.days_idle}d idle
      </span>
      <Badge variant={priorityBadge}>{ticket.priority}</Badge>
    </div>
  );
}

export function DigestView({ settings, selectedApp, onOpenSettings }) {
  const { callClaude, parseJSON } = useClaude(settings);
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshedAt, setRefreshedAt] = useState(null);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mcpList = buildMcpList(settings);
      const app = APPS.find(a => a.id === selectedApp);
      const appLabel = app?.label ?? selectedApp;

      // Pre-fetch Google Play data if worker URL and package name are available
      let googlePlayData = null;
      const hasAndroid = app?.platform === 'android' || app?.platform === 'both';
      if (settings.googlePlayWorkerUrl && app?.packageName && hasAndroid) {
        googlePlayData = await fetchGooglePlayMetrics(settings.googlePlayWorkerUrl, app.packageName);
      }

      const prompt = buildDigestPrompt(appLabel, mcpList, googlePlayData);
      const { text } = await callClaude({
        prompt,
        mcpList,
        systemPrompt: DIGEST_SYSTEM_PROMPT,
      });
      const parsed = parseJSON(text);
      setDigest(parsed);
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch digest');
    } finally {
      setLoading(false);
    }
  }, [settings, selectedApp, callClaude, parseJSON]);

  useEffect(() => {
    if (settings?.anthropicKey) {
      fetchDigest();
    }
  }, [selectedApp, settings?.anthropicKey]);

  if (!settings?.anthropicKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          marginBottom: 4,
        }}>
          — API key required —
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 300, color: 'var(--text-1)' }}>
          Connect to get started
        </h3>
        <p style={{ color: 'var(--text-2)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
          Add your Anthropic API key to start generating daily digests.
        </p>
        <Button onClick={onOpenSettings}>Open Settings</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
            Intelligence Brief
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 28, color: 'var(--text-1)', lineHeight: 1.1, marginBottom: 4 }}>
            Daily Digest
          </h2>
          {refreshedAt && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)' }}>
              refreshed {refreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={fetchDigest} loading={loading} size="sm">
          {loading ? (
            <>Refreshing…</>
          ) : (
            <><span style={{ display: 'inline-block' }}>↻</span> Refresh</>
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'var(--crit-dim)',
          border: '1px solid var(--crit)',
          borderRadius: 'var(--r-lg)',
          padding: '16px 20px',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--crit)', marginBottom: 6 }}>
            Error fetching digest
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{error}</div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !digest && (
        <>
          <SkeletonCard />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '16px 18px',
                  flex: '1 1 140px',
                }}
              >
                <Skeleton width={80} height={11} style={{ marginBottom: 10 }} />
                <Skeleton width={60} height={22} />
              </div>
            ))}
          </div>
          <SkeletonCard />
        </>
      )}

      {/* Digest content */}
      {digest && !loading && (
        <>
          {/* Summary */}
          <Card>
            <SectionLabel>Executive Summary</SectionLabel>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.65, color: 'var(--text-1)', fontStyle: 'italic' }}>
              {digest.summary}
            </p>
          </Card>

          {/* Highlights */}
          {digest.highlights?.length > 0 && (
            <div>
              <SectionLabel>Key Metrics</SectionLabel>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {digest.highlights.map((h, i) => (
                  <HighlightChip key={i} item={h} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {digest.anomalies?.length > 0 && (
            <Card>
              <SectionLabel>Anomalies &amp; Alerts</SectionLabel>
              <div>
                {digest.anomalies.map((a, i) => (
                  <AnomalyItem key={i} item={a} index={i} />
                ))}
              </div>
            </Card>
          )}

          {/* Stale tickets */}
          {digest.stale_tickets?.length > 0 && (
            <Card>
              <SectionLabel>Stale Tickets ({digest.stale_tickets.length})</SectionLabel>
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 130px 90px 80px',
                  gap: 12,
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  marginBottom: 6,
                }}
              >
                <span>ID</span>
                <span>Title</span>
                <span>Assignee</span>
                <span>Idle</span>
                <span>Priority</span>
              </div>
              {digest.stale_tickets.map((t, i) => (
                <TicketRow key={i} ticket={t} />
              ))}
            </Card>
          )}

          {/* Empty state */}
          {!digest.anomalies?.length && !digest.stale_tickets?.length && !digest.highlights?.length && (
            <Card style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ok)', marginBottom: 10 }}>
                All Clear
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--text-1)', marginBottom: 8 }}>
                No anomalies or stale tickets found.
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Your product is operating normally.
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
