import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

// Archive/taxonomy/author pages may not have the same nav structure as content pages
const isArchivePage = (p: string) =>
  p.startsWith('/category/') || p.startsWith('/tag/') || p.startsWith('/author/');

test.describe('Responsive Design', () => {
  for (const pagePath of pagesToCheck) {
    const label = pagePath === '/' ? 'homepage' : pagePath;
    const isArchive = isArchivePage(pagePath);

    test(`has viewport meta tag on ${label} @smoke`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
      expect(viewport, `Missing viewport meta tag on ${pagePath}`).toBeTruthy();
      expect(
        viewport!.toLowerCase(),
        `Viewport meta should include width=device-width on ${pagePath}`
      ).toContain('width=device-width');
    });

    for (const vp of VIEWPORTS) {
      test(`no horizontal overflow at ${vp.name} (${vp.width}px) on ${label} @smoke`, async ({ page }) => {
        test.setTimeout(60000);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pagePath, { waitUntil: 'load' });

        const overflow = await page.evaluate((vpWidth) => {
          const overflowing: string[] = [];
          const elements = document.querySelectorAll('*');
          for (const el of elements) {
            const style = window.getComputedStyle(el);
            // skip hidden, fixed/sticky/absolute positioned, and clipped elements
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.position === 'fixed' ||
              style.position === 'sticky' ||
              style.position === 'absolute' ||
              style.overflow === 'hidden' ||
              style.overflowX === 'hidden'
            ) continue;

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

        expect(
          overflow,
          `Horizontal overflow at ${vp.name} on ${pagePath}:\n${overflow.join('\n')}`
        ).toHaveLength(0);
      });
    }

    test(`navigation is usable on mobile on ${label} @smoke`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(pagePath, { waitUntil: 'load' });

      const hamburger = page.locator(
        '[class*="hamburger"], [class*="menu-toggle"], [class*="nav-toggle"], ' +
        '[aria-label*="menu" i], [aria-label*="navigation" i], ' +
        'button[class*="menu"], button[class*="toggle"]'
      );
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

      if (isArchive && !hasNav) {
        // Archive pages may render without a full nav — warn but don't fail
        console.warn(`[Responsive] No visible navigation on archive page ${pagePath} at mobile — check theme`);
      } else {
        expect(hasNav, `No visible navigation found on mobile for ${pagePath}`).toBeTruthy();
      }
    });

    test(`text is readable (font-size >= 12px) on mobile on ${label} @smoke`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(pagePath, { waitUntil: 'load' });

      const tinyText = await page.evaluate(() => {
        const small: string[] = [];
        const textEls = document.querySelectorAll('p, li, span, a, h1, h2, h3, h4, h5, h6, label, button');
        for (const el of textEls) {
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

      expect(
        tinyText,
        `Text smaller than 12px on mobile (${pagePath}):\n${tinyText.join('\n')}`
      ).toHaveLength(0);
    });
  }

  test('images are not wider than viewport on mobile @smoke', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'load' });

    const oversized = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      return imgs
        .filter(img => {
          const style = window.getComputedStyle(img);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return img.getBoundingClientRect().width > window.innerWidth + 1;
        })
        .map(img => img.src.split('/').pop() || img.src)
        .slice(0, 10);
    });

    expect(
      oversized,
      `Images wider than viewport on mobile:\n${oversized.join('\n')}`
    ).toHaveLength(0);
  });
});
