import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { IGNORED_PATHS } from '../test-utils/ignored-paths';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = (existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/']).filter((p: string) => !IGNORED_PATHS.includes(p));

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('logo is visible in the header @smoke', async ({ page }) => {
    const headerLogo = page.locator('header .navbar-brand img.main-logo').first();
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) { console.error('[ISSUE][Header] Header logo is not visible on homepage'); return; }
    const src = await headerLogo.getAttribute('src');
    if (!src) console.error('[ISSUE][Header] Header logo has no src attribute');
  });

  test('clicking header logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const headerLogo = page.locator('header .navbar-brand').first();
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) { console.warn('[Header] Header logo not visible on /ceylon-cannabis/'); return; }
    await headerLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== BASE_URL) console.error(`[ISSUE][Header] Logo click navigated to "${currentUrl}", expected "${BASE_URL}"`);
  });

  test('hamburger menu is present on mobile viewport @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const visible = await page.locator('.hamburger-menu').isVisible().catch(() => false);
    if (!visible) console.error('[ISSUE][Header] Hamburger menu not visible on mobile viewport');
    const logoCount = await page.locator('.hamburger-menu .navbar-brand img').count();
    if (logoCount === 0) console.error('[ISSUE][Header] No logo found inside hamburger menu');
  });

  test('mobile menu opens on hamburger click @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    const visible = await menuHam.isVisible().catch(() => false);
    if (!visible) { console.error('[ISSUE][Header] Hamburger button not visible on mobile'); return; }
    await menuHam.click();
    const menuVisible = await page.locator('.mobile-menu').isVisible().catch(() => false);
    if (!menuVisible) console.error('[ISSUE][Header] Mobile menu did not open after hamburger click');
  });

  test('mobile menu logo navigates to home page @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    if (!(await menuHam.isVisible().catch(() => false))) { console.warn('[Header] Hamburger not visible on /contact-us/'); return; }
    await menuHam.click();
    const mobileLogo = page.locator('.hamburger-menu .navbar-brand');
    if (!(await mobileLogo.isVisible().catch(() => false))) { console.error('[ISSUE][Header] Mobile logo not visible after opening menu'); return; }
    await mobileLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== BASE_URL) console.error(`[ISSUE][Header] Mobile logo navigated to "${currentUrl}", expected "${BASE_URL}"`);
  });

  for (const pagePath of pagesToCheck.slice(0, 5)) {
    const label = pagePath === '/' ? 'homepage' : pagePath;
    test(`active state is shown for current page on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const activeLink = page.locator('header .current-menu-item a, header .current_page_item a').first();
      const desktopActive = await activeLink.isVisible().catch(() => false);
      if (desktopActive) {
        const text = await activeLink.textContent();
        if (!text?.trim()) console.error(`[ISSUE][Header] Active menu link has no visible text on ${pagePath}`);
      }
      const menuHamVisible = await page.locator('.menu-ham').isVisible().catch(() => false);
      if (menuHamVisible) {
        await page.locator('.menu-ham').click();
        await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        const mobileActiveExists = await page.locator('.mobile-menu .current-menu-item a, .mobile-menu .current_page_item a').count();
        if (mobileActiveExists === 0) console.error(`[ISSUE][Header] No active menu item in mobile menu on ${pagePath}`);
      }
    });
  }

  test('logo is visible in header on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const desktopLogoVisible = await page.locator('header .navbar-brand img.main-logo').first().isVisible().catch(() => false);
      const mobileLogoExists = await page.locator('.hamburger-menu .navbar-brand img').count();
      if (!desktopLogoVisible && mobileLogoExists === 0) {
        console.error(`[ISSUE][Header] No logo found on ${pagePath} (checked desktop header and hamburger menu)`);
      }
    }
  });

  test('clicking header logo from any page opens home page @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.filter((p: string) => p !== '/').slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const headerLogo = page.locator('header .navbar-brand').first();
      if (!(await headerLogo.isVisible().catch(() => false))) continue;
      await headerLogo.click();
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url().replace(/\/$/, '');
      if (currentUrl !== BASE_URL) {
        console.error(`[ISSUE][Header] Logo click on ${pagePath} navigated to "${currentUrl}", expected "${BASE_URL}"`);
      }
    }
  });
});
