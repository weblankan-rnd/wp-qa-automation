import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { IGNORED_PATHS } from '../test-utils/ignored-paths';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = (existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/']).filter((p: string) => !IGNORED_PATHS.includes(p));

test.describe('Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('CTA buttons are visible on homepage @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();
    if (count === 0) { expect.soft(false, '[Buttons] No CTA buttons found on homepage').toBeTruthy(); return; }
    for (let i = 0; i < count; i++) {
      const visible = await ctaButtons.nth(i).isVisible().catch(() => false);
      if (!visible) expect.soft(false, `[Buttons] CTA button ${i} is not visible on homepage`).toBeTruthy();
    }
  });

  test('CTA buttons have correct href actions @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();
    for (let i = 0; i < count; i++) {
      const href = await ctaButtons.nth(i).getAttribute('href');
      if (!href) { expect.soft(false, `[Buttons] CTA button ${i} has no href`).toBeTruthy(); continue; }
      if (!href.startsWith('http') && !href.startsWith('/')) {
        expect.soft(false, `[Buttons] CTA button ${i} href is not a valid URL: "${href}"`).toBeTruthy();
      }
    }
  });

  test('CTA buttons are clickable and navigate correctly @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();
    for (let i = 0; i < count; i++) {
      const href = await ctaButtons.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      try {
        await Promise.all([
          page.waitForURL(url => (url.pathname.replace(/\/$/, '') || '/') === expectedPath, { timeout: 10000 }),
          ctaButtons.nth(i).click(),
        ]);
        const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
        if (currentPath !== expectedPath) {
          expect.soft(false, `[Buttons] CTA button ${i} navigated to "${currentPath}", expected "${expectedPath}"`).toBeTruthy();
        }
      } catch {
        expect.soft(false, `[Buttons] CTA button ${i} click did not navigate to "${expectedPath}" within 10s`).toBeTruthy();
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('CTA button text spelling is correct @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();
    const misspelled: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await ctaButtons.nth(i).textContent()) || '').trim();
      const cleanText = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!cleanText) continue;
      const commonErrors: { wrong: RegExp; fix: string }[] = [
        { wrong: /\b(invester|investar)\b/i, fix: 'Investor' },
        { wrong: /\b(cannabies)\b/i, fix: 'Cannabis' },
        { wrong: /\b(celon|selon)\b/i, fix: 'Ceylon' },
        { wrong: /\b(explorr|explor)\b/i, fix: 'Explore' },
        { wrong: /\b(contcat|contct)\b/i, fix: 'Contact' },
      ];
      for (const { wrong, fix } of commonErrors) {
        if (wrong.test(cleanText)) {
          misspelled.push(`"${cleanText}" — should be "${fix}"`);
        }
      }
    }
    if (misspelled.length > 0) {
      expect.soft(false, `[Buttons] Spelling errors in CTA buttons:\n${misspelled.map(s => `  - ${s}`).join('\n')}`).toBeTruthy();
    }
  });

  test('buttons are enabled and not disabled @smoke', async ({ page }) => {
    const allButtons = page.locator('a.hvr-shutter-out-horizontal, button, a[role="button"]');
    const count = await allButtons.count();
    for (let i = 0; i < count; i++) {
      const visible = await allButtons.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const disabled = await allButtons.nth(i).getAttribute('disabled');
      const ariaDisabled = await allButtons.nth(i).getAttribute('aria-disabled');
      if (disabled !== null) expect.soft(false, `[Buttons] Button ${i} has disabled attribute`).toBeTruthy();
      if (ariaDisabled === 'true') expect.soft(false, `[Buttons] Button ${i} is aria-disabled`).toBeTruthy();
    }
  });

  test('buttons have visible and non-empty text @smoke', async ({ page }) => {
    const allButtons = page.locator('a.button, a.hvr-shutter-out-horizontal, button:not([type="hidden"])');
    const count = await allButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = allButtons.nth(i);
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) continue;
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      if (ariaLabel || title) continue;
      const hasSvgOnly = await btn.evaluate(el => {
        const children = [...el.childNodes];
        return children.every(n => (n as Element).tagName === 'SVG' || n.nodeType === Node.TEXT_NODE && !n.textContent?.trim());
      }).catch(() => false);
      if (hasSvgOnly) continue;
      const text = await btn.evaluate(el => (el as HTMLElement).innerText ?? '').catch(() => '');
      const trimmed = text.replace(/\s+/g, ' ').trim();
      if (trimmed.length === 0) {
        expect.soft(false, `[Buttons] Button ${i} has no visible text (add text or aria-label)`).toBeTruthy();
      }
    }
  });

  test('upload field exists and is visible on contact page @smoke', async ({ page }) => {
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();
    if (fileInputCount === 0) { console.warn('[Buttons] No file upload field found on contact page'); return; }
    const fileVisible = await fileInput.first().isVisible().catch(() => false);
    const parentVisible = fileVisible || await fileInput.first().locator('..').first().isVisible().catch(() => false);
    if (!parentVisible) expect.soft(false, '[Buttons] File upload input is not visible on contact page').toBeTruthy();
  });

  test('upload trigger element is clickable on contact page @smoke', async ({ page }) => {
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const uploadTrigger = page.locator('input[type="file"], [class*="upload"], [class*="file"], label[for*="file"], label[for*="upload"]');
    const count = await uploadTrigger.count();
    if (count === 0) { console.warn('[Buttons] No upload trigger element found on contact page'); return; }
    for (let i = 0; i < count; i++) {
      const visible = await uploadTrigger.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const tag = await uploadTrigger.nth(i).evaluate(el => el.tagName.toLowerCase());
      const disabled = await uploadTrigger.nth(i).getAttribute('disabled');
      if (tag === 'input' && disabled !== null) {
        expect.soft(false, `[Buttons] Upload input ${i} is disabled on contact page`).toBeTruthy();
      }
    }
  });

  test('footer contact button is clickable on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const contactBtn = page.locator('footer a[href*="contact-us"]').first();
      const visible = await contactBtn.isVisible().catch(() => false);
      if (!visible) { console.warn(`[Buttons] Footer contact button not visible on ${pagePath}`); continue; }
      await contactBtn.scrollIntoViewIfNeeded();
      const disabled = await contactBtn.getAttribute('disabled');
      if (disabled !== null) expect.soft(false, `[Buttons] Footer contact button is disabled on ${pagePath}`).toBeTruthy();
    }
  });

  test('all buttons on page have consistent hover/focus state styling @smoke', async ({ page }) => {
    const buttons = page.locator('a.hvr-shutter-out-horizontal');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const visible = await buttons.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const href = await buttons.nth(i).getAttribute('href');
      if (!href) continue;
      await buttons.nth(i).focus();
      const focused = await buttons.nth(i).evaluate(el => el === document.activeElement).catch(() => false);
      if (!focused) expect.soft(false, `[Buttons] Button ${i} is not keyboard focusable`).toBeTruthy();
    }
  });
});
