import { test, expect } from '@playwright/test';

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header is visible on homepage @smoke', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
  });

  test('site logo is visible and links to homepage @smoke', async ({ page }) => {
    // supercorals.hostweblankan.in: logo is <a class="logo"> inside <div class="logo-sec">
    const logo = page.locator('.logo-sec a.logo, header a.logo, header .custom-logo-link, header a img').first();
    await expect(logo).toBeVisible();

    await logo.click();
    await expect(page).toHaveURL(/\/$|\/$/);
  });

  test('primary navigation menu is visible @smoke', async ({ page }) => {
    // supercorals.hostweblankan.in: nav id is navbar_main_mobile
    const nav = page.locator('#navbar_main_mobile, header nav, header .nav, header #site-navigation, header [class*="menu"]').first();
    await expect(nav).toBeVisible();
  });

  test('navigation menu has at least one link', async ({ page }) => {
    // supercorals.hostweblankan.in: nav links are inside ul#primary
    const navLinks = page.locator('#primary a, #navbar_main_mobile a, header nav a, header .nav a');
    await expect(navLinks.first()).toBeVisible();
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('all header links return non-error HTTP status', async ({ page, request }) => {
    const links = page.locator('header a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
        continue;
      }
      const url = href.startsWith('http') ? href : `${process.env.BASE_URL}${href}`;
      const response = await request.get(url);
      expect(response.status(), `Broken header link: ${url}`).toBeLessThan(400);
    }
  });

  test('mobile hamburger menu opens on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const hamburger = page.locator(
      '.navbar-toggler, .hamburger, .menu-toggle, #menu-toggle, button[aria-label*="menu" i], button[aria-label*="navigation" i], [data-testid="mobile-menu-toggle"]'
    ).first();

    if (await hamburger.count() > 0) {
      await expect(hamburger).toBeVisible();
      await hamburger.click();

      const mobileMenu = page.locator('#navbar_main_mobile, header nav, .mobile-menu, #mobile-menu, [class*="mobile-nav"]').first();
      await expect(mobileMenu).toBeVisible();
    } else {
      // No hamburger — menu should still be visible (desktop-always style)
      const nav = page.locator('#navbar_main_mobile, header nav, header .nav').first();
      await expect(nav).toBeVisible();
    }
  });

  test('header remains visible after scrolling', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});
