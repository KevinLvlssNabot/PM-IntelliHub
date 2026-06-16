// Genres that match Play Smart's casual / short-loop platform
const PLAY_SMART_GENRES = new Set([
  'Puzzle', 'Casual', 'Arcade', 'Board', 'Card', 'Dice',
  'Word', 'Trivia', 'Educational', 'Family', 'Kids', 'Music',
]);

const ITUNES_GAMES_RSS = 'https://itunes.apple.com/us/rss/topfreegames/limit=100/json';
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

/**
 * Fetches the App Store top-chart games released in the last ~30 days
 * and filters them down to casual/puzzle genres that fit Play Smart.
 */
export async function fetchAppStoreTrending(limit = 10) {
  const rssRes = await fetch(ITUNES_GAMES_RSS);
  if (!rssRes.ok) throw new Error(`App Store RSS returned ${rssRes.status}`);
  const rssData = await rssRes.json();

  const entries = (rssData.feed?.entry ?? []).map((e, i) => {
    const images = e['im:image'] ?? [];
    return {
      id: e['im:id']?.label,
      name: e['im:name']?.label ?? '',
      artist: e['im:artist']?.label ?? '',
      releaseDateStr: e['im:releaseDate']?.label ?? '',
      icon: images[images.length - 1]?.label ?? images[0]?.label ?? null,
      rssGenre: e['category']?.attributes?.term ?? '',
      chartRank: i + 1,
    };
  }).filter(e => e.id);

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
 * Uses Claude to surface trending casual/puzzle games on Google Play.
 * Returns AI-curated market intelligence — clearly labelled in the UI as such.
 */
export async function fetchGooglePlayTrending(callClaude, parseJSON, limit = 10) {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0];

  const prompt = `Today is ${today}. You are a senior mobile games market analyst.

Identify the top ${limit} trending casual/puzzle games on Google Play Store that:
- Were originally released between ${monthAgo} and ${today} (within the last 30 days)
- Are performing well on the charts — top rankings in their category
- Suit short-session gameplay: puzzle, casual, arcade, word, trivia, board, card
- Explicitly exclude: action-heavy combat, battle royales, full RPGs, sports sims, Fortnite/Pokémon-style titles

Use your most current market knowledge. If uncertain about exact release dates, estimate based on known chart patterns.

Respond ONLY with a raw JSON array — no markdown fences, no explanation:
[{
  "rank": 1,
  "name": "string",
  "developer": "string",
  "genre": "Puzzle|Casual|Arcade|Word|Trivia|Board|Card|Educational",
  "rating": 4.3,
  "reviewCount": 8500,
  "releaseDate": "YYYY-MM-DD",
  "description": "One sentence on why this game is charting well"
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
