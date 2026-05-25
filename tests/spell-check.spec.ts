/**
 * Spell checking across all discovered pages.
 *
 * Uses nspell + dictionary-en for real dictionary lookups.
 * Checks visible body text for potential misspellings.
 */
import { test, expect } from '@playwright/test';
import { getPagesToCheck, pageLabel } from '../test-utils/get-pages-to-check';
import { checkSpelling } from '../test-utils/spell-check';

const pagesToCheck = getPagesToCheck();

test.describe('Spell Check', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);

    test(`no spelling errors in body text on ${label}`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

      // Use innerText to get only visible rendered text, skipping CSS classes/HTML attributes
      const textContent = await page.locator('body').innerText();
      if (!textContent.trim()) return;

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
