import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

const LINK_TIMEOUT_MS = 8000;
const BATCH_SIZE = 10; // check 10 links at a time to avoid blowing the test timeout

test.describe('Broken Links', () => {
  for (const pagePath of pagesToCheck) {
    test(`no broken links on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page }) => {
      // Generous timeout: page load + batched network checks
      test.setTimeout(120000);

      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

      const hrefs: string[] = await page.evaluate(() =>
        [...document.querySelectorAll('a[href]')]
          .map(a => (a as HTMLAnchorElement).href)
          .filter(h => h.startsWith('http'))
      );

      const unique = [...new Set(hrefs)].slice(0, 50);

      // Split into batches so a single slow external domain can't hold up everything
      const broken: string[] = [];
      for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        const batch = unique.slice(i, i + BATCH_SIZE);
        const batchResults: string[] = await page.evaluate(
          async ([urls, timeout]) => {
            const bad: string[] = [];
            await Promise.all(
              urls.map(async (url: string) => {
                try {
                  const r = await fetch(url, {
                    method: 'HEAD',
                    redirect: 'follow',
                    signal: AbortSignal.timeout(timeout as number),
                  });
                  if (r.status >= 400) {
                    bad.push(`${url} → ${r.status}`);
                  } else if (r.redirected && r.url !== url) {
                    const dest = r.url.toLowerCase();
                    if (dest.includes('404') || dest.includes('not-found')) {
                      bad.push(`${url} → redirects to error page: ${r.url}`);
                    }
                  }
                } catch {
                  try {
                    const r2 = await fetch(url, {
                      method: 'GET',
                      redirect: 'follow',
                      signal: AbortSignal.timeout(timeout as number),
                    });
                    if (r2.status >= 400) bad.push(`${url} → ${r2.status}`);
                  } catch {
                    bad.push(`${url} → connection error`);
                  }
                }
              })
            );
            return bad;
          },
          [batch, LINK_TIMEOUT_MS] as [string[], number]
        );
        broken.push(...batchResults);
      }

      expect(
        broken,
        `Broken links on ${pagePath}:\n${broken.join('\n')}`
      ).toHaveLength(0);
    });
  }
});
