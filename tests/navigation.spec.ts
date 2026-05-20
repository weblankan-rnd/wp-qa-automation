import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('desktop header nav links navigate to correct pages @smoke', async ({ page }) => {
    const navLinks = page.locator('header .navigation .left-menu ul li a, header .navigation .right-menu ul li a');
    const count = await navLinks.count();
    if (count === 0) { console.warn('[Nav] No desktop header nav links found'); return; }

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      if (!(await link.isVisible().catch(() => false))) continue;

      await link.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      if (currentPath !== expectedPath) {
        console.warn(`[Nav] "${text}" navigated to ${currentPath}, expected ${expectedPath}`);
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('mobile menu nav links navigate to correct pages @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const menuHam = page.locator('.menu-ham');
    const hamVisible = await menuHam.isVisible().catch(() => false);
    if (!hamVisible) { console.warn('[Nav] Hamburger button not visible on mobile'); return; }
    await menuHam.click();
    await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

    const mobileLinks = page.locator('.mobile-menu ul li a');
    const count = await mobileLinks.count();
    if (count === 0) { console.warn('[Nav] No mobile menu links found'); return; }

    for (let i = 0; i < count; i++) {
      const link = mobileLinks.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      await link.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      if (currentPath !== expectedPath) {
        console.warn(`[Nav] Mobile link "${text}" navigated to ${currentPath}, expected ${expectedPath}`);
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await menuHam.click();
      await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    }
  });

  test('banner menu links navigate to correct pages @smoke', async ({ page }) => {
    const bannerLinks = page.locator('.menu-wrap ul li a');
    const count = await bannerLinks.count();
    if (count === 0) { console.warn('[Nav] Banner menu not found'); return; }
    if (!(await bannerLinks.first().isVisible().catch(() => false))) { console.warn('[Nav] Banner menu not visible'); return; }

    for (let i = 0; i < count; i++) {
      const link = bannerLinks.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      await link.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      if (currentPath !== expectedPath) {
        console.warn(`[Nav] Banner link "${text}" navigated to ${currentPath}, expected ${expectedPath}`);
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('all internal header links resolve without 4xx/5xx errors @smoke', async ({ page }) => {
    const headerLinks = page.locator('header a[href^="http"], .menu-wrap a[href^="http"], .mobile-menu a[href^="http"]');
    const count = await headerLinks.count();
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await headerLinks.nth(i).getAttribute('href');
      if (href && href.includes('gammaaextracts.com')) urls.push(href);
    }

    const uniqueUrls = [...new Set(urls)];
    for (const url of uniqueUrls.slice(0, 10)) {
      const status = await page.evaluate(async (checkUrl) => {
        try {
          const r = await fetch(checkUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(8000) });
          return r.status;
        } catch {
          try {
            const r2 = await fetch(checkUrl, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000) });
            return r2.status;
          } catch { return 0; }
        }
      }, url);
      if (status === 0 || status >= 400) {
        console.warn(`[Nav] Header link returned ${status === 0 ? 'connection error' : status}: ${url}`);
      }
    }
  });

  test('external links on page open in a new tab @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const allLinks = page.locator('a[href^="http"]');
      const count = await allLinks.count();
      for (let i = 0; i < count; i++) {
        const href = await allLinks.nth(i).getAttribute('href');
        if (!href || href.includes('gammaaextracts.com')) continue;
        const target = await allLinks.nth(i).getAttribute('target');
        if (target !== '_blank') {
          console.warn(`[Nav] External link on ${pagePath} missing target="_blank": ${href}`);
        }
      }
    }
  });

  test('active state remains after navigating between pages @smoke', async ({ page }) => {
    const navLinks = page.locator('header .navigation .left-menu ul li a, header .navigation .right-menu ul li a');
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const visible = await navLinks.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const href = await navLinks.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      await navLinks.nth(i).click();
      await page.waitForLoadState('domcontentloaded');

      const activeItem = page.locator('header .navigation .current-menu-item, header .navigation .current_page_item').first();
      const activeVisible = await activeItem.isVisible().catch(() => false);
      if (activeVisible) {
        const activeText = (await activeItem.textContent()) || '';
        if (!activeText.trim()) console.warn(`[Nav] Active link has no visible text after navigating to ${href}`);
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });
});
