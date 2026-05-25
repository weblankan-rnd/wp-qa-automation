import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';
import { getPagesToCheck } from '../test-utils/get-pages-to-check';

const pagesToCheck = getPagesToCheck();

test.describe('Performance', () => {
  for (const pagePath of pagesToCheck) {
    const label = pagePath === '/' ? 'homepage' : pagePath;

    test(`page load time < ${config.loadTimeThresholdMs / 1000}s on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'load' });

      const loadMs = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return nav.loadEventEnd > 0
          ? nav.loadEventEnd - nav.fetchStart
          : nav.domContentLoadedEventEnd - nav.fetchStart;
      });

      if (loadMs > config.loadTimeThresholdMs) {
        expect.soft(
          false,
          `[Perf] ${pagePath} loaded in ${loadMs.toFixed(0)}ms (limit: ${config.loadTimeThresholdMs}ms) — optimize page speed`
        ).toBeTruthy();
      }
    });
  }

  test(`LCP < ${config.lcpLimitMs / 1000}s on homepage @smoke`, async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const lcpMs = await page.evaluate(
      (limit) =>
        new Promise<number | null>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            observer.disconnect();
            resolve(entries[entries.length - 1].startTime);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(null);
          }, limit);
        }),
      config.lcpLimitMs + 5000
    );

    if (lcpMs !== null && lcpMs > config.lcpLimitMs) {
      expect.soft(
        false,
        `[Perf] LCP is ${lcpMs.toFixed(0)}ms on homepage (limit: ${config.lcpLimitMs}ms) — optimize largest content element`
      ).toBeTruthy();
    }
  });

  test('render-blocking resource count on homepage @smoke', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const renderBlocking = await page.evaluate(() => {
      const blocking: { url: string; type: string }[] = [];
      document.querySelectorAll('head link[rel="stylesheet"]').forEach((el) => {
        const href = el.getAttribute('href');
        const media = el.getAttribute('media');
        if (href && media !== 'print') blocking.push({ url: href, type: 'CSS' });
      });
      document.querySelectorAll('head script[src]').forEach((el) => {
        const src = el.getAttribute('src');
        if (src && !el.hasAttribute('async') && !el.hasAttribute('defer')) {
          blocking.push({ url: src, type: 'SYNC JS' });
        }
      });
      return blocking;
    });

    if (renderBlocking.length > config.maxRenderBlocking) {
      expect.soft(
        false,
        `[Perf] ${renderBlocking.length} render-blocking resources (limit: ${config.maxRenderBlocking}) — add async/defer or inline critical CSS:\n` +
          renderBlocking.map((r) => `  - ${r.type}: ${r.url}`).join('\n')
      ).toBeTruthy();
    }
  });
});
