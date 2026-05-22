import { IGNORED_PATHS } from './ignored-paths';

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

function isExcluded(path: string): boolean {
  return (
    EXCLUDED_PATTERNS.some(r => r.test(path)) ||
    IGNORED_PATHS.includes(path)
  );
}

function parsePagesEnv(raw: string): string[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.startsWith('/'))
    .filter(l => !isExcluded(l))
    .filter((l, i, arr) => arr.indexOf(l) === i);
}

async function crawlLinks(baseUrl: string, maxPages = 25): Promise<string[]> {
  const baseHost = new URL(baseUrl).hostname;
  const visited = new Set<string>(['/']);
  const queue: string[] = [baseUrl];
  const found: string[] = [];

  while (queue.length > 0 && found.length < maxPages) {
    const url = queue.shift()!;
    let html: string;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'follow' });
      if (!res.ok) continue;
      html = await res.text();
    } catch {
      continue;
    }

    const hrefMatches = html.matchAll(/href=["']([^"'#?][^"']*?)["']/gi);
    for (const [, href] of hrefMatches) {
      let path: string;
      try {
        const resolved = new URL(href, baseUrl);
        if (resolved.hostname !== baseHost) continue;
        path = resolved.pathname;
      } catch {
        if (!href.startsWith('/')) continue;
        path = href.split('?')[0].split('#')[0];
      }

      if (!path.endsWith('/') && !path.includes('.')) path += '/';
      if (visited.has(path) || isExcluded(path) || path === '/') continue;
      visited.add(path);

      const fullUrl = `${baseUrl}${path}`;
      try {
        const check = await fetch(fullUrl, { method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow' });
        if (check.ok) {
          found.push(path);
          if (found.length < maxPages) queue.push(fullUrl);
        }
      } catch {
        // skip unreachable
      }
    }
  }

  return found;
}

async function fetchSitemapUrls(url: string): Promise<string[]> {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) return [];

  const xml = await response.text();
  const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = locs.map(m => m.replace(/<\/?loc>/g, '').trim());

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

async function discoverViaSitemap(baseUrl: string): Promise<string[] | null> {
  try {
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const urls = await fetchSitemapUrls(sitemapUrl);
    if (urls.length === 0) return null;

    const baseHost = new URL(baseUrl).hostname;
    const candidates = urls
      .map(url => {
        try {
          const u = new URL(url);
          if (u.hostname !== baseHost) return null;
          return { path: u.pathname, full: url };
        } catch { return null; }
      })
      .filter((e): e is { path: string; full: string } =>
        e !== null && e.path !== '/' && !isExcluded(e.path)
      )
      .filter((e, i, arr) => arr.findIndex(x => x.path === e.path) === i)
      .slice(0, 30);

    const verified = await Promise.all(
      candidates.map(async ({ path, full }) => {
        try {
          const res = await fetch(full, { method: 'HEAD', signal: AbortSignal.timeout(8000), redirect: 'follow' });
          return res.ok ? path : null;
        } catch { return null; }
      })
    );

    const paths = verified.filter((p): p is string => p !== null).slice(0, 20);
    console.log(`[get-pages] Sitemap: verified ${paths.length}/${candidates.length} pages`);
    return paths.length > 0 ? paths : null;
  } catch {
    return null;
  }
}

export async function getPages(): Promise<string[]> {
  if (cachedPages) return cachedPages;

  const baseUrl = process.env.BASE_URL || '';

  // If PAGES env var is set, use it directly — skip sitemap/crawl
  const pagesEnv = process.env.PAGES || '';
  if (pagesEnv.trim()) {
    const parsed = parsePagesEnv(pagesEnv);
    // Always ensure / is first
    const pages = parsed.includes('/') ? parsed : ['/', ...parsed];
    console.log(`[get-pages] Using PAGES from env (${pages.length} pages)`);
    cachedPages = pages;
    return cachedPages;
  }

  if (!baseUrl) {
    cachedPages = ['/'];
    return cachedPages;
  }

  // Auto-discover: try sitemap first, fall back to link crawling
  let paths = await discoverViaSitemap(baseUrl);

  if (!paths) {
    console.log('[get-pages] Sitemap unavailable or empty — falling back to link crawl');
    try {
      paths = await crawlLinks(baseUrl, 20);
      console.log(`[get-pages] Crawl found ${paths.length} pages`);
    } catch (err) {
      console.warn(`[get-pages] Link crawl failed: ${err}`);
      paths = [];
    }
  }

  cachedPages = ['/', ...paths];
  return cachedPages;
}
