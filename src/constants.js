export const APPS = [
  { id: "thrillz-android", label: "Thrillz Android", platform: "android", group: "Thrillz",    packageName: "com.dollygg.thrillz" },
  { id: "thrillz-ios",     label: "Thrillz iOS",     platform: "ios",     group: "Thrillz" },
  { id: "play-smart",      label: "Play Smart",       platform: "both",    group: "Play Smart", packageName: "gg.dolly.playsmart" },
  { id: "checkmate-chess", label: "Checkmate Chess",  platform: "both",    group: "Play Smart", packageName: "gg.dolly.checkmatchess" },
  { id: "fish-escape",     label: "Fish Escape",      platform: "both",    group: "Play Smart", packageName: "gg.dolly.fishescape" },
  { id: "knife-king",      label: "Knife King",       platform: "both",    group: "Play Smart", packageName: "gg.dolly.knifeking" },
  { id: "mahjong-mania",   label: "Mahjong Mania",    platform: "both",    group: "Play Smart", packageName: "gg.dolly.mahjongmania" },
  { id: "riddle-rails",    label: "Riddle Rails",     platform: "both",    group: "Play Smart", packageName: "gg.dolly.riddlerails" },
];

export const SOURCES = {
  linear:     { id: "linear",     label: "Linear",      initial: "L", iconBg: "rgba(94,106,210,0.18)",  iconColor: "#8b96f0", mcpUrl: "https://mcp.linear.app/mcp",         requiredKey: "linearToken",        description: "Issues & stale tickets" },
  sentry:     { id: "sentry",     label: "Sentry",      initial: "S", iconBg: "rgba(248,113,113,0.15)", iconColor: "#f87171", mcpUrl: "https://mcp.sentry.dev/mcp",          requiredKey: "sentryToken",         description: "Crash rates & ANR", comingSoon: true },
  devtodev:   { id: "devtodev",   label: "DevToDev",    initial: "D", iconBg: "rgba(96,165,250,0.15)",  iconColor: "#60a5fa", mcpUrl: null,                                  requiredKey: "devtodevToken",       description: "DAU & session data", comingSoon: true },
  appsflyer:  { id: "appsflyer",  label: "AppsFlyer",   initial: "A", iconBg: "rgba(52,211,153,0.15)",  iconColor: "#34d399", mcpUrl: "https://mcp.appsflyer.com/auth/mcp",  requiredKey: "appsflyerToken",      description: "Installs & revenue" },
  appstore:   { id: "appstore",   label: "App Store",   initial: "A", iconBg: "rgba(200,200,200,0.12)", iconColor: "#b0b8c8", mcpUrl: null,                                  requiredKey: "appstoreKey",         comingSoon: true },
  googleplay: { id: "googleplay", label: "Google Play", initial: "G", iconBg: "rgba(52,211,153,0.15)",  iconColor: "#34d399", mcpUrl: null,                                  requiredKey: "googlePlayWorkerUrl", description: "Crashes, ANR, reviews", appScoped: true, fieldType: "url" },
};

export const TRENDING_GAMES = [
  { rank: 1, name: "Candy Surge",      developer: "SweetByte Games", genre: "Casual", rating: 4.8, reviews: "142K", tag: "vibe",   fresh: true,  initial: "C", iconBg: "linear-gradient(135deg,#ff6b9d,#ff9a3c)" },
  { rank: 2, name: "Block Blast Hero", developer: "PuzzleCraft",     genre: "Puzzle", rating: 4.7, reviews: "98K",  tag: "proper", fresh: false, initial: "B", iconBg: "linear-gradient(135deg,#667eea,#764ba2)" },
  { rank: 3, name: "Merge Manor Plus", developer: "CozyDev Studio",  genre: "Merge",  rating: 4.6, reviews: "211K", tag: "vibe",   fresh: false, initial: "M", iconBg: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { rank: 4, name: "Stack Tower Rush", developer: "ArcadeAtom",      genre: "Arcade", rating: 4.5, reviews: "67K",  tag: "proper", fresh: true,  initial: "S", iconBg: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { rank: 5, name: "Word Wizard Pro",  developer: "LexiLabs",        genre: "Word",   rating: 4.7, reviews: "189K", tag: "proper", fresh: false, initial: "W", iconBg: "linear-gradient(135deg,#4facfe,#00f2fe)" },
  { rank: 6, name: "Tile Tap Frenzy",  developer: "PixelPop",        genre: "Casual", rating: 4.4, reviews: "54K",  tag: "vibe",   fresh: true,  initial: "T", iconBg: "linear-gradient(135deg,#f953c6,#b91d73)" },
  { rank: 7, name: "Zen Garden Match", developer: "MindfulMobile",   genre: "Puzzle", rating: 4.6, reviews: "76K",  tag: "vibe",   fresh: false, initial: "Z", iconBg: "linear-gradient(135deg,#a8edea,#fed6e3)" },
  { rank: 8, name: "Neon Snake Arena", developer: "RetroForge",      genre: "Arcade", rating: 4.3, reviews: "32K",  tag: "proper", fresh: true,  initial: "N", iconBg: "linear-gradient(135deg,#c6ffdd,#f7797d)" },
];

export const DIGEST_SYSTEM_PROMPT = `You are an expert Product Manager analyst. Your job is to analyze data from PM tools and produce a concise, actionable daily digest.

When given access to MCP tools, use them to gather real data. If no tools are available or return data, produce a realistic placeholder digest that makes it clear the data could not be fetched.

Always respond with valid JSON in EXACTLY this shape — no extra commentary, no markdown fences, just the raw JSON object:
{
  "summary": "1-2 sentence executive overview of current product health",
  "highlights": [
    {"label": "string", "value": "string", "trend": "up|down|flat", "status": "ok|warning|critical"}
  ],
  "anomalies": [
    {"title": "string", "detail": "string", "severity": "low|medium|high"}
  ],
  "stale_tickets": [
    {"id": "string", "title": "string", "assignee": "string", "days_idle": <number>, "priority": "urgent|high|medium|low"}
  ]
}`;

export const CHAT_SYSTEM_PROMPT = `You are an expert Product Manager AI assistant embedded in PM IntelliHub. You have access to connected data sources and can answer questions about product health, tickets, user metrics, acquisition, and more.

Be concise and actionable. Use bullet points and headers where helpful. If you need data from a tool, use it. If a source is not connected, say so clearly and suggest the user connect it in Settings.`;

export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const CLAUDE_MODEL = "claude-sonnet-4-6";
