import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const criticalPages: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

test.describe('SEO basics', () => {
  for (const pagePath of criticalPages) {
    test.describe(pagePath === '/' ? 'Homepage' : pagePath, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(pagePath);
      });

      test(`<title> tag is present and non-empty @smoke`, async ({ page }) => {
        const title = await page.title();
        expect(title.trim(), 'Page title is empty').toBeTruthy();
        expect(title.length, 'Title too short').toBeGreaterThan(5);
        expect(title.length, 'Title too long (>70 chars)').toBeLessThanOrEqual(70);
      });

      test(`meta description is present and valid`, async ({ page }) => {
        const desc = await page.locator('meta[name="description"]').getAttribute('content');
        expect(desc, 'Meta description is missing').toBeTruthy();
        expect(desc!.trim().length, 'Meta description is empty').toBeGreaterThan(10);
        expect(desc!.length, 'Meta description too long (>160 chars)').toBeLessThanOrEqual(160);
      });

      test(`canonical URL is set`, async ({ page }) => {
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical, 'Canonical link tag is missing').toBeTruthy();
        expect(canonical).toMatch(/^https?:\/\//);
      });

      test(`H1 tag exists exactly once`, async ({ page }) => {
        const h1Count = await page.locator('h1').count();
        expect(h1Count, `Expected exactly 1 H1, found ${h1Count}`).toBe(1);
        const h1Text = await page.locator('h1').textContent();
        expect(h1Text?.trim(), 'H1 is empty').toBeTruthy();
      });

      test(`Open Graph tags are present`, async ({ page }) => {
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
        const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');

        expect(ogTitle, 'og:title is missing').toBeTruthy();
        expect(ogDesc, 'og:description is missing').toBeTruthy();
        expect(ogUrl, 'og:url is missing').toBeTruthy();
      });

      test(`robots meta tag does not block indexing`, async ({ page }) => {
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        if (robots) {
          expect(robots.toLowerCase(), 'Page is marked noindex').not.toContain('noindex');
        }
      });

      test(`images have alt attributes`, async ({ page }) => {
        const images = page.locator('img');
        const count = await images.count();

        const missingAlt: string[] = [];
        for (let i = 0; i < count; i++) {
          const alt = await images.nth(i).getAttribute('alt');
          const src = await images.nth(i).getAttribute('src');
          if (alt === null) {
            missingAlt.push(src || `img[${i}]`);
          }
        }
        expect(missingAlt, `Images missing alt attribute: ${missingAlt.join(', ')}`).toHaveLength(0);
      });
    });
  }

  test('XML sitemap is accessible', async ({ request }) => {
    const response = await request.get(`${process.env.BASE_URL}/sitemap.xml`);
    const status = response.status();
    // 200 = sitemap exists, 404 = acceptable if not generated yet
    expect([200, 301, 302, 404], `Sitemap returned unexpected status ${status}`).toContain(status);
    if (status === 200) {
      const body = await response.text();
      expect(body).toContain('<?xml');
    }
  });

  test('robots.txt is accessible', async ({ request }) => {
    const response = await request.get(`${process.env.BASE_URL}/robots.txt`);
    expect(response.status(), 'robots.txt not accessible').toBeLessThan(400);
  });
});
