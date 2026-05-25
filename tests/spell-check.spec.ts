/**
 * Spell checking across all discovered pages.
 *
 * Uses nspell + dictionary-en for real dictionary lookups.
 * Checks visible body text for potential misspellings.
 */
import { test, expect } from '@playwright/test';
import { getPagesToCheck, pageLabel, isArchivePage } from '../test-utils/get-pages-to-check';
import { checkSpelling, stripHtml } from '../test-utils/spell-check';

const pagesToCheck = getPagesToCheck();

test.describe('Spell Check', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);

    test(`no spelling errors in body text on ${label}`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

      const bodyHtml = await page.locator('body').innerHTML();
      const textContent = stripHtml(bodyHtml);

      const errors = await checkSpelling(textContent);

      if (errors.length > 0) {
        expect.soft(
          false,
          `[SpellCheck] ${errors.length} potential spelling issue(s) on ${pagePath}:\n${errors
            .slice(0, 30)
            .map((e) => `  - ${e}`)
            .join('\n')}`
        ).toBeTruthy();
      }
    });
  }
});
