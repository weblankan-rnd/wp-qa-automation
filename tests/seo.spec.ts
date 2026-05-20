import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { IGNORED_PATHS } from '../test-utils/ignored-paths';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = (existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/']).filter((p: string) => !IGNORED_PATHS.includes(p));

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
        if (!title) { console.error(`[ISSUE][SEO] Missing <title> on ${pagePath}`); return; }
        if (title.length < 10) console.error(`[ISSUE][SEO] Title too short on ${pagePath}: "${title}" (${title.length} chars, min 10)`);
        if (title.length > 70) console.error(`[ISSUE][SEO] Title too long on ${pagePath}: "${title}" (${title.length} chars, max 70)`);
      });

      await test.step('meta description 50–160 chars', async () => {
        const desc = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => null);
        if (!desc) { console.error(`[ISSUE][SEO] Missing meta description on ${pagePath}`); return; }
        if (desc.length < 50) console.error(`[ISSUE][SEO] Meta description too short on ${pagePath} (${desc.length} chars, min 50)`);
        if (desc.length > 160) console.error(`[ISSUE][SEO] Meta description too long on ${pagePath} (${desc.length} chars, max 160)`);
      });

      await test.step('canonical URL is absolute', async () => {
        const canonical = await page.$eval('link[rel="canonical"]', el => el.getAttribute('href')).catch(() => null);
        if (!canonical) { console.error(`[ISSUE][SEO] Missing canonical tag on ${pagePath}`); return; }
        if (!/^https?:\/\//.test(canonical)) console.error(`[ISSUE][SEO] Canonical is not an absolute URL on ${pagePath}: "${canonical}"`);
      });

      await test.step('Open Graph tags present', async () => {
        const ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content')).catch(() => null);
        const ogDesc = await page.$eval('meta[property="og:description"]', el => el.getAttribute('content')).catch(() => null);
        const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content')).catch(() => null);
        const ogUrl = await page.$eval('meta[property="og:url"]', el => el.getAttribute('content')).catch(() => null);
        const prefix = isArchive ? console.warn : console.error;
        const tag = isArchive ? '[SEO]' : '[ISSUE][SEO]';
        if (!ogTitle) prefix(`${tag} Missing og:title on ${pagePath}`);
        if (!ogDesc) prefix(`${tag} Missing og:description on ${pagePath}`);
        if (!ogImage) prefix(`${tag} Missing og:image on ${pagePath}`);
        if (!ogUrl) prefix(`${tag} Missing og:url on ${pagePath}`);
      });

      await test.step('exactly one H1', async () => {
        const h1Count = await page.locator('h1').count();
        if (h1Count === 0) console.error(`[ISSUE][SEO] No H1 found on ${pagePath}`);
        if (h1Count > 1) console.error(`[ISSUE][SEO] Multiple H1 tags (${h1Count}) found on ${pagePath}`);
      });

      await test.step('all images have alt attributes', async () => {
        const missingAlt: string[] = await page.evaluate(() =>
          [...document.querySelectorAll('img')]
            .filter(img => !img.getAttribute('alt') && img.src && !img.src.startsWith('data:'))
            .map(img => img.src)
        );
        if (missingAlt.length > 0) {
          console.error(`[ISSUE][SEO] Images missing alt attribute on ${pagePath}:\n${missingAlt.map(s => `  - ${s}`).join('\n')}`);
        }
      });

      if (pagePath === '/') {
        await test.step('robots meta does not contain noindex', async () => {
          const robots = await page.$eval('meta[name="robots"]', el => el.getAttribute('content')).catch(() => null);
          if (robots?.toLowerCase().includes('noindex')) {
            console.error(`[ISSUE][SEO] Homepage robots meta contains "noindex": "${robots}"`);
          }
        });
      }
    });
  }
});
