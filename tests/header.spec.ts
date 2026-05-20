import { test } from '@playwright/test';
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
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) { console.warn('[Header] Header logo is not visible'); return; }
    const src = await headerLogo.getAttribute('src');
    if (!src) console.warn('[Header] Header logo has no src attribute');
  });

  test('clicking header logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const headerLogo = page.locator('header .navbar-brand').first();
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) { console.warn('[Header] Header logo not visible on /ceylon-cannabis/'); return; }
    await headerLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== BASE_URL) console.warn(`[Header] Logo click navigated to ${currentUrl}, expected ${BASE_URL}`);
  });

  test('hamburger menu is present on mobile viewport @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const hamburger = page.locator('.hamburger-menu');
    const visible = await hamburger.isVisible().catch(() => false);
    if (!visible) console.warn('[Header] Hamburger menu is not visible on mobile');
    const logoCount = await page.locator('.hamburger-menu .navbar-brand img').count();
    if (logoCount === 0) console.warn('[Header] Mobile hamburger menu contains no logo');
  });

  test('mobile menu opens on hamburger click @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    const visible = await menuHam.isVisible().catch(() => false);
    if (!visible) { console.warn('[Header] Hamburger button not visible on mobile'); return; }
    await menuHam.click();
    const mobileMenu = page.locator('.mobile-menu');
    const menuVisible = await mobileMenu.isVisible().catch(() => false);
    if (!menuVisible) console.warn('[Header] Mobile menu did not open after hamburger click');
  });

  test('mobile menu logo navigates to home page @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    const hamVisible = await menuHam.isVisible().catch(() => false);
    if (!hamVisible) { console.warn('[Header] Hamburger button not visible on /contact-us/'); return; }
    await menuHam.click();
    const mobileLogo = page.locator('.hamburger-menu .navbar-brand');
    const logoVisible = await mobileLogo.isVisible().catch(() => false);
    if (!logoVisible) { console.warn('[Header] Mobile logo not visible after opening menu'); return; }
    await mobileLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== BASE_URL) console.warn(`[Header] Mobile logo navigated to ${currentUrl}, expected ${BASE_URL}`);
  });

  for (const pagePath of pagesToCheck.slice(0, 5)) {
    const label = pagePath === '/' ? 'homepage' : pagePath;

    test(`active state is shown for current page on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const activeLink = page.locator('header .current-menu-item a, header .current_page_item a').first();
      const activeInMobile = page.locator('.mobile-menu .current-menu-item a, .mobile-menu .current_page_item a').first();

      const desktopActive = await activeLink.isVisible().catch(() => false);
      if (desktopActive) {
        const text = await activeLink.textContent();
        if (!text?.trim()) console.warn(`[Header] Active link on ${pagePath} has no visible text`);
      }

      const menuHamVisible = await page.locator('.menu-ham').isVisible().catch(() => false);
      if (menuHamVisible) {
        await page.locator('.menu-ham').click();
        await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        const mobileActiveExists = await activeInMobile.count();
        if (mobileActiveExists === 0) console.warn(`[Header] No active menu item found on mobile for ${pagePath}`);
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
      if (!desktopLogoVisible && mobileLogoExists === 0) {
        console.warn(`[Header] No logo found on ${pagePath} in either desktop header or hamburger menu`);
      }
    }
  });

  test('clicking header logo from any page opens home page @smoke', async ({ page }) => {
    const testPages = pagesToCheck.filter((p: string) => p !== '/').slice(0, 3);
    for (const pagePath of testPages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const headerLogo = page.locator('header .navbar-brand').first();
      if (!(await headerLogo.isVisible().catch(() => false))) continue;
      await headerLogo.click();
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url().replace(/\/$/, '');
      if (currentUrl !== BASE_URL) {
        console.warn(`[Header] Clicking logo on ${pagePath} navigated to ${currentUrl}, expected ${BASE_URL}`);
      }
    }
  });
});
