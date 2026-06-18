export async function fetchGooglePlayMetrics(workerUrl, packageName) {
  if (!workerUrl || !packageName) return null;
  try {
    const url = `${workerUrl.replace(/\/$/, '')}/metrics?package=${encodeURIComponent(packageName)}&days=7`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
