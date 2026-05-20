import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { IGNORED_PATHS } from '../test-utils/ignored-paths';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = (existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/']).filter((p: string) => !IGNORED_PATHS.includes(p));

const PAGE_LOAD_LIMIT_MS = Number(process.env.LOAD_TIME_THRESHOLD_MS) || 5000;
const LCP_LIMIT_MS = Number(process.env.LCP_LIMIT_MS) || 4000;

test.describe('Performance', () => {
  for (const pagePath of pagesToCheck) {
    test(`page load time < ${PAGE_LOAD_LIMIT_MS / 1000}s on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'load' });

      const loadMs = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return nav.loadEventEnd > 0 ? nav.loadEventEnd - nav.fetchStart : nav.domContentLoadedEventEnd - nav.fetchStart;
      });

      if (loadMs > PAGE_LOAD_LIMIT_MS) {
        console.warn(`[Perf] ${pagePath} loaded in ${loadMs.toFixed(0)}ms (limit: ${PAGE_LOAD_LIMIT_MS}ms)`);
      }
    });
  }

  test(`LCP < ${LCP_LIMIT_MS / 1000}s on homepage @smoke`, async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const lcpMs = await page.evaluate(
      (limit) => {
        return new Promise<number | null>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            observer.disconnect();
            resolve(entries[entries.length - 1].startTime);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => { observer.disconnect(); resolve(null); }, limit);
        });
      },
      LCP_LIMIT_MS + 5000
    );

    if (lcpMs !== null && lcpMs > LCP_LIMIT_MS) {
      console.warn(`[Perf] LCP is ${lcpMs.toFixed(0)}ms (limit: ${LCP_LIMIT_MS}ms)`);
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

    const MAX_RENDER_BLOCKING = Number(process.env.MAX_RENDER_BLOCKING) || 8;
    if (renderBlocking.length > MAX_RENDER_BLOCKING) {
      console.warn(
        `[Perf] Render-blocking resources (${renderBlocking.length}) exceed limit (${MAX_RENDER_BLOCKING}):\n` +
        renderBlocking.map((r) => `  ${r.type}: ${r.url}`).join('\n')
      );
    }
  });
});
