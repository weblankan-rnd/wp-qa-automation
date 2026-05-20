const EXCLUDED_PATTERNS = [
  /\/wp-content\/uploads\//i,
  /\/wp-json\//i,
  /\/wp-login\.php/i,
  /\/feed\//i,
  /\/trackback\//i,
  /\/xmlrpc\.php/i,
  /\/wp-sitemap/i,
  /\/sitemap\.xml/i,
  /\.(jpg|jpeg|png|gif|svg|webp|css|js|pdf|zip|ico)$/i,
];

const IGNORED_PATHS = [
  '/hello-world/',
];

let cachedPages: string[] | null = null;

async function fetchSitemapUrls(url: string): Promise<string[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) return [];

  const xml = await response.text();
  const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = locs.map(m => m.replace(/<\/?loc>/g, '').trim());

  // Check if this is a sitemap index (contains sub-sitemaps)
  const isIndex = /<sitemapindex\b/i.test(xml);
  if (isIndex) {
    const subPaths: string[] = [];
    for (const subUrl of urls) {
      const subResults = await fetchSitemapUrls(subUrl);
      subPaths.push(...subResults);
    }
    return subPaths;
  }

  return urls;
}

export async function getPages(): Promise<string[]> {
  if (cachedPages) return cachedPages;

  const baseUrl = process.env.BASE_URL || '';
  if (!baseUrl) {
    cachedPages = ['/'];
    return cachedPages;
  }

  try {
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const urls = await fetchSitemapUrls(sitemapUrl);

    const candidates = urls
      .map(url => {
        try { return { path: new URL(url).pathname, full: url }; } catch { return null; }
      })
      .filter((e): e is { path: string; full: string } =>
        e !== null &&
        e.path !== '/' &&
        !EXCLUDED_PATTERNS.some(r => r.test(e.path)) &&
        !IGNORED_PATHS.includes(e.path)
      )
      .filter((e, i, arr) => arr.findIndex(x => x.path === e.path) === i)
      .slice(0, 30);

    // Verify each page actually returns 200 before including it
    const verified = await Promise.all(
      candidates.map(async ({ path, full }) => {
        try {
          const res = await fetch(full, { method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow' });
          return res.ok ? path : null;
        } catch {
          return null;
        }
      })
    );

    const paths = verified.filter((p): p is string => p !== null).slice(0, 20);
    console.log(`[get-pages] Verified ${paths.length}/${candidates.length} pages as reachable`);

    cachedPages = ['/', ...paths];
    return cachedPages;
  } catch (err) {
    console.warn(`[get-pages] Could not fetch sitemap: ${err}`);
    cachedPages = ['/'];
    return cachedPages;
  }
}
