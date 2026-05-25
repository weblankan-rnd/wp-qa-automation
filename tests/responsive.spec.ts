import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';
import {
  getPagesToCheck,
  isArchivePage,
  pageLabel,
} from '../test-utils/get-pages-to-check';
import { RESPONSIVE } from '../test-utils/selectors';

const pagesToCheck = getPagesToCheck();
const VIEWPORTS = [
  { name: 'mobile', width: config.viewports.mobile.width, height: config.viewports.mobile.height },
  { name: 'tablet', width: config.viewports.tablet.width, height: config.viewports.tablet.height },
  { name: 'desktop', width: config.viewports.desktop.width, height: config.viewports.desktop.height },
];

test.describe('Responsive Design', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);

    test(`has viewport meta tag on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const viewport = await page
        .$eval('meta[name="viewport"]', (el) => el.getAttribute('content'))
        .catch(() => null);
      if (!viewport) {
        expect
          .soft(false, `[Responsive] Missing viewport meta tag on ${pagePath}`)
          .toBeTruthy();
        return;
      }
      if (!viewport.toLowerCase().includes('width=device-width')) {
        expect
          .soft(
            false,
            `[Responsive] Viewport meta missing width=device-width on ${pagePath}: "${viewport}"`
          )
          .toBeTruthy();
      }
    });

    for (const vp of VIEWPORTS) {
      test(`no horizontal overflow at ${vp.name} (${vp.width}px) on ${label} @smoke`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pagePath, { waitUntil: 'load' });

        const overflow = await page.evaluate((vpWidth) => {
          const overflowing: string[] = [];
          const elements = document.querySelectorAll('*');
          for (const el of elements) {
            const style = window.getComputedStyle(el);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.position === 'fixed' ||
              style.position === 'sticky' ||
              style.position === 'absolute' ||
              style.overflow === 'hidden' ||
              style.overflowX === 'hidden'
            )
              continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.right > vpWidth + 1) {
              const tag = el.tagName.toLowerCase();
              const id = el.id ? `#${el.id}` : '';
              const cls = el.classList.length
                ? `.${[...el.classList].slice(0, 2).join('.')}`
                : '';
              overflowing.push(`${tag}${id}${cls} (right: ${Math.round(rect.right)}px)`);
            }
          }
          return [...new Set(overflowing)].slice(0, 10);
        }, vp.width);

        if (overflow.length > 0) {
          expect.soft(
            false,
            `[Responsive] Horizontal overflow at ${vp.name} on ${pagePath}:\n${overflow
              .map((s) => `  - ${s}`)
              .join('\n')}`
          ).toBeTruthy();
        }
      });
    }

    test(`navigation is usable on mobile on ${label} @smoke`, async ({ page }) => {
      await page.setViewportSize({
        width: config.viewports.mobile.width,
        height: config.viewports.mobile.height,
      });
      await page.goto(pagePath, { waitUntil: 'load' });

      const hamburger = page.locator(RESPONSIVE.HAMBURGER);
      const navLinks = page.locator('nav a, header a');
      const hamburgerVisible = await hamburger.first().isVisible().catch(() => false);
      let visibleNavCount = 0;
      const total = await navLinks.count();
      for (let i = 0; i < Math.min(total, 10); i++) {
        if (await navLinks.nth(i).isVisible()) {
          visibleNavCount++;
          break;
        }
      }
      const hasNav = hamburgerVisible || visibleNavCount > 0;
      if (!hasNav) {
        if (isArchivePage(pagePath)) {
          console.warn(`[Responsive] No visible navigation found on mobile for ${pagePath}`);
        } else {
          expect
            .soft(
              false,
              `[Responsive] No visible navigation found on mobile for ${pagePath}`
            )
            .toBeTruthy();
        }
      }
    });

    test(`text is readable (font-size >= 12px) on mobile on ${label} @smoke`, async ({ page }) => {
      await page.setViewportSize({
        width: config.viewports.mobile.width,
        height: config.viewports.mobile.height,
      });
      await page.goto(pagePath, { waitUntil: 'load' });

      const tinyText = await page.evaluate(() => {
        const small: string[] = [];
        const textEls = document.querySelectorAll(
          'p, li, span, a, h1, h2, h3, h4, h5, h6, label, button'
        );
        for (const el of textEls) {
          // Skip elements not actually rendered in the page flow
          if (!(el as HTMLElement).offsetParent) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const text = el.textContent?.trim();
          if (!text) continue;
          const size = parseFloat(style.fontSize);
          if (size < 12) {
            const tag = el.tagName.toLowerCase();
            const snippet = text.slice(0, 30);
            small.push(`${tag}: "${snippet}" — ${size}px`);
          }
        }
        return [...new Set(small)].slice(0, 10);
      });

      if (tinyText.length > 0) {
        expect.soft(
          false,
          `[Responsive] Text smaller than 12px on mobile (${pagePath}):\n${tinyText
            .map((s) => `  - ${s}`)
            .join('\n')}`
        ).toBeTruthy();
      }
    });
  }

  test('images are not wider than viewport on mobile @smoke', async ({ page }) => {
    await page.setViewportSize({
      width: config.viewports.mobile.width,
      height: config.viewports.mobile.height,
    });
    await page.goto('/', { waitUntil: 'load' });

    const oversized = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      return imgs
        .filter((img) => {
          const style = window.getComputedStyle(img);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return img.getBoundingClientRect().width > window.innerWidth + 1;
        })
        .map((img) => img.src.split('/').pop() || img.src)
        .slice(0, 10);
    });

    if (oversized.length > 0) {
      expect.soft(
        false,
        `[Responsive] Images wider than viewport on mobile:\n${oversized.map((s) => `  - ${s}`).join('\n')}`
      ).toBeTruthy();
    }
  });
});
