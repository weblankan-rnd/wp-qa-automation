import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('logo is visible in the header @smoke', async ({ page }) => {
    const headerLogo = page.locator('header .navbar-brand img.main-logo').first();
    await expect(headerLogo, 'Header logo should be visible').toBeVisible();
    const src = await headerLogo.getAttribute('src');
    expect(src, 'Header logo should have a valid src').toBeTruthy();
  });

  test('clicking header logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const headerLogo = page.locator('header .navbar-brand').first();
    await expect(headerLogo, 'Header logo link should be visible').toBeVisible();
    await headerLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    expect(currentUrl).toBe(BASE_URL);
  });

  test('hamburger menu is present on mobile viewport @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hamburger = page.locator('.hamburger-menu');
    await expect(hamburger, 'Hamburger menu should be visible on mobile').toBeVisible();
    expect(await page.locator('.hamburger-menu .navbar-brand img').count(),
      'Mobile hamburger should contain a logo').toBeGreaterThan(0);
  });

  test('mobile menu opens on hamburger click @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    await expect(menuHam, 'Hamburger button should be visible').toBeVisible();
    await menuHam.click();
    const mobileMenu = page.locator('.mobile-menu');
    await expect(mobileMenu, 'Mobile menu should be visible after hamburger click').toBeVisible();
  });

  test('mobile menu logo navigates to home page @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    await menuHam.click();
    const mobileLogo = page.locator('.hamburger-menu .navbar-brand');
    await expect(mobileLogo, 'Mobile logo should be visible').toBeVisible();
    await mobileLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    expect(currentUrl).toBe(BASE_URL);
  });

  for (const pagePath of pagesToCheck.slice(0, 5)) {
    const label = pagePath === '/' ? 'homepage' : pagePath;

    test(`active state is shown for current page on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const activeLink = page.locator(
        'header .current-menu-item a, header .current_page_item a'
      ).first();
      const activeInMobile = page.locator(
        '.mobile-menu .current-menu-item a, .mobile-menu .current_page_item a'
      ).first();

      const desktopActive = await activeLink.isVisible().catch(() => false);
      if (desktopActive) {
        const text = await activeLink.textContent();
        expect(text?.trim(), `Active link on ${pagePath} should have visible text`).toBeTruthy();
      }

      const menuHamVisible = await page.locator('.menu-ham').isVisible().catch(() => false);
      if (menuHamVisible) {
        await page.locator('.menu-ham').click();
        await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 });
        const mobileActiveExists = await activeInMobile.count();
        expect(mobileActiveExists, `Mobile menu should have an active link for ${pagePath}`).toBeGreaterThan(0);
      }
    });
  }

  test('logo is visible in header on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const logo = page.locator('header .navbar-brand img.main-logo').first();
      const hamburgerLogo = page.locator('.hamburger-menu .navbar-brand img').first();

      const desktopLogoVisible = await logo.isVisible().catch(() => false);
      const mobileLogoExists = await hamburgerLogo.count();

      expect(
        desktopLogoVisible || mobileLogoExists > 0,
        `Logo should exist on ${pagePath} in either desktop header or hamburger menu`
      ).toBeTruthy();
    }
  });

  test('clicking header logo from any page opens home page @smoke', async ({ page }) => {
    const testPages = pagesToCheck.filter((p: string) => p !== '/').slice(0, 3);
    for (const pagePath of testPages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const headerLogo = page.locator('header .navbar-brand').first();
      if (await headerLogo.isVisible().catch(() => false)) {
        await headerLogo.click();
        await page.waitForLoadState('domcontentloaded');
        const currentUrl = page.url().replace(/\/$/, '');
        expect(currentUrl, `Clicking logo on ${pagePath} should navigate to home`).toBe(BASE_URL);
      }
    }
  });
});
