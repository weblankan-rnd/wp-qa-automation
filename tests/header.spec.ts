import { test, expect } from '@playwright/test';
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
    if (!visible) { expect.soft(false, '[Header] Header logo is not visible on homepage').toBeTruthy(); return; }
    const src = await headerLogo.getAttribute('src');
    if (!src) expect.soft(false, '[Header] Header logo has no src attribute').toBeTruthy();
  });

  test('clicking header logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const headerLogo = page.locator('header .navbar-brand').first();
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) { console.warn('[Header] Header logo not visible on /ceylon-cannabis/'); return; }
    await headerLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== BASE_URL) expect.soft(false, `[Header] Logo click navigated to "${currentUrl}", expected "${BASE_URL}"`).toBeTruthy();
  });

  test('hamburger menu is present on mobile viewport @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const visible = await page.locator('.hamburger-menu').isVisible().catch(() => false);
    if (!visible) expect.soft(false, '[Header] Hamburger menu not visible on mobile viewport').toBeTruthy();
    const logoCount = await page.locator('.hamburger-menu .navbar-brand img').count();
    if (logoCount === 0) expect.soft(false, '[Header] No logo found inside hamburger menu').toBeTruthy();
  });

  test('mobile menu opens on hamburger click @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    const visible = await menuHam.isVisible().catch(() => false);
    if (!visible) { expect.soft(false, '[Header] Hamburger button not visible on mobile').toBeTruthy(); return; }
    await menuHam.click();
    const menuVisible = await page.locator('.mobile-menu').isVisible().catch(() => false);
    if (!menuVisible) expect.soft(false, '[Header] Mobile menu did not open after hamburger click').toBeTruthy();
  });

  test('mobile menu logo navigates to home page @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator('.menu-ham');
    if (!(await menuHam.isVisible().catch(() => false))) { console.warn('[Header] Hamburger not visible on /contact-us/'); return; }
    await menuHam.click();
    const mobileLogo = page.locator('.hamburger-menu .navbar-brand');
    if (!(await mobileLogo.isVisible().catch(() => false))) { expect.soft(false, '[Header] Mobile logo not visible after opening menu').toBeTruthy(); return; }
    await mobileLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== BASE_URL) expect.soft(false, `[Header] Mobile logo navigated to "${currentUrl}", expected "${BASE_URL}"`).toBeTruthy();
  });

  for (const pagePath of pagesToCheck.slice(0, 5)) {
    const label = pagePath === '/' ? 'homepage' : pagePath;
    test(`active state is shown for current page on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const activeLink = page.locator('header .current-menu-item a, header .current_page_item a').first();
      const desktopActive = await activeLink.isVisible().catch(() => false);
      if (desktopActive) {
        const text = await activeLink.textContent();
        if (!text?.trim()) expect.soft(false, `[Header] Active menu link has no visible text on ${pagePath}`).toBeTruthy();
      }
      const menuHamVisible = await page.locator('.menu-ham').isVisible().catch(() => false);
      if (menuHamVisible) {
        await page.locator('.menu-ham').click();
        await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        const mobileActiveExists = await page.locator('.mobile-menu .current-menu-item a, .mobile-menu .current_page_item a').count();
        if (mobileActiveExists === 0) expect.soft(false, `[Header] No active menu item in mobile menu on ${pagePath}`).toBeTruthy();
      }
    });
  }

  test('logo is visible in header on all pages @smoke', async ({ page }) => {
    const missing: string[] = [];
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const desktopLogoVisible = await page.locator('header .navbar-brand img').first().isVisible().catch(() => false);
      if (!desktopLogoVisible) {
        missing.push(pagePath);
      }
    }
    if (missing.length > 0) {
      expect(false, `[Header] No logo found on these pages:\n${missing.map(p => `  - ${p}`).join('\n')}`).toBeTruthy();
    }
  });

  test('clicking header logo from any page opens home page @smoke', async ({ page }) => {
    const errors: string[] = [];
    for (const pagePath of pagesToCheck.filter((p: string) => p !== '/').slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const headerLogo = page.locator('header .navbar-brand').first();
      if (!(await headerLogo.isVisible().catch(() => false))) continue;
      await headerLogo.click();
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url().replace(/\/$/, '');
      if (currentUrl !== BASE_URL) {
        errors.push(`Logo click on ${pagePath} navigated to "${currentUrl}", expected "${BASE_URL}"`);
      }
    }
    if (errors.length > 0) {
      expect(false, `[Header] ${errors.join(' | ')}`).toBeTruthy();
    }
  });
});
