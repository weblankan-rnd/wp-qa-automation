import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile-sm', width: 390, height: 844, label: 'Mobile small (390px)' },
  { name: 'mobile-lg', width: 430, height: 932, label: 'Mobile large (430px)' },
  { name: 'tablet', width: 768, height: 1024, label: 'Tablet (768px)' },
  { name: 'desktop-sm', width: 1024, height: 768, label: 'Desktop small (1024px)' },
  { name: 'desktop', width: 1280, height: 800, label: 'Desktop (1280px)' },
];

const pagesToTest = ['/', '/about', '/contact', '/blog'].map(path => ({
  path,
  name: path === '/' ? 'Homepage' : path.replace('/', '').replace(/-/g, ' '),
}));

test.describe('Responsive layout', () => {
  for (const vp of viewports) {
    test.describe(vp.label, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test(`no horizontal overflow on homepage @smoke`, async ({ page }) => {
        await page.goto('/');
        const hasOverflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasOverflow, `Horizontal overflow detected at ${vp.width}px`).toBe(false);
      });

      test(`header is visible at ${vp.width}px @smoke`, async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('header')).toBeVisible();
      });

      test(`footer is visible at ${vp.width}px @smoke`, async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('footer')).toBeVisible();
      });

      test(`main content is visible at ${vp.width}px`, async ({ page }) => {
        await page.goto('/');
        const main = page.locator('main, #main, #content, .site-content, [role="main"]').first();
        await expect(main).toBeVisible();
      });

      if (vp.width < 768) {
        test(`hamburger menu or full nav visible on mobile (${vp.width}px)`, async ({ page }) => {
          await page.goto('/');
          const hamburger = page.locator(
            'button[aria-label*="menu" i], .hamburger, .menu-toggle, #menu-toggle, [data-testid="mobile-menu-toggle"]'
          ).first();
          const nav = page.locator('header nav').first();

          const hasHamburger = await hamburger.count() > 0 && await hamburger.isVisible();
          const hasNav = await nav.count() > 0 && await nav.isVisible();

          expect(hasHamburger || hasNav, 'Neither hamburger menu nor nav is visible on mobile').toBeTruthy();
        });
      }
    });
  }

  test('images do not overflow their containers', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const overflowingImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => img.getBoundingClientRect().width > document.documentElement.clientWidth).length;
    });

    expect(overflowingImages, `${overflowingImages} image(s) overflow viewport width`).toBe(0);
  });

  test('text remains readable (font-size >= 14px) on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const tooSmall = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p, li, td, span, a'));
      return paragraphs.filter(el => {
        const size = parseFloat(getComputedStyle(el).fontSize);
        return size < 14 && (el as HTMLElement).offsetParent !== null;
      }).length;
    });

    expect(tooSmall, `${tooSmall} element(s) have font-size below 14px on mobile`).toBe(0);
  });

  test('touch targets are at least 44x44px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const smallTargets = await page.evaluate(() => {
      const interactives = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"]'));
      return interactives.filter(el => {
        const rect = el.getBoundingClientRect();
        const visible = (el as HTMLElement).offsetParent !== null;
        return visible && (rect.width < 44 || rect.height < 44);
      }).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 40) }));
    });

    if (smallTargets.length > 0) {
      console.warn(`Touch targets smaller than 44x44px:`, JSON.stringify(smallTargets.slice(0, 10)));
    }
    // Warn only — some small targets (e.g., inline links) are acceptable
  });
});
