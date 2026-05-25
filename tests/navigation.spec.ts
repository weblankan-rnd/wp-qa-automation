import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';
import { getPagesToCheck } from '../test-utils/get-pages-to-check';
import { HEADER, NAVIGATION } from '../test-utils/selectors';

const pagesToCheck = getPagesToCheck();

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('desktop header nav links navigate to correct pages @smoke', async ({ page }) => {
    const navLinks = page.locator(HEADER.NAV_LINKS);
    const count = await navLinks.count();
    if (count === 0) {
      expect.soft(false, '[Nav] No desktop header nav links found').toBeTruthy();
      return;
    }
    for (let i = 0; i < count; i++) {
      const text = ((await navLinks.nth(i).textContent()) || '').trim();
      const href = await navLinks.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      if (!(await navLinks.nth(i).isVisible().catch(() => false))) continue;
      await navLinks.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      if (currentPath !== expectedPath) {
        expect
          .soft(
            false,
            `[Nav] "${text}" navigated to "${currentPath}", expected "${expectedPath}"`
          )
          .toBeTruthy();
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('mobile menu nav links navigate to correct pages @smoke', async ({ page }) => {
    await page.setViewportSize({
      width: config.viewports.mobile.width,
      height: config.viewports.mobile.height,
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const menuHam = page.locator(HEADER.HAMBURGER);
    if (!(await menuHam.isVisible().catch(() => false))) {
      expect.soft(false, '[Nav] Hamburger button not visible on mobile').toBeTruthy();
      return;
    }
    await menuHam.click();
    await page
      .locator(HEADER.MOBILE_MENU)
      .waitFor({ state: 'visible', timeout: 3000 })
      .catch(() => {});
    const mobileLinks = page.locator(HEADER.MOBILE_LINKS);
    const count = await mobileLinks.count();
    if (count === 0) {
      expect.soft(false, '[Nav] No mobile menu links found').toBeTruthy();
      return;
    }
    for (let i = 0; i < count; i++) {
      const text = ((await mobileLinks.nth(i).textContent()) || '').trim();
      const href = await mobileLinks.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      await mobileLinks.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      if (currentPath !== expectedPath) {
        expect
          .soft(
            false,
            `[Nav] Mobile link "${text}" navigated to "${currentPath}", expected "${expectedPath}"`
          )
          .toBeTruthy();
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await menuHam.click();
      await page
        .locator(HEADER.MOBILE_MENU)
        .waitFor({ state: 'visible', timeout: 3000 })
        .catch(() => {});
    }
  });

  test('banner menu links navigate to correct pages @smoke', async ({ page }) => {
    const bannerLinks = page.locator(NAVIGATION.BANNER_LINKS);
    const count = await bannerLinks.count();
    if (count === 0) {
      console.warn('[Nav] Banner menu not found');
      return;
    }
    if (!(await bannerLinks.first().isVisible().catch(() => false))) {
      console.warn('[Nav] Banner menu not visible');
      return;
    }
    for (let i = 0; i < count; i++) {
      const text = ((await bannerLinks.nth(i).textContent()) || '').trim();
      const href = await bannerLinks.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      await bannerLinks.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      if (currentPath !== expectedPath) {
        expect
          .soft(
            false,
            `[Nav] Banner link "${text}" navigated to "${currentPath}", expected "${expectedPath}"`
          )
          .toBeTruthy();
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('all internal header links resolve without 4xx/5xx errors @smoke', async ({ page }) => {
    const headerLinks = page.locator(NAVIGATION.HEADER_LINKS);
    const count = await headerLinks.count();
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await headerLinks.nth(i).getAttribute('href');
      if (href && href.includes('gammaaextracts.com')) urls.push(href);
    }
    for (const url of [...new Set(urls)].slice(0, 10)) {
      const status = await page.evaluate(async (checkUrl) => {
        try {
          const r = await fetch(checkUrl, {
            method: 'HEAD',
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
          });
          return r.status;
        } catch {
          try {
            const r2 = await fetch(checkUrl, {
              method: 'GET',
              redirect: 'follow',
              signal: AbortSignal.timeout(8000),
            });
            return r2.status;
          } catch {
            return 0;
          }
        }
      }, url);
      if (status === 0 || status >= 400) {
        expect
          .soft(
            false,
            `[Nav] Header link returned ${status === 0 ? 'connection error' : status}: ${url}`
          )
          .toBeTruthy();
      }
    }
  });

  test('external links on page open in a new tab @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const allLinks = page.locator(NAVIGATION.EXTERNAL_LINKS);
      const count = await allLinks.count();
      for (let i = 0; i < count; i++) {
        const href = await allLinks.nth(i).getAttribute('href');
        if (!href || href.includes('gammaaextracts.com')) continue;
        const target = await allLinks.nth(i).getAttribute('target');
        if (target !== '_blank') {
          expect
            .soft(
              false,
              `[Nav] External link missing target="_blank" on ${pagePath}: ${href}`
            )
            .toBeTruthy();
        }
      }
    }
  });

  test('active state remains after navigating between pages @smoke', async ({ page }) => {
    const navLinks = page.locator(HEADER.NAV_LINKS);
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      if (!(await navLinks.nth(i).isVisible().catch(() => false))) continue;
      const href = await navLinks.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      await navLinks.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      const activeItem = page.locator(HEADER.ACTIVE_ITEM).first();
      if (await activeItem.isVisible().catch(() => false)) {
        const activeText = (await activeItem.textContent()) || '';
        if (!activeText.trim())
          expect
            .soft(
              false,
              `[Nav] Active nav item has no text after navigating to ${href}`
            )
            .toBeTruthy();
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });
});
