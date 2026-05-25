import { test, expect } from '@playwright/test';
import { getPagesToCheck, isArchivePage, pageLabel } from '../test-utils/get-pages-to-check';

const pagesToCheck = getPagesToCheck();

test.describe('SEO Tags', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);
    const isArchive = isArchivePage(pagePath);

    test(`SEO checks on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

      await test.step('title length 10–70 chars', async () => {
        const title = await page.title();
        if (!title) {
          expect.soft(false, `[SEO] Missing <title> on ${pagePath}`).toBeTruthy();
          return;
        }
        if (title.length < 10)
          expect.soft(
            false,
            `[SEO] Title too short on ${pagePath}: "${title}" (${title.length} chars, min 10)`
          ).toBeTruthy();
        if (title.length > 70)
          expect.soft(
            false,
            `[SEO] Title too long on ${pagePath}: "${title}" (${title.length} chars, max 70)`
          ).toBeTruthy();
      });

      await test.step('meta description 50–160 chars', async () => {
        const desc = await page
          .$eval('meta[name="description"]', (el) => el.getAttribute('content'))
          .catch(() => null);
        if (!desc) {
          expect
            .soft(false, `[SEO] Missing meta description on ${pagePath}`)
            .toBeTruthy();
          return;
        }
        if (desc.length < 50)
          expect
            .soft(
              false,
              `[SEO] Meta description too short on ${pagePath} (${desc.length} chars, min 50)`
            )
            .toBeTruthy();
        if (desc.length > 160)
          expect
            .soft(
              false,
              `[SEO] Meta description too long on ${pagePath} (${desc.length} chars, max 160)`
            )
            .toBeTruthy();
      });

      await test.step('canonical URL is absolute', async () => {
        const canonical = await page
          .$eval('link[rel="canonical"]', (el) => el.getAttribute('href'))
          .catch(() => null);
        if (!canonical) {
          expect
            .soft(false, `[SEO] Missing canonical tag on ${pagePath}`)
            .toBeTruthy();
          return;
        }
        if (!/^https?:\/\//.test(canonical))
          expect
            .soft(
              false,
              `[SEO] Canonical is not an absolute URL on ${pagePath}: "${canonical}"`
            )
            .toBeTruthy();
      });

      await test.step('Open Graph tags present', async () => {
        const ogTitle = await page
          .$eval('meta[property="og:title"]', (el) => el.getAttribute('content'))
          .catch(() => null);
        const ogDesc = await page
          .$eval('meta[property="og:description"]', (el) => el.getAttribute('content'))
          .catch(() => null);
        const ogImage = await page
          .$eval('meta[property="og:image"]', (el) => el.getAttribute('content'))
          .catch(() => null);
        const ogUrl = await page
          .$eval('meta[property="og:url"]', (el) => el.getAttribute('content'))
          .catch(() => null);

        if (!isArchive) {
          if (!ogTitle)
            expect
              .soft(false, `[SEO] Missing og:title on ${pagePath}`)
              .toBeTruthy();
          if (!ogDesc)
            expect
              .soft(false, `[SEO] Missing og:description on ${pagePath}`)
              .toBeTruthy();
          if (!ogImage)
            expect
              .soft(false, `[SEO] Missing og:image on ${pagePath}`)
              .toBeTruthy();
          if (!ogUrl)
            expect
              .soft(false, `[SEO] Missing og:url on ${pagePath}`)
              .toBeTruthy();
        } else {
          if (!ogTitle)
            console.warn(`[SEO] Missing og:title on ${pagePath}`);
          if (!ogDesc)
            console.warn(`[SEO] Missing og:description on ${pagePath}`);
          if (!ogImage)
            console.warn(`[SEO] Missing og:image on ${pagePath}`);
          if (!ogUrl) console.warn(`[SEO] Missing og:url on ${pagePath}`);
        }
      });

      await test.step('exactly one H1', async () => {
        const h1Count = await page.locator('h1').count();
        if (h1Count === 0)
          expect
            .soft(false, `[SEO] No H1 found on ${pagePath}`)
            .toBeTruthy();
        if (h1Count > 1)
          expect
            .soft(
              false,
              `[SEO] Multiple H1 tags (${h1Count}) found on ${pagePath}`
            )
            .toBeTruthy();
      });

      await test.step('all images have alt attributes', async () => {
        const missingAlt: string[] = await page.evaluate(() =>
          [...document.querySelectorAll('img')]
            .filter(
              (img) =>
                !img.getAttribute('alt') &&
                img.src &&
                !img.src.startsWith('data:')
            )
            .map((img) => img.src)
        );
        if (missingAlt.length > 0) {
          expect
            .soft(
              false,
              `[SEO] Images missing alt attribute on ${pagePath}:\n${missingAlt
                .map((s) => `  - ${s}`)
                .join('\n')}`
            )
            .toBeTruthy();
        }
      });

      if (pagePath === '/') {
        await test.step('robots meta does not contain noindex', async () => {
          const robots = await page
            .$eval('meta[name="robots"]', (el) => el.getAttribute('content'))
            .catch(() => null);
          if (robots?.toLowerCase().includes('noindex')) {
            expect
              .soft(
                false,
                `[SEO] Homepage robots meta contains "noindex": "${robots}"`
              )
              .toBeTruthy();
          }
        });
      }
    });
  }
});
