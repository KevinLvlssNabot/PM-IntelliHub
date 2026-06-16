export const APPS = [
  { id: "thrillz-android", label: "Thrillz Android", platform: "android", group: "Thrillz",   packageName: "com.dollygg.thrillz" },
  { id: "thrillz-ios",     label: "Thrillz iOS",     platform: "ios",     group: "Thrillz" },
  { id: "play-smart",      label: "Play Smart",       platform: "both",    group: "Play Smart", packageName: "gg.dolly.playsmart" },
  { id: "checkmate-chess", label: "Checkmate Chess",  platform: "both",    group: "Play Smart", packageName: "gg.dolly.checkmatchess" },
  { id: "fish-escape",     label: "Fish Escape",      platform: "both",    group: "Play Smart", packageName: "gg.dolly.fishescape" },
  { id: "knife-king",      label: "Knife King",       platform: "both",    group: "Play Smart", packageName: "gg.dolly.knifeking" },
  { id: "mahjong-mania",   label: "Mahjong Mania",    platform: "both",    group: "Play Smart", packageName: "gg.dolly.mahjongmania" },
  { id: "riddle-rails",    label: "Riddle Rails",     platform: "both",    group: "Play Smart", packageName: "gg.dolly.riddlerails" },
];

export const SOURCES = {
  linear:       { id: "linear",     label: "Linear",        icon: "🎫", mcpUrl: "https://mcp.linear.app/mcp",         requiredKey: "linearToken",   description: "Issues & stale tickets" },
  sentry:       { id: "sentry",     label: "Sentry",        icon: "🔴", mcpUrl: "https://mcp.sentry.dev/mcp",          requiredKey: "sentryToken",    description: "Crash rates & ANR", comingSoon: true },
  devtodev:     { id: "devtodev",   label: "DevToDev",      icon: "🎮", mcpUrl: null,                                 requiredKey: "devtodevToken",  description: "DAU & session data", comingSoon: true },
  appsflyer:    { id: "appsflyer",  label: "AppsFlyer",     icon: "📥", mcpUrl: "https://mcp.appsflyer.com/auth/mcp", requiredKey: "appsflyerToken", description: "Installs & revenue" },
  appstore:     { id: "appstore",   label: "App Store",     icon: "🍎", mcpUrl: null, requiredKey: "appstoreKey",        comingSoon: true },
  googleplay:   { id: "googleplay", label: "Google Play",   icon: "🤖", mcpUrl: null, requiredKey: "googlePlayWorkerUrl", description: "Crashes, ANR, reviews", appScoped: true, fieldType: "url" },
};

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
