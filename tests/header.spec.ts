import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';
import { getPagesToCheck } from '../test-utils/get-pages-to-check';
import { HEADER } from '../test-utils/selectors';

const pagesToCheck = getPagesToCheck();

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('logo is visible in the header @smoke', async ({ page }) => {
    const headerLogo = page.locator(HEADER.LOGO_IMG_MAIN).first();
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) {
      expect
        .soft(false, '[Header] Header logo is not visible on homepage')
        .toBeTruthy();
      return;
    }
    const src = await headerLogo.getAttribute('src');
    if (!src)
      expect
        .soft(false, '[Header] Header logo has no src attribute')
        .toBeTruthy();
  });

  test('clicking header logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const headerLogo = page.locator(HEADER.LOGO).first();
    const visible = await headerLogo.isVisible().catch(() => false);
    if (!visible) {
      console.warn('[Header] Header logo not visible on /ceylon-cannabis/');
      return;
    }
    await headerLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== config.baseURL)
      expect
        .soft(
          false,
          `[Header] Logo click navigated to "${currentUrl}", expected "${config.baseURL}"`
        )
        .toBeTruthy();
  });

  test('hamburger menu is present on mobile viewport @smoke', async ({ page }) => {
    await page.setViewportSize({
      width: config.viewports.mobile.width,
      height: config.viewports.mobile.height,
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const visible = await page
      .locator(HEADER.HAMBURGER)
      .isVisible()
      .catch(() => false);
    if (!visible)
      expect
        .soft(false, '[Header] Hamburger menu not visible on mobile viewport')
        .toBeTruthy();
    const logoCount = await page
      .locator(`${HEADER.MOBILE_MENU} .navbar-brand img, ${HEADER.MOBILE_MENU} img`)
      .count();
    if (logoCount === 0)
      expect
        .soft(false, '[Header] No logo found inside hamburger menu')
        .toBeTruthy();
  });

  test('mobile menu opens on hamburger click @smoke', async ({ page }) => {
    await page.setViewportSize({
      width: config.viewports.mobile.width,
      height: config.viewports.mobile.height,
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator(HEADER.HAMBURGER);
    const visible = await menuHam.isVisible().catch(() => false);
    if (!visible) {
      expect
        .soft(false, '[Header] Hamburger button not visible on mobile')
        .toBeTruthy();
      return;
    }
    await menuHam.click();
    const menuVisible = await page
      .locator(HEADER.MOBILE_MENU)
      .isVisible()
      .catch(() => false);
    if (!menuVisible)
      expect
        .soft(false, '[Header] Mobile menu did not open after hamburger click')
        .toBeTruthy();
  });

  test('mobile menu logo navigates to home page @smoke', async ({ page }) => {
    await page.setViewportSize({
      width: config.viewports.mobile.width,
      height: config.viewports.mobile.height,
    });
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator(HEADER.HAMBURGER);
    if (!(await menuHam.isVisible().catch(() => false))) {
      console.warn('[Header] Hamburger not visible on /contact-us/');
      return;
    }
    await menuHam.click();
    const mobileLogo = page.locator(
      `${HEADER.MOBILE_MENU} .navbar-brand, ${HEADER.MOBILE_MENU} [data-testid="header-logo"]`
    );
    if (!(await mobileLogo.isVisible().catch(() => false))) {
      expect
        .soft(false, '[Header] Mobile logo not visible after opening menu')
        .toBeTruthy();
      return;
    }
    await mobileLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    if (currentUrl !== config.baseURL)
      expect
        .soft(
          false,
          `[Header] Mobile logo navigated to "${currentUrl}", expected "${config.baseURL}"`
        )
        .toBeTruthy();
  });

  for (const pagePath of pagesToCheck.slice(0, 5)) {
    const label = pagePath === '/' ? 'homepage' : pagePath;

    test(`active state is shown for current page on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const activeLink = page.locator(HEADER.ACTIVE_LINK).first();
      const desktopActive = await activeLink.isVisible().catch(() => false);
      if (desktopActive) {
        const text = await activeLink.textContent();
        if (!text?.trim())
          expect
            .soft(
              false,
              `[Header] Active menu link has no visible text on ${pagePath}`
            )
            .toBeTruthy();
      }
      const menuHamVisible = await page
        .locator(HEADER.HAMBURGER)
        .isVisible()
        .catch(() => false);
      if (menuHamVisible) {
        await page.locator(HEADER.HAMBURGER).click();
        await page
          .locator(HEADER.MOBILE_MENU)
          .waitFor({ state: 'visible', timeout: 3000 })
          .catch(() => {});
        const mobileActiveExists = await page
          .locator(HEADER.MOBILE_ACTIVE)
          .count();
        if (mobileActiveExists === 0)
          expect
            .soft(
              false,
              `[Header] No active menu item in mobile menu on ${pagePath}`
            )
            .toBeTruthy();
      }
    });
  }

  test('logo is visible in header on all pages @smoke', async ({ page }) => {
    const missing: string[] = [];
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const desktopLogoVisible = await page
        .locator(HEADER.LOGO_IMG)
        .first()
        .isVisible()
        .catch(() => false);
      if (!desktopLogoVisible) {
        missing.push(pagePath);
      }
    }
    if (missing.length > 0) {
      expect(
        false,
        `[Header] No logo found on these pages:\n${missing.map((p) => `  - ${p}`).join('\n')}`
      ).toBeTruthy();
    }
  });

  test('clicking header logo from any page opens home page @smoke', async ({ page }) => {
    const errors: string[] = [];
    for (const pagePath of pagesToCheck.filter((p: string) => p !== '/').slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const headerLogo = page.locator(HEADER.LOGO).first();
      if (!(await headerLogo.isVisible().catch(() => false))) continue;
      await headerLogo.click();
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url().replace(/\/$/, '');
      if (currentUrl !== config.baseURL) {
        errors.push(
          `Logo click on ${pagePath} navigated to "${currentUrl}", expected "${config.baseURL}"`
        );
      }
    }
    if (errors.length > 0) {
      expect(false, `[Header] ${errors.join(' | ')}`).toBeTruthy();
    }
  });
});
