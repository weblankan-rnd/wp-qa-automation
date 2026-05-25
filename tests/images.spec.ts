import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';
import { getPagesToCheck, pageLabel } from '../test-utils/get-pages-to-check';

const pagesToCheck = getPagesToCheck();

test.describe('Images', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);

    test(`all images are .webp format on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'load' });

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

      if (nonWebp.length > 0) {
        expect.soft(
          false,
          `[Images] Non-WebP images on ${pagePath} (convert to .webp):\n${nonWebp.map((s) => `  - ${s}`).join('\n')}`
        ).toBeTruthy();
      }
    });
  }

  test('no PNG/JPEG images in CSS backgrounds on homepage @smoke', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const bgImages = await page.evaluate(() => {
      const results: string[] = [];
      const bgElements = document.querySelectorAll(
        'div, section, header, footer, main, article, aside, nav, li, a, span, button'
      );
      for (const el of bgElements) {
        const bg = window.getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
          const urls = [...bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
          for (const url of urls) {
            if (/\.(png|jpe?g|gif|svg)(\?|$)/i.test(url)) {
              results.push(url);
            }
          }
        }
      }
      return [...new Set(results)];
    });

    if (bgImages.length > 0) {
      expect.soft(
        false,
        `[Images] Non-WebP CSS background images on homepage (convert to .webp):\n${bgImages.map((s) => `  - ${s}`).join('\n')}`
      ).toBeTruthy();
    }
  });

  test('no image exceeds size limit on homepage @smoke', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'load' });

    const images = page.locator('img[src]');
    const count = await images.count();

    const srcs: string[] = [];
    const maxImages = Math.min(count, 30);
    for (let i = 0; i < maxImages; i++) {
      const src = await images.nth(i).getAttribute('src');
      if (!src || src.startsWith('data:')) continue;
      srcs.push(src.startsWith('http') ? src : `${config.baseURL}${src}`);
    }

    const oversized: string[] = [];
    await Promise.all(
      srcs.map(async (url) => {
        try {
          const response = await request.head(url, { timeout: 5000 });
          const cl = response.headers()['content-length'];
          if (cl) {
            const sizeKB = parseInt(cl, 10) / 1024;
            if (sizeKB > config.imageSizeLimitKb) {
              oversized.push(`${url} — ${sizeKB.toFixed(0)}KB`);
            }
          }
        } catch {
          // external CDN or blocked HEAD — skip silently
        }
      })
    );

    if (oversized.length > 0) {
      expect.soft(
        false,
        `[Images] ${oversized.length} image(s) exceed ${config.imageSizeLimitKb}KB (compress in WordPress):\n${oversized.map((s) => `  - ${s}`).join('\n')}`
      ).toBeTruthy();
    }
  });
});
