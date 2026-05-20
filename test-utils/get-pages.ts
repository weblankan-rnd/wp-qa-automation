const EXCLUDED_PATTERNS = [
  /\/wp-content\/uploads\//i,
  /\/wp-json\//i,
  /\/wp-login\.php/i,
  /\/feed\//i,
  /\/trackback\//i,
  /\/xmlrpc\.php/i,
  /\.(jpg|jpeg|png|gif|svg|webp|css|js|pdf|zip|ico)$/i,
];

let cachedPages: string[] | null = null;

export async function getPages(): Promise<string[]> {
  if (cachedPages) return cachedPages;

  const baseUrl = process.env.BASE_URL || '';
  if (!baseUrl) {
    cachedPages = ['/'];
    return cachedPages;
  }

  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Sitemap returned ${response.status}`);

    const xml = await response.text();
    const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    const urls = locs.map(m => m.replace(/<\/?loc>/g, '').trim());

    const paths = urls
      .map(url => {
        try { return new URL(url).pathname; } catch { return null; }
      })
      .filter((p): p is string =>
        p !== null &&
        p !== '/' &&
        !EXCLUDED_PATTERNS.some(r => r.test(p))
      )
      .filter((p, i, arr) => arr.indexOf(p) === i);

    cachedPages = ['/', ...paths];
    return cachedPages;
  } catch (err) {
    console.warn(`[get-pages] Could not fetch sitemap: ${err}`);
    cachedPages = ['/'];
    return cachedPages;
  }
}
