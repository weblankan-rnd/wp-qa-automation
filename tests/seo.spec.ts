import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

const isArchivePage = (p: string) =>
  p.startsWith('/category/') || p.startsWith('/tag/') || p.startsWith('/author/');

test.describe('SEO Tags', () => {
  for (const pagePath of pagesToCheck) {
    const label = pagePath === '/' ? 'homepage' : pagePath;
    const isArchive = isArchivePage(pagePath);

    test(`SEO checks on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

      await test.step('title length 10–70 chars', async () => {
        const title = await page.title();
        if (!title) { console.warn(`[SEO] Missing title on ${pagePath}`); return; }
        if (title.length < 10) console.warn(`[SEO] Title too short on ${pagePath}: "${title}" (${title.length} chars)`);
        if (title.length > 70) console.warn(`[SEO] Title too long on ${pagePath}: "${title}" (${title.length} chars)`);
      });

      await test.step('meta description 50–160 chars', async () => {
        const desc = await page.getAttribute('meta[name="description"]', 'content');
        if (!desc) { console.warn(`[SEO] Missing meta description on ${pagePath}`); return; }
        if (desc.length < 50) console.warn(`[SEO] Meta description too short on ${pagePath} (${desc.length} chars)`);
        if (desc.length > 160) console.warn(`[SEO] Meta description too long on ${pagePath} (${desc.length} chars)`);
      });

      await test.step('canonical URL is absolute', async () => {
        const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
        if (!canonical) { console.warn(`[SEO] Missing canonical tag on ${pagePath}`); return; }
        if (!/^https?:\/\//.test(canonical)) console.warn(`[SEO] Canonical is not absolute on ${pagePath}: ${canonical}`);
      });

      await test.step('Open Graph tags present', async () => {
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
        const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
        const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');
        if (!ogTitle) console.warn(`[SEO] Missing og:title on ${pagePath}`);
        if (!ogDesc) console.warn(`[SEO] Missing og:description on ${pagePath}`);
        if (!ogImage) console.warn(`[SEO] Missing og:image on ${pagePath}`);
        if (!ogUrl) console.warn(`[SEO] Missing og:url on ${pagePath}`);
      });

      await test.step('exactly one H1', async () => {
        const h1Count = await page.locator('h1').count();
        if (h1Count === 0) console.warn(`[SEO] No H1 found on ${pagePath}`);
        if (h1Count > 1) console.warn(`[SEO] Multiple H1s (${h1Count}) on ${pagePath}`);
      });

      await test.step('all images have alt attributes', async () => {
        const missingAlt: string[] = await page.evaluate(() =>
          [...document.querySelectorAll('img')]
            .filter(img => !img.getAttribute('alt') && img.src && !img.src.startsWith('data:'))
            .map(img => img.src)
        );
        if (missingAlt.length > 0) {
          console.warn(`[SEO] Images missing alt on ${pagePath}:\n${missingAlt.join('\n')}`);
        }
      });

      if (pagePath === '/') {
        await test.step('robots meta does not contain noindex', async () => {
          const robots = await page.getAttribute('meta[name="robots"]', 'content');
          if (robots?.toLowerCase().includes('noindex')) {
            console.warn(`[SEO] Homepage robots meta contains noindex: "${robots}"`);
          }
        });
      }
    });
  }
});
