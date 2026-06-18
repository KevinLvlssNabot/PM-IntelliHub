// Genres that match Play Smart's casual / short-loop platform
const PLAY_SMART_GENRES = new Set([
  'Puzzle', 'Casual', 'Arcade', 'Board', 'Card', 'Dice',
  'Word', 'Trivia', 'Educational', 'Family', 'Kids', 'Music',
]);

const APPSTORE_GAMES_RSS = 'https://rss.applemarketingtools.com/api/v2/us/apps/top-free/100/apps.json';
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

/**
 * Fetches the App Store top-chart games released in the last ~30 days
 * and filters them down to casual/puzzle genres that fit Play Smart.
 */
export async function fetchAppStoreTrending(limit = 10) {
  const rssRes = await fetch(APPSTORE_GAMES_RSS);
  if (!rssRes.ok) throw new Error(`App Store RSS returned ${rssRes.status}`);
  const rssData = await rssRes.json();

  const entries = (rssData.feed?.results ?? []).map((e, i) => ({
    id: e.id,
    name: e.name ?? '',
    artist: e.artistName ?? '',
    releaseDateStr: e.releaseDate ?? '',
    icon: e.artworkUrl100 ?? null,
    rssGenre: e.genres?.[0]?.name ?? '',
    chartRank: i + 1,
  })).filter(e => e.id);

  // Prefer games released within 30 days; loosen window progressively if too few
  let recent = [];
  for (const days of [30, 60, 90]) {
    const cutoff = Date.now() - days * 86_400_000;
    recent = entries.filter(e => {
      const ms = new Date(e.releaseDateStr).getTime();
      return !isNaN(ms) && ms >= cutoff;
    });
    if (recent.length >= 5) break;
  }

  // Last resort: take top 20 by most-recent release date regardless of age
  if (recent.length < 3) {
    recent = [...entries]
      .sort((a, b) => {
        const da = new Date(a.releaseDateStr).getTime() || 0;
        const db = new Date(b.releaseDateStr).getTime() || 0;
        return db - da;
      })
      .slice(0, 20);
  }

  // Batch lookup for rating, detailed genre, and proper icon
  const ids = recent.slice(0, 60).map(e => e.id).join(',');
  const lookupMap = {};
  try {
    const lr = await fetch(`${ITUNES_LOOKUP}?id=${ids}&country=us`);
    if (lr.ok) {
      const ld = await lr.json();
      (ld.results ?? []).forEach(r => { lookupMap[String(r.trackId)] = r; });
    }
  } catch {
    // Proceed with RSS-only data if lookup fails
  }

  return recent
    .map(e => {
      const d = lookupMap[e.id];
      const genre = d?.primaryGenreName ?? e.rssGenre;
      if (genre && !PLAY_SMART_GENRES.has(genre)) return null;
      return {
        rank: e.chartRank,
        name: d?.trackName ?? e.name,
        developer: d?.sellerName ?? d?.artistName ?? e.artist,
        genre: genre || 'Games',
        rating: d?.averageUserRating ?? null,
        reviewCount: d?.userRatingCount ?? null,
        releaseDate: (d?.releaseDate ?? e.releaseDateStr).split('T')[0],
        icon: d?.artworkUrl100 ?? e.icon ?? null,
        storeUrl: d?.trackViewUrl ?? null,
        platform: 'ios',
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Uses Claude to surface trending casual/puzzle games on Google Play,
 * including a build-complexity assessment for each title.
 * Clearly labelled in the UI as AI market analysis.
 */
export async function fetchGooglePlayTrending(callClaude, parseJSON, limit = 10) {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

  const prompt = `Today is ${today}. You are a senior mobile games market analyst and developer.

Identify the top ${limit} trending casual/puzzle games on Google Play Store that:
- Were originally released between ${monthAgo} and ${today} (within the last 30 days)
- Are performing well on the charts — top rankings in their category
- Suit short-session gameplay: puzzle, casual, arcade, word, trivia, board, card
- Explicitly exclude: action-heavy combat, battle royales, full RPGs, sports sims, Fortnite/Pokémon-style titles

For each game also assess build complexity from a small studio perspective:
- "vibe": Prototypable in 1-3 days with AI-assisted coding. Criteria: single core mechanic, tap/swipe input, grid or minimal state, no physics engine, no real-time networking, deterministic gameplay.
- "dev": Requires dedicated engineering. Criteria: physics simulation, real-time systems, complex animations, procedural generation, multiplayer, significant state management.

Respond ONLY with a raw JSON array — no markdown fences, no explanation:
[{
  "rank": 1,
  "name": "string",
  "developer": "string",
  "genre": "Puzzle|Casual|Arcade|Word|Trivia|Board|Card|Educational",
  "rating": 4.3,
  "reviewCount": 8500,
  "releaseDate": "YYYY-MM-DD",
  "description": "One sentence on why this game is charting well",
  "buildComplexity": "vibe|dev",
  "complexityReason": "One sentence on what makes it quick-build or engineering-heavy"
}]`;

  const { text } = await callClaude({ prompt });
  const games = parseJSON(text);
  return Array.isArray(games)
    ? games.slice(0, limit).map((g, i) => ({
        ...g,
        platform: 'android',
        rank: g.rank ?? i + 1,
        icon: null,
      }))
    : [];
}

/**
 * Batch-assesses build complexity for App Store games via Claude.
 * Returns a map of { [rank]: { complexity: "vibe"|"dev", reason: string } }.
 */
export async function assessAppStoreComplexity(callClaude, parseJSON, games) {
  if (!games || games.length === 0) return {};

  const list = games.map(g => `${g.rank}. "${g.name}" (${g.genre})`).join('\n');

  const prompt = `You are a mobile game developer at a small studio that uses AI-assisted ("vibe coding") tools.

Assess the build complexity of each game listed below:
- "vibe": Prototypable in 1-3 days with AI tools. Single core mechanic, tap/swipe/tilt input, grid or minimal state, no physics engine, no real-time networking, deterministic.
- "dev": Requires dedicated engineering effort. Physics simulation, real-time systems, complex animations, procedural generation, multiplayer, significant state management.

Games:
${list}

Respond ONLY with raw JSON (no markdown), mapping each rank number to its assessment:
{"1": {"complexity": "vibe", "reason": "one sentence"}, "2": {"complexity": "dev", "reason": "one sentence"}}`;

  const { text } = await callClaude({ prompt });
  return parseJSON(text);
}
