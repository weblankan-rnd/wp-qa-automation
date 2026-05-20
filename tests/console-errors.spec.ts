import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

// Errors to ignore — common WP third-party noise
const ignoredPatterns = [
  /google-analytics/i,
  /googletagmanager/i,
  /facebook\.net/i,
  /hotjar/i,
  /clarity\.ms/i,
  /wp-emoji/i,
];

function shouldIgnore(message: string): boolean {
  return ignoredPatterns.some(pattern => pattern.test(message));
}

test.describe('Console errors', () => {
  for (const pagePath of pagesToCheck) {
    test(`zero JS errors on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', err => {
        if (!shouldIgnore(err.message)) {
          errors.push(`[pageerror] ${err.message}`);
        }
      });

      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error' || (type === 'warning' && /error|exception|fail|out of memory/i.test(text))) {
          if (!shouldIgnore(text)) {
            errors.push(`[console.${type}] ${text}`);
          }
        }
      });

      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      expect(errors, `Console errors on ${pagePath}:\n${errors.join('\n')}`).toHaveLength(0);
    });

    test(`no failed network requests on ${pagePath === '/' ? 'homepage' : pagePath}`, async ({ page }) => {
      const failedRequests: string[] = [];

      page.on('requestfailed', request => {
        const url = request.url();
        if (!shouldIgnore(url)) {
          failedRequests.push(`${request.method()} ${url} — ${request.failure()?.errorText}`);
        }
      });

      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      expect(
        failedRequests,
        `Failed requests on ${pagePath}:\n${failedRequests.join('\n')}`
      ).toHaveLength(0);
    });
  }

  test('no mixed content warnings (HTTP resources on HTTPS page)', async ({ page }) => {
    const baseUrl = process.env.BASE_URL || '';
    if (!baseUrl.startsWith('https')) {
      test.skip(); return;
    }

    const mixedContent: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('mixed content') || text.toLowerCase().includes('insecure')) {
        mixedContent.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(mixedContent, `Mixed content warnings:\n${mixedContent.join('\n')}`).toHaveLength(0);
  });

  test('no deprecated API warnings on homepage', async ({ page }) => {
    const deprecations: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'warning' && text.toLowerCase().includes('deprecated')) {
        deprecations.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const FAIL_ON_DEPRECATED = process.env.FAIL_ON_DEPRECATED === 'true';

    if (FAIL_ON_DEPRECATED) {
      expect(deprecations, `Deprecated API warnings:\n${deprecations.join('\n')}`).toHaveLength(0);
    } else if (deprecations.length > 0) {
      console.warn(`Deprecated API warnings:\n${deprecations.join('\n')}`);
    }
  });
});
