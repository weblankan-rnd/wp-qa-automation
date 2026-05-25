/**
 * Cross-cutting test: detect JavaScript console errors on every page.
 *
 * JS errors often indicate plugin conflicts, broken enqueues, or
 * uncaught exceptions in WordPress themes.
 */
import { test, expect } from '@playwright/test';
import { getPagesToCheck, pageLabel } from '../test-utils/get-pages-to-check';

const pagesToCheck = getPagesToCheck();

test.describe('Console Errors', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);

    test(`no console errors on ${label} @smoke`, async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(`${msg.text()} (at ${msg.location()?.url || 'unknown'})`);
        }
      });

      // Also catch uncaught page errors
      page.on('pageerror', (err) => {
        errors.push(`Uncaught: ${err.message}`);
      });

      await page.goto(pagePath, { waitUntil: 'networkidle' });

      // Small wait for late-loading scripts
      await page.waitForTimeout(500);

      if (errors.length > 0) {
        expect.soft(
          false,
          `[ConsoleErrors] ${errors.length} JS error(s) on ${pagePath}:\n${errors
            .slice(0, 20)
            .map((e) => `  - ${e}`)
            .join('\n')}`
        ).toBeTruthy();
      }
    });
  }
});
