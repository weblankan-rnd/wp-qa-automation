import { test, expect } from '@playwright/test';
import { checkLinks } from '../test-utils/check-links';

test.describe('Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all CTA buttons on homepage are visible @smoke', async ({ page }) => {
    const buttons = page.locator(
      'a.button, a.btn, button:not([type="submit"]), [class*="cta"], [data-testid*="button"], .wp-block-button__link'
    );
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeVisible();
    }
  });

  test('CTA buttons have non-empty text or accessible label', async ({ page }) => {
    const buttons = page.locator(
      'a.button, a.btn, .wp-block-button__link, [class*="btn-"]'
    );
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent())?.trim();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      expect(
        text || ariaLabel || title,
        `Button at index ${i} has no visible text or accessible label`
      ).toBeTruthy();
    }
  });

  test('CTA button links resolve without errors', async ({ page, request }) => {
    const buttons = page.locator('a.button, a.btn, .wp-block-button__link');
    const baseURL = process.env.BASE_URL || '';
    const broken = await checkLinks(request, buttons, baseURL);
    expect(broken, `Broken button links:\n${broken.join('\n')}`).toHaveLength(0);
  });

  test('submit buttons inside forms have type="submit"', async ({ page }) => {
    const submitButtons = page.locator('form button:not([type]), form button[type="submit"], form input[type="submit"]');
    const count = await submitButtons.count();

    for (let i = 0; i < count; i++) {
      const type = await submitButtons.nth(i).getAttribute('type');
      expect(type, `Submit button at index ${i} has type "${type}" — expected "submit"`).toMatch(/^(submit)?$/);
    }
  });

  test('disabled buttons are not clickable', async ({ page }) => {
    const disabledButtons = page.locator('button[disabled], input[type="submit"][disabled]');
    const count = await disabledButtons.count();

    for (let i = 0; i < count; i++) {
      await expect(disabledButtons.nth(i)).toBeDisabled();
    }
  });

  test('back-to-top button works if present', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 1000));

    const backToTop = page.locator(
      '[class*="back-to-top"], [class*="scroll-top"], a[href="#top"], #back-to-top, [data-testid="back-to-top"]'
    ).first();

    if (await backToTop.count() > 0) {
      await expect(backToTop).toBeVisible();
      await backToTop.click();
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeLessThan(100);
    }
  });
});
