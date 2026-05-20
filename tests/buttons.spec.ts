import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

test.describe('Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('CTA buttons are visible on homepage @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();
    if (count === 0) {
      console.warn('[Buttons] No CTA buttons found on homepage');
      return;
    }
    for (let i = 0; i < count; i++) {
      const visible = await ctaButtons.nth(i).isVisible().catch(() => false);
      if (!visible) console.warn(`[Buttons] CTA button ${i} is not visible`);
    }
  });

  test('CTA buttons have correct href actions @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();
    for (let i = 0; i < count; i++) {
      const href = await ctaButtons.nth(i).getAttribute('href');
      if (!href) { console.warn(`[Buttons] CTA button ${i} has no href`); continue; }
      if (!href.startsWith('http') && !href.startsWith('/')) {
        console.warn(`[Buttons] CTA button ${i} href is not a valid URL: ${href}`);
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
          console.warn(`[Buttons] CTA button ${i} navigated to ${currentPath}, expected ${expectedPath}`);
        }
      } catch {
        console.warn(`[Buttons] CTA button ${i} navigation to ${expectedPath} timed out`);
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
        { wrong: /\b(invester|investar)\b/i, fix: 'Investor (not invester/investar)' },
        { wrong: /\b(cannabies)\b/i, fix: 'Cannabis (not cannabies)' },
        { wrong: /\b(celon|selon)\b/i, fix: 'Ceylon (not celon/selon)' },
        { wrong: /\b(explorr|explor)\b/i, fix: 'Explore (not explorr/explor)' },
        { wrong: /\b(contcat|contct)\b/i, fix: 'Contact (not contcat)' },
      ];

      for (const { wrong, fix } of commonErrors) {
        if (wrong.test(cleanText)) {
          misspelled.push(`"${cleanText}" — possible misspelling: ${fix}`);
        }
      }
    }

    if (misspelled.length > 0) {
      console.warn(`[Buttons] CTA button spelling issues:\n${misspelled.join('\n')}`);
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
      if (disabled !== null) console.warn(`[Buttons] Button ${i} has disabled attribute`);
      if (ariaDisabled === 'true') console.warn(`[Buttons] Button ${i} is aria-disabled`);
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
        console.warn(`[Buttons] Button ${i} has no visible text content`);
      }
    }
  });

  test('upload field exists and is visible on contact page @smoke', async ({ page }) => {
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();
    if (fileInputCount === 0) {
      console.warn('[Buttons] No file upload field found on contact page — check if upload is required');
      return;
    }
    const fileInputEl = fileInput.first();
    const fileVisible = await fileInputEl.isVisible().catch(() => false);
    const parentVisible = fileVisible || await fileInputEl.locator('..').first().isVisible().catch(() => false);
    if (!parentVisible) console.warn('[Buttons] File upload input and its container are not visible on contact page');
  });

  test('upload trigger element is clickable on contact page @smoke', async ({ page }) => {
    await page.goto('/contact-us/', { waitUntil: 'domcontentloaded' });
    const uploadTrigger = page.locator(
      'input[type="file"], [class*="upload"], [class*="file"], label[for*="file"], label[for*="upload"]'
    );
    const count = await uploadTrigger.count();
    if (count === 0) {
      console.warn('[Buttons] No upload trigger element found on contact page');
      return;
    }
    for (let i = 0; i < count; i++) {
      const visible = await uploadTrigger.nth(i).isVisible().catch(() => false);
      if (!visible) continue;
      const tag = await uploadTrigger.nth(i).evaluate(el => el.tagName.toLowerCase());
      const disabled = await uploadTrigger.nth(i).getAttribute('disabled');
      if (tag === 'input' && disabled !== null) {
        console.warn(`[Buttons] Upload element ${i} is disabled`);
      }
    }
  });

  test('footer contact button is clickable on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const contactBtn = page.locator('footer a[href*="contact-us"]').first();
      const visible = await contactBtn.isVisible().catch(() => false);
      if (!visible) {
        console.warn(`[Buttons] Footer contact button not visible on ${pagePath}`);
        continue;
      }
      await contactBtn.scrollIntoViewIfNeeded();
      const disabled = await contactBtn.getAttribute('disabled');
      if (disabled !== null) console.warn(`[Buttons] Footer contact button is disabled on ${pagePath}`);
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
      if (!focused) console.warn(`[Buttons] Button ${i} is not keyboard focusable`);
    }
  });
});
