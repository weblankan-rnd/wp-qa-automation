import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

const PAGE_LOAD_LIMIT_MS = Number(process.env.PAGE_LOAD_LIMIT_MS) || 3000;
const LCP_LIMIT_MS = Number(process.env.LCP_LIMIT_MS) || 4000;

test.describe('Performance', () => {
  for (const pagePath of pagesToCheck) {
    test(`page load time < ${PAGE_LOAD_LIMIT_MS / 1000}s on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'load' });

      const loadMs = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.fetchStart : nav.domContentLoadedEventEnd - nav.fetchStart;
      });

      expect(
        loadMs,
        `Page ${pagePath} loaded in ${loadMs.toFixed(0)}ms (limit: ${PAGE_LOAD_LIMIT_MS}ms)`
      ).toBeLessThanOrEqual(PAGE_LOAD_LIMIT_MS);
    });
  }

  test(`LCP < ${LCP_LIMIT_MS / 1000}s on homepage @smoke`, async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const lcpMs = await page.evaluate(
      ({ limit }) => {
        return new Promise<number>((resolve, reject) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            observer.disconnect();
            resolve(entries[entries.length - 1].startTime);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => reject(new Error('LCP not reported within limit')), limit);
        });
      },
      { limit: LCP_LIMIT_MS + 2000 }
    );

    expect(lcpMs, `LCP is ${lcpMs.toFixed(0)}ms (limit: ${LCP_LIMIT_MS}ms)`).toBeLessThanOrEqual(LCP_LIMIT_MS);
  });

  test('no slow render-blocking resources on homepage @smoke', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const renderBlocking = await page.evaluate(() => {
      const blocking: { url: string; type: string }[] = [];

      document.querySelectorAll('head link[rel="stylesheet"]').forEach((el) => {
        const href = el.getAttribute('href');
        const media = el.getAttribute('media');
        if (href && media !== 'print') {
          blocking.push({ url: href, type: 'CSS' });
        }
      });

      document.querySelectorAll('head script[src]').forEach((el) => {
        const src = el.getAttribute('src');
        if (src && !el.hasAttribute('async') && !el.hasAttribute('defer')) {
          blocking.push({ url: src, type: 'SYNC JS' });
        }
      });

      return blocking;
    });

    expect(
      renderBlocking,
      `Render-blocking resources found on homepage:\n${renderBlocking.map((r) => `  ${r.type}: ${r.url}`).join('\n')}`
    ).toHaveLength(0);
  });
});
