import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/'];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasObviousSpellingErrors(text: string): string[] {
  const errors: string[] = [];
  const commonTypos: { wrong: RegExp; fix: string }[] = [
    { wrong: /\b(recieve)\b/gi, fix: 'receive' },
    { wrong: /\b(adress)\b/gi, fix: 'address' },
    { wrong: /\b(accomodation)\b/gi, fix: 'accommodation' },
    { wrong: /\b(acheive)\b/gi, fix: 'achieve' },
    { wrong: /\b(buisness)\b/gi, fix: 'business' },
    { wrong: /\b(definately)\b/gi, fix: 'definitely' },
    { wrong: /\b(goverment)\b/gi, fix: 'government' },
    { wrong: /\b(occured)\b/gi, fix: 'occurred' },
    { wrong: /\b(pharamceutical)\b/gi, fix: 'pharmaceutical' },
    { wrong: /\b(seperate)\b/gi, fix: 'separate' },
    { wrong: /\b(untill)\b/gi, fix: 'until' },
    { wrong: /\b(wich)\b/gi, fix: 'which' },
    { wrong: /\b(comming)\b/gi, fix: 'coming' },
    { wrong: /\b(teh)\b/gi, fix: 'the' },
    { wrong: /\b(follwoing)\b/gi, fix: 'following' },
    { wrong: /\b(coloum)\b/gi, fix: 'column' },
    { wrong: /\b(artical)\b/gi, fix: 'article' },
    { wrong: /\b(carrer)\b/gi, fix: 'career' },
    { wrong: /\b(extention)\b/gi, fix: 'extension' },
    { wrong: /\b(infromation)\b/gi, fix: 'information' },
  ];
  for (const { wrong, fix } of commonTypos) {
    if (wrong.test(text)) {
      errors.push(`Possible typo: "${fix}" found as misspelling`);
    }
  }
  const doubleSpace = text.match(/\w\s{2,}\w/g);
  if (doubleSpace) {
    errors.push(`Double spaces found: ${doubleSpace.length} occurrence(s)`);
  }
  return errors;
}

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('footer section is present @smoke', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer, 'Footer element should be present').toBeVisible();
  });

  test('footer logo is visible @smoke', async ({ page }) => {
    const footerLogo = page.locator('footer .footerlogo img').first();
    await expect(footerLogo, 'Footer logo should be visible').toBeVisible();
    const src = await footerLogo.getAttribute('src');
    expect(src, 'Footer logo should have a valid src').toBeTruthy();
  });

  test('clicking footer logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const footerLogo = page.locator('footer .footerlogo').first();
    await footerLogo.scrollIntoViewIfNeeded();
    await expect(footerLogo, 'Footer logo link should be visible').toBeVisible();
    await footerLogo.click();
    await page.waitForLoadState('domcontentloaded');
    const currentUrl = page.url().replace(/\/$/, '');
    expect(currentUrl, 'Clicking footer logo should navigate to home').toBe(BASE_URL);
  });

  test('footer logo navigates to home from any page @smoke', async ({ page }) => {
    const testPages = pagesToCheck.filter((p: string) => p !== '/').slice(0, 3);
    for (const pagePath of testPages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const footerLogo = page.locator('footer .footerlogo').first();
      await footerLogo.scrollIntoViewIfNeeded();
      if (await footerLogo.isVisible().catch(() => false)) {
        await footerLogo.click();
        await page.waitForLoadState('domcontentloaded');
        const currentUrl = page.url().replace(/\/$/, '');
        expect(currentUrl, `Footer logo on ${pagePath} should navigate to home`).toBe(BASE_URL);
      }
    }
  });

  test('footer navigation links are present and clickable @smoke', async ({ page }) => {
    const footerMenu = page.locator('footer .footer-menu ul li a');
    const count = await footerMenu.count();
    expect(count, 'Footer should have navigation links').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = footerMenu.nth(i);
      await link.scrollIntoViewIfNeeded();
      await expect(link, `Footer link ${i} should be visible`).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href, `Footer link ${i} should have an href`).toBeTruthy();
    }
  });

  test('clicking footer links loads correct pages @smoke', async ({ page }) => {
    const footerMenu = page.locator('footer .footer-menu ul li a');
    const count = await footerMenu.count();
    for (let i = 0; i < count; i++) {
      const link = footerMenu.nth(i);
      const text = ((await link.textContent()) || '').trim();
      const href = await link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url(), `Footer link "${text}" should resolve`).toContain(
        new URL(href).pathname.replace(/\/$/, '') || '/'
      );
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('copyright section is present @smoke', async ({ page }) => {
    const copyright = page.locator('footer .copyright').first();
    await copyright.scrollIntoViewIfNeeded();
    await expect(copyright, 'Copyright section should be visible').toBeVisible();
    const text = (await copyright.textContent()) || '';
    expect(text.trim(), 'Copyright should have text content').toBeTruthy();
    expect(text, 'Copyright should contain the year').toMatch(/\d{4}/);
  });

  test('social media links are present @smoke', async ({ page }) => {
    const socialLinks = page.locator('footer .social-links a');
    const count = await socialLinks.count();
    expect(count, 'Footer should have social media links').toBeGreaterThan(0);

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await socialLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    const hasInstagram = hrefs.some(h => h.includes('instagram.com'));
    const hasLinkedIn = hrefs.some(h => h.includes('linkedin.com'));

    expect(hasInstagram, 'Footer should have an Instagram link').toBeTruthy();
    expect(hasLinkedIn, 'Footer should have a LinkedIn link').toBeTruthy();
  });

  test('social media links open in a new tab @smoke', async ({ page }) => {
    const socialLinks = page.locator('footer .social-links a');
    const count = await socialLinks.count();
    for (let i = 0; i < count; i++) {
      const target = await socialLinks.nth(i).getAttribute('target');
      expect(target, `Social link ${i} should have target="_blank"`).toBe('_blank');
      const rel = await socialLinks.nth(i).getAttribute('rel');
      expect(rel, `Social link ${i} should have rel containing noopener`).toContain('noopener');
    }
  });

  test('Web Lankan link opens in a new tab @smoke', async ({ page }) => {
    const webLankanLink = page.locator('footer a[href*="weblankan.com"]');
    const linkCount = await webLankanLink.count();
    if (linkCount === 0) {
      test.skip(true, 'Web Lankan link not found in footer');
      return;
    }
    const target = await webLankanLink.getAttribute('target');
    expect(target, 'Web Lankan link should have target="_blank"').toBe('_blank');
    const rel = await webLankanLink.getAttribute('rel');
    expect(rel, 'Web Lankan link should have rel with noopener').toContain('noopener');
  });

  test('all external footer links open in a new tab @smoke', async ({ page }) => {
    const allFooterLinks = page.locator('footer a[href^="http"]');
    const count = await allFooterLinks.count();
    const externalLinks = [];
    for (let i = 0; i < count; i++) {
      const href = await allFooterLinks.nth(i).getAttribute('href');
      if (href && !href.includes('gammaaextracts.com')) {
        externalLinks.push(i);
      }
    }
    for (const idx of externalLinks) {
      const target = await allFooterLinks.nth(idx).getAttribute('target');
      expect(
        target,
        `External footer link with index ${idx} should have target="_blank"`
      ).toBe('_blank');
    }
  });

  test('no spelling mistakes in footer text @smoke', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    const htmlContent = await footer.innerHTML();
    const textContent = stripHtml(htmlContent);

    const errors = hasObviousSpellingErrors(textContent);

    const capsSentenceStart = textContent.match(/\.\s+[a-z]/g);
    if (capsSentenceStart && capsSentenceStart.length > 0) {
      errors.push(`${capsSentenceStart.length} sentence(s) may not start with uppercase`);
    }

    expect(
      errors,
      `Spelling/text issues in footer:\n${errors.join('\n')}`
    ).toHaveLength(0);
  });

  test('footer is visible on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const footer = page.locator('footer');
      await footer.scrollIntoViewIfNeeded();
      await expect(
        footer,
        `Footer should be visible on ${pagePath}`
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('phone number format is correct @smoke', async ({ page }) => {
    const phoneLink = page.locator('footer a[href^="tel:"]');
    const count = await phoneLink.count();
    if (count === 0) {
      test.skip(true, 'No phone link found in footer');
      return;
    }
    const href = await phoneLink.first().getAttribute('href');
    expect(href, 'Phone number should be in tel: link').toMatch(/^tel:\+?[\d\s]+$/);

    const phoneText = (await phoneLink.first().textContent()) || '';
    expect(
      phoneText.trim(),
      'Phone number should follow Sri Lankan format (+94 XX XXX XXXX)'
    ).toMatch(/^\+94\s?\d{2}\s?\d{3}\s?\d{4}$/);
  });

  test('email address format is correct @smoke', async ({ page }) => {
    const emailLink = page.locator('footer a[href^="mailto:"]');
    const count = await emailLink.count();
    if (count === 0) {
      test.skip(true, 'No email link found in footer');
      return;
    }
    const href = await emailLink.first().getAttribute('href');
    expect(href, 'Email should use mailto: protocol').toMatch(/^mailto:/);
    const email = href!.replace('mailto:', '');
    expect(email, 'Email format should be valid').toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
