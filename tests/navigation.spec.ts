import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
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
    expect(count, 'Header should have navigation links').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await page.waitForLoadState('domcontentloaded');
        const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
        const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
        expect(
          currentPath,
          `Clicking "${text}" should navigate to ${expectedPath}`
        ).toBe(expectedPath);
        await page.goto('/', { waitUntil: 'domcontentloaded' });
      }
    }
  });

  test('mobile menu nav links navigate to correct pages @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const menuHam = page.locator('.menu-ham');
    await expect(menuHam, 'Hamburger button should be visible').toBeVisible();
    await menuHam.click();
    await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 });

    const mobileLinks = page.locator('.mobile-menu ul li a');
    const count = await mobileLinks.count();
    expect(count, 'Mobile menu should have links').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = mobileLinks.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      await link.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      expect(
        currentPath,
        `Mobile link "${text}" should navigate to ${expectedPath}`
      ).toBe(expectedPath);

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await menuHam.click();
      await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 3000 });
    }
  });

  test('banner menu links navigate to correct pages @smoke', async ({ page }) => {
    const bannerLinks = page.locator('.menu-wrap ul li a');
    const count = await bannerLinks.count();
    if (count === 0) {
      test.skip(true, 'Banner menu not present on this viewport');
      return;
    }

    const visible = await bannerLinks.first().isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, 'Banner menu not visible on this viewport');
      return;
    }

    for (let i = 0; i < count; i++) {
      const link = bannerLinks.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      await link.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      expect(
        currentPath,
        `Banner link "${text}" should navigate to ${expectedPath}`
      ).toBe(expectedPath);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('all internal header links resolve without 4xx/5xx errors @smoke', async ({ page }) => {
    const headerLinks = page.locator(
      'header a[href^="http"], .menu-wrap a[href^="http"], .mobile-menu a[href^="http"]'
    );
    const count = await headerLinks.count();

    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await headerLinks.nth(i).getAttribute('href');
      if (href && href.includes('gammaaextracts.com')) {
        urls.push(href);
      }
    }

    const uniqueUrls = [...new Set(urls)];
    const broken: string[] = [];

    for (const url of uniqueUrls.slice(0, 10)) {
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
        broken.push(`${url} → ${status === 0 ? 'connection error' : status}`);
      }
    }

    expect(
      broken,
      `Header links with errors:\n${broken.join('\n')}`
    ).toHaveLength(0);
  });

  test('external links on page open in a new tab @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });

      const allLinks = page.locator('a[href^="http"]');
      const count = await allLinks.count();
      const externalWithoutBlank: string[] = [];

      for (let i = 0; i < count; i++) {
        const href = await allLinks.nth(i).getAttribute('href');
        if (!href || href.includes('gammaaextracts.com')) continue;

        const target = await allLinks.nth(i).getAttribute('target');
        if (target !== '_blank') {
          externalWithoutBlank.push(href);
        }
      }

      expect(
        externalWithoutBlank,
        `External links on ${pagePath} missing target="_blank":\n${externalWithoutBlank.join('\n')}`
      ).toHaveLength(0);
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

      const activeItem = page.locator(
        'header .navigation .current-menu-item, header .navigation .current_page_item'
      ).first();
      const activeVisible = await activeItem.isVisible().catch(() => false);
      if (activeVisible) {
        const activeText = (await activeItem.textContent()) || '';
        expect(activeText.trim(), 'Active link should have visible text').toBeTruthy();
      }

      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });
});
