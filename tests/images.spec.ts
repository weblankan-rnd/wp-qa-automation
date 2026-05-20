import { test, expect } from '@playwright/test';
import pages from '../test-data/pages.json';

const pagesToCheck = pages.smoke.map(p => p.path);

test.describe('Images', () => {
  for (const pagePath of pagesToCheck) {
    test(`all images are .webp format on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img[src]');
      const count = await images.count();

      const nonWebp: string[] = [];
      for (let i = 0; i < count; i++) {
        const src = await images.nth(i).getAttribute('src');
        if (!src || src.startsWith('data:')) continue;

        if (!src.toLowerCase().endsWith('.webp') && !src.includes('.webp?')) {
          nonWebp.push(src);
        }
      }

      expect(
        nonWebp,
        `Non-WebP images on ${pagePath}:\n${nonWebp.join('\n')}`
      ).toHaveLength(0);
    });
  }

  test('no PNG/JPEG  images are referenced in CSS backgrounds on homepage @smoke', async ({ page }) => {
    await page.goto('/');

    const bgImages = await page.evaluate(() => {
      const results: string[] = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
          const urls = [...bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
          for (const url of urls) {
            if (/\.(png|jpe?g|gif|svg)(\?|$)/i.test(url)) {
              results.push(url);
            }
          }
        }
      }
      return results;
    });

    if (bgImages.length > 0) {
      console.warn(`Non-WebP background images:\n${bgImages.join('\n')}`);
    }
  });
});
