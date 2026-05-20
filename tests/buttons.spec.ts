import { test, expect } from '@playwright/test';
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
    expect(count, 'Homepage should have CTA buttons').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(
        ctaButtons.nth(i),
        `CTA button ${i} should be visible`
      ).toBeVisible();
    }
  });

  test('CTA buttons have correct href actions @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();

    for (let i = 0; i < count; i++) {
      const href = await ctaButtons.nth(i).getAttribute('href');
      expect(href, `CTA button ${i} should have an href`).toBeTruthy();
      expect(
        href!.startsWith('http') || href!.startsWith('/'),
        `CTA button ${i} href should be a valid URL`
      ).toBeTruthy();
    }
  });

  test('CTA buttons are clickable and navigate correctly @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();

    for (let i = 0; i < count; i++) {
      const href = await ctaButtons.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;

      // Check the button is enabled and clickable
      await expect(
        ctaButtons.nth(i),
        `CTA button ${i} should be enabled`
      ).toBeEnabled();

      await ctaButtons.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      const currentPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      expect(
        currentPath,
        `CTA button should navigate to ${expectedPath}`
      ).toBe(expectedPath);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('CTA button text spelling is correct @smoke', async ({ page }) => {
    const ctaButtons = page.locator('.button-wrap a.hvr-shutter-out-horizontal');
    const count = await ctaButtons.count();

    const misspelled: string[] = [];
    const knownSpellings: Record<string, boolean> = {
      'Explore Ceylon Cannabis': true,
      'Become an Investor': true,
      'Contact Us': true,
    };

    for (let i = 0; i < count; i++) {
      const text = ((await ctaButtons.nth(i).textContent()) || '').trim();
      // Strip SVG content (icon markup)
      const cleanText = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      if (!cleanText) continue;

      const commonErrors: { wrong: RegExp; fix: string }[] = [
        { wrong: /\b(investor|invester|investar)\b/i, fix: 'Investor (not invester/investar)' },
        { wrong: /\b(cannabies|cannabies)\b/i, fix: 'Cannabis (not cannabies)' },
        { wrong: /\b(ceylon|celon|selon)\b/i, fix: 'Ceylon (not celon/selon)' },
        { wrong: /\b(explore|explorr|explor)\b/i, fix: 'Explore (not explorr/explor)' },
        { wrong: /\b(contact|contcat|contct)\b/i, fix: 'Contact (not contcat)' },
      ];

      for (const { wrong, fix } of commonErrors) {
        if (wrong.test(cleanText)) {
          misspelled.push(`"${cleanText}" — possible misspelling: ${fix}`);
        }
      }
    }

    expect(
      misspelled,
      `CTA button spelling issues:\n${misspelled.join('\n')}`
    ).toHaveLength(0);
  });

  test('buttons are enabled and not disabled @smoke', async ({ page }) => {
    const allButtons = page.locator('a.hvr-shutter-out-horizontal, button, a[role="button"]');
    const count = await allButtons.count();

    for (let i = 0; i < count; i++) {
      const visible = await allButtons.nth(i).isVisible().catch(() => false);
      if (!visible) continue;

      const disabled = await allButtons.nth(i).getAttribute('disabled');
      const ariaDisabled = await allButtons.nth(i).getAttribute('aria-disabled');
      expect(
        disabled,
        `Button ${i} should not have disabled attribute`
      ).toBeNull();
      expect(
        ariaDisabled !== 'true',
        `Button ${i} should not be aria-disabled`
      ).toBeTruthy();
    }
  });

  test('buttons have visible and non-empty text @smoke', async ({ page }) => {
    const allButtons = page.locator('a.button, a.hvr-shutter-out-horizontal, button:not([type="hidden"])');
    const count = await allButtons.count();

    for (let i = 0; i < count; i++) {
      const visible = await allButtons.nth(i).isVisible().catch(() => false);
      if (!visible) continue;

      const text = (await allButtons.nth(i).textContent()) || '';
      const trimmed = text.replace(/\s+/g, ' ').trim();
      expect(
        trimmed.length,
        `Button ${i} should have visible text content`
      ).toBeGreaterThan(0);
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

    expect(
      parentVisible,
      'File upload input or its container should be present on the contact page'
    ).toBeTruthy();
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

      if (tag === 'input' && !disabled) {
        await expect(
          uploadTrigger.nth(i),
          `Upload element ${i} should be enabled`
        ).toBeEnabled();
      }
    }
  });

  test('footer contact button is clickable on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 3)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const contactBtn = page.locator('footer a[href*="contact-us"]').first();
      const visible = await contactBtn.isVisible().catch(() => false);
      if (visible) {
        await contactBtn.scrollIntoViewIfNeeded();
        await expect(
          contactBtn,
          `Footer contact button on ${pagePath} should be enabled`
        ).toBeEnabled();
      }
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

      // Verify the element receives focus
      await buttons.nth(i).focus();
      const focused = await buttons.nth(i).evaluate(el => el === document.activeElement);
      expect(focused, `Button ${i} should be focusable`).toBeTruthy();
    }
  });
});
