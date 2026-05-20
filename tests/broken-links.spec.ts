import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const cachePath = 'test-data/.page-cache.json';
const pagesToScan: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

// External domains that block automated requests (rate-limit, 400 bots, or require login).
// Links to these are visually verified — not checked by automation.
// External domains that block automated requests (rate-limit, return 400, or require login).
// Links to these are visually verified — not checked by automation.
const ignoredHostSuffixes = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'linkedin.com',
  'snapchat.com',
  'pinterest.com',
  'maps.app.goo.gl',
  'google.com',
  'wa.me',
  'whatsapp.com',
  'weblankan.com',
  't.me',
  'tiktok.com',
];

function isIgnored(url: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return ignoredHostSuffixes.some(suffix =>
    hostname === suffix || hostname.endsWith('.' + suffix)
  );
}

test.describe('Broken links', () => {
  for (const pagePath of pagesToScan) {
    test(`no broken links on ${pagePath === '/' ? 'homepage' : pagePath} @smoke`, async ({ page, request }) => {
      await page.goto(pagePath);

      const links = page.locator('a[href]');
      const count = await links.count();

      const broken: string[] = [];

      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        if (
          !href ||
          href.startsWith('#') ||
          href.startsWith('tel:') ||
          href.startsWith('mailto:') ||
          href.startsWith('javascript:') ||
          href.startsWith('data:')
        ) {
          continue;
        }

        const url = href.startsWith('http') ? href : `${process.env.BASE_URL}${href}`;

        if (isIgnored(url)) continue;

        try {
          const response = await request.get(url, { timeout: 10000 });
          if (response.status() >= 400) {
            broken.push(`${url} → ${response.status()}`);
          }
        } catch {
          broken.push(`${url} → connection error`);
        }
      }

      expect(broken, `Broken links found:\n${broken.join('\n')}`).toHaveLength(0);
    });
  }

  test('all image src attributes resolve successfully', async ({ page, request }) => {
    await page.goto('/');

    const images = page.locator('img[src]');
    const count = await images.count();
    const broken: string[] = [];

    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute('src');
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;

      const url = src.startsWith('http') ? src : `${process.env.BASE_URL}${src}`;
      try {
        const response = await request.get(url, { timeout: 10000 });
        if (response.status() >= 400) {
          broken.push(`${url} → ${response.status()}`);
        }
      } catch {
        broken.push(`${url} → connection error`);
      }
    }

    expect(broken, `Broken image sources:\n${broken.join('\n')}`).toHaveLength(0);
  });

  test('no 404 pages in sitemap entries', async ({ request }) => {
    const sitemapRes = await request.get(`${process.env.BASE_URL}/sitemap.xml`);
    if (sitemapRes.status() !== 200) {
      test.skip(); return;
    }

    const xml = await sitemapRes.text();
    const urlMatches = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    const urls = urlMatches.map(m => m.replace(/<\/?loc>/g, '').trim());

    const broken: string[] = [];
    for (const url of urls.slice(0, 50)) { // cap at 50 to avoid timeout
      const res = await request.get(url, { timeout: 10000 });
      if (res.status() >= 400) {
        broken.push(`${url} → ${res.status()}`);
      }
    }

    expect(broken, `Broken sitemap URLs:\n${broken.join('\n')}`).toHaveLength(0);
  });
});
