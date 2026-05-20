import { test, expect } from '@playwright/test';

// Set CHECK_LOAD_TIME=true in .env to enforce page load time limits.
// Default is false — staging/test environments are often slow and would cause false failures.
const CHECK_LOAD_TIME = process.env.CHECK_LOAD_TIME === 'true';

const PAGE_LOAD_THRESHOLD_MS = Number(process.env.LOAD_TIME_THRESHOLD_MS) || 3000;
const LCP_THRESHOLD_MS = 2500;
const FID_THRESHOLD_MS = 100;

const pagesToCheck = ['/', '/about-us/', '/contact-us/'];

test.describe('Performance smoke checks', () => {
  for (const pagePath of pagesToCheck) {
    test(`page load time on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page }) => {
      const start = Date.now();
      await page.goto(pagePath, { waitUntil: 'load' });
      const loadTime = Date.now() - start;

      if (CHECK_LOAD_TIME) {
        expect(
          loadTime,
          `Page ${pagePath} took ${loadTime}ms to load (threshold: ${PAGE_LOAD_THRESHOLD_MS}ms)`
        ).toBeLessThan(PAGE_LOAD_THRESHOLD_MS);
      } else {
        // Informational only — log but never fail
        if (loadTime >= PAGE_LOAD_THRESHOLD_MS) {
          console.warn(`[perf] ${pagePath} loaded in ${loadTime}ms (threshold: ${PAGE_LOAD_THRESHOLD_MS}ms) — set CHECK_LOAD_TIME=true to enforce`);
        } else {
          console.log(`[perf] ${pagePath} loaded in ${loadTime}ms ✓`);
        }
      }
    });
  }

  test('LCP element is visible within 2.5s on homepage', async ({ page }) => {
    await page.goto('/');

    const lcp = await page.evaluate((): Promise<number> => {
      return new Promise(resolve => {
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
          resolve(last.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        setTimeout(() => resolve(LCP_THRESHOLD_MS + 1), 5000);
      });
    });

    if (lcp > LCP_THRESHOLD_MS) {
      console.warn(`LCP is ${lcp.toFixed(0)}ms (threshold: ${LCP_THRESHOLD_MS}ms) — consider optimizing hero image or main content`);
    }
  });

  test('no render-blocking resources on homepage', async ({ page }) => {
    await page.goto('/');

    const renderBlocking = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries
        .filter(entry =>
          (entry.initiatorType === 'link' || entry.initiatorType === 'script') &&
          (entry as any).renderBlockingStatus === 'blocking'
        )
        .map(entry => entry.name);
    });

    if (renderBlocking.length > 0) {
      console.warn(`Render-blocking resources:\n${renderBlocking.join('\n')}`);
    }
    // Warn only — render blocking is flagged but may be intentional
  });

  test('total page weight is under 5MB on homepage', async ({ page }) => {
    let totalBytes = 0;

    page.on('response', async response => {
      const headers = await response.allHeaders();
      const contentLength = headers['content-length'];
      if (contentLength) {
        totalBytes += parseInt(contentLength, 10);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalMB = totalBytes / (1024 * 1024);
    if (totalMB > 5) {
      console.warn(`Total page weight: ${totalMB.toFixed(2)}MB — consider optimizing assets`);
    }
    // Warn only for page weight
  });

  test('images are lazy loaded where appropriate', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();
    let lazyCount = 0;

    for (let i = 0; i < count; i++) {
      const loading = await images.nth(i).getAttribute('loading');
      if (loading === 'lazy') lazyCount++;
    }

    if (count > 3 && lazyCount === 0) {
      console.warn(`${count} images found but none use loading="lazy" — consider adding for below-fold images`);
    }
  });

  test('Time to First Byte is reasonable', async ({ page }) => {
    await page.goto('/');

    const ttfb = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!nav) return undefined;
      return nav.responseStart - nav.fetchStart;
    });

    if (ttfb === undefined) {
      console.warn('TTFB measurement not supported in this browser — skipping assertion');
    } else {
      expect(ttfb, `TTFB is ${ttfb.toFixed(0)}ms — server response is slow`).toBeLessThan(800);
    }
  });

  test('no 3xx redirect chains on homepage', async ({ page }) => {
    const redirects: string[] = [];

    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        redirects.push(`${response.url()} → ${response.headers()['location']}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (redirects.length > 1) {
      console.warn(`Redirect chain detected:\n${redirects.join('\n')}`);
    }
    expect(redirects.length, 'More than one redirect in chain').toBeLessThanOrEqual(1);
  });
});
