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

    const paths = urls
      .map(url => {
        try { return new URL(url).pathname; } catch { return null; }
      })
      .filter((p): p is string =>
        p !== null &&
        p !== '/' &&
        !EXCLUDED_PATTERNS.some(r => r.test(p))
      )
      .filter((p, i, arr) => arr.indexOf(p) === i)
      .slice(0, 20); // cap to avoid timeouts

    cachedPages = ['/', ...paths];
    return cachedPages;
  } catch (err) {
    console.warn(`[get-pages] Could not fetch sitemap: ${err}`);
    cachedPages = ['/'];
    return cachedPages;
  }
}
