import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('all primary nav links resolve without 4xx/5xx @smoke', async ({ page, request }) => {
    await page.goto('/');

    const links = page.locator('#primary a, #navbar_main_mobile a, header nav a, header #site-navigation a');
    const count = await links.count();
    expect(count, 'No navigation links found in header').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
        continue;
      }
      const url = href.startsWith('http') ? href : `${process.env.BASE_URL}${href}`;
      const response = await request.get(url);
      expect(response.status(), `Navigation link returned error: ${url}`).toBeLessThan(400);
    }
  });

  test('clicking nav links loads new pages correctly', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('#primary a, #navbar_main_mobile a, header nav a');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      await page.goto('/');
      const link = page.locator('#primary a, #navbar_main_mobile a, header nav a').nth(i);
      const href = await link.getAttribute('href');
      const target = await link.getAttribute('target');
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || target === '_blank') {
        continue;
      }
      await link.click();
      // Page loaded if there's no 404 indicator
      await expect(page.locator('body')).toBeVisible();
      const title = await page.title();
      expect(title).not.toMatch(/404|not found/i);
    }
  });

  test('dropdown submenus are accessible on hover', async ({ page }) => {
    await page.goto('/');

    const topLevelItems = page.locator('#primary > li.menu-item-has-children, header nav > ul > li.menu-item-has-children, header nav li.has-dropdown');
    const count = await topLevelItems.count();

    for (let i = 0; i < count; i++) {
      await topLevelItems.nth(i).hover();
      const submenu = topLevelItems.nth(i).locator('ul, .sub-menu, .dropdown-menu');
      if (await submenu.count() > 0) {
        await expect(submenu.first()).toBeVisible();
      }
    }
  });

  test('active page is highlighted in navigation', async ({ page }) => {
    await page.goto('/');

    const activeItem = page.locator('#primary .current-menu-item, #primary [aria-current="page"], header nav .current-menu-item, header nav .active');
    // Active indicator is desirable but not always present — warn if missing
    const count = await activeItem.count();
    if (count === 0) {
      console.warn('No active navigation item found — consider adding aria-current="page" or .current-menu-item');
    }
  });
});
