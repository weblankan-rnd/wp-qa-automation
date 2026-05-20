import { test, expect } from '@playwright/test';
import { checkLinks } from '../test-utils/check-links';

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('footer is visible on homepage @smoke', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
  });

  test('footer is visible on internal pages @smoke', async ({ page }) => {
    const links = page.locator('header nav a');
    const count = await links.count();

    if (count > 0) {
      const href = await links.first().getAttribute('href');
      if (href && !href.startsWith('#')) {
        await page.goto(href.startsWith('http') ? href : `${href}`);
        await expect(page.locator('footer')).toBeVisible();
      }
    }
  });

  test('footer contains copyright text', async ({ page }) => {
    const footer = page.locator('footer');
    const text = await footer.textContent();
    expect(text, 'Footer text content is empty').toBeTruthy();
    expect(text!).toMatch(/©|copyright|\d{4}/i);
  });

  test('all footer links return non-error HTTP status', async ({ page, request }) => {
    const links = page.locator('footer a');
    const baseURL = process.env.BASE_URL || '';
    const broken = await checkLinks(request, links, baseURL);
    expect(broken, `Broken footer links:\n${broken.join('\n')}`).toHaveLength(0);
  });

  test('footer social media links are present and visible', async ({ page }) => {
    const socialLinks = page.locator(
      'footer a[href*="facebook"], footer a[href*="twitter"], footer a[href*="instagram"], footer a[href*="linkedin"], footer a[href*="youtube"]'
    );
    const count = await socialLinks.count();
    // Social links are optional — just verify they're not broken if present
    for (let i = 0; i < count; i++) {
      await expect(socialLinks.nth(i)).toBeVisible();
    }
  });

  test('footer widget areas render without error', async ({ page }) => {
    const widgetAreas = page.locator('footer .widget, footer aside, footer [class*="widget"]');
    const count = await widgetAreas.count();
    for (let i = 0; i < count; i++) {
      await expect(widgetAreas.nth(i)).toBeVisible();
    }
  });
});
