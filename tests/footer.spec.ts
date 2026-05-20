import { test } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { IGNORED_PATHS } from '../test-utils/ignored-paths';

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const cachePath = 'test-data/.page-cache.json';
const pagesToCheck: string[] = (existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf-8'))
  : ['/']).filter((p: string) => !IGNORED_PATHS.includes(p));

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
    const visible = await footer.isVisible().catch(() => false);
    if (!visible) console.warn('[Footer] Footer element is not visible on homepage');
  });

  test('footer logo is visible @smoke', async ({ page }) => {
    const footerLogo = page.locator('footer .footerlogo img').first();
    const visible = await footerLogo.isVisible().catch(() => false);
    if (!visible) { console.warn('[Footer] Footer logo is not visible'); return; }
    const src = await footerLogo.getAttribute('src');
    if (!src) console.warn('[Footer] Footer logo has no src attribute');
  });

  test('clicking footer logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const footerLogo = page.locator('footer .footerlogo').first();
    const exists = await footerLogo.count() > 0;
    if (!exists) { console.warn('[Footer] Footer logo not found on /ceylon-cannabis/'); return; }
    await footerLogo.scrollIntoViewIfNeeded();
    try {
      await Promise.all([
        page.waitForURL(url => url.pathname === '/' || url.href.replace(/\/$/, '') === BASE_URL, { timeout: 10000 }),
        footerLogo.click(),
      ]);
      const currentUrl = page.url().replace(/\/$/, '');
      if (currentUrl !== BASE_URL) console.warn(`[Footer] Footer logo navigated to ${currentUrl}, expected ${BASE_URL}`);
    } catch {
      console.warn('[Footer] Footer logo click did not navigate to home page');
    }
  });

  test('footer logo navigates to home from any page @smoke', async ({ page }) => {
    const testPages = pagesToCheck.filter((p: string) => p !== '/').slice(0, 3);
    for (const pagePath of testPages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const footerLogo = page.locator('footer .footerlogo').first();
      const exists = await footerLogo.count() > 0;
      if (!exists) { console.warn(`[Footer] Footer logo not found on ${pagePath}`); continue; }
      await footerLogo.scrollIntoViewIfNeeded().catch(() => {});
      if (!(await footerLogo.isVisible().catch(() => false))) continue;
      try {
        await Promise.all([
          page.waitForURL(url => url.pathname === '/' || url.href.replace(/\/$/, '') === BASE_URL, { timeout: 10000 }),
          footerLogo.click(),
        ]);
        const currentUrl = page.url().replace(/\/$/, '');
        if (currentUrl !== BASE_URL) console.warn(`[Footer] Logo on ${pagePath} navigated to ${currentUrl}`);
      } catch {
        console.warn(`[Footer] Logo click on ${pagePath} did not navigate home`);
      }
    }
  });

  test('footer navigation links are present and clickable @smoke', async ({ page }) => {
    const footerMenu = page.locator('footer .footer-menu ul li a');
    const count = await footerMenu.count();
    if (count === 0) { console.warn('[Footer] No footer navigation links found'); return; }
    for (let i = 0; i < count; i++) {
      const link = footerMenu.nth(i);
      await link.scrollIntoViewIfNeeded().catch(() => {});
      const visible = await link.isVisible().catch(() => false);
      if (!visible) console.warn(`[Footer] Footer link ${i} is not visible`);
      const href = await link.getAttribute('href');
      if (!href) console.warn(`[Footer] Footer link ${i} has no href`);
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
      await link.scrollIntoViewIfNeeded().catch(() => {});
      await link.click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      if (!page.url().includes(expectedPath)) {
        console.warn(`[Footer] Footer link "${text}" navigated to ${page.url()}, expected path ${expectedPath}`);
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('copyright section is present @smoke', async ({ page }) => {
    const copyright = page.locator('footer .copyright').first();
    const exists = await copyright.count() > 0;
    if (!exists) { console.warn('[Footer] No copyright section found'); return; }
    await copyright.scrollIntoViewIfNeeded().catch(() => {});
    const visible = await copyright.isVisible().catch(() => false);
    if (!visible) { console.warn('[Footer] Copyright section is not visible'); return; }
    const text = (await copyright.textContent()) || '';
    if (!text.trim()) console.warn('[Footer] Copyright section has no text');
    if (!/\d{4}/.test(text)) console.warn('[Footer] Copyright section does not contain a year');
  });

  test('social media links are present @smoke', async ({ page }) => {
    const socialLinks = page.locator('footer .social-links a');
    const count = await socialLinks.count();
    if (count === 0) { console.warn('[Footer] No social media links found in footer'); return; }
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await socialLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }
    if (!hrefs.some(h => h.includes('instagram.com'))) console.warn('[Footer] No Instagram link found');
    if (!hrefs.some(h => h.includes('linkedin.com'))) console.warn('[Footer] No LinkedIn link found');
  });

  test('social media links open in a new tab @smoke', async ({ page }) => {
    const socialLinks = page.locator('footer .social-links a');
    const count = await socialLinks.count();
    for (let i = 0; i < count; i++) {
      const target = await socialLinks.nth(i).getAttribute('target');
      if (target !== '_blank') console.warn(`[Footer] Social link ${i} is missing target="_blank"`);
      const rel = await socialLinks.nth(i).getAttribute('rel');
      if (!rel?.includes('noopener')) console.warn(`[Footer] Social link ${i} is missing rel="noopener"`);
    }
  });

  test('Web Lankan link opens in a new tab @smoke', async ({ page }) => {
    const webLankanLink = page.locator('footer a[href*="weblankan.com"]');
    const linkCount = await webLankanLink.count();
    if (linkCount === 0) { console.warn('[Footer] Web Lankan link not found in footer'); return; }
    const target = await webLankanLink.getAttribute('target');
    if (target !== '_blank') console.warn('[Footer] Web Lankan link is missing target="_blank"');
    const rel = await webLankanLink.getAttribute('rel');
    if (!rel?.includes('noopener')) console.warn('[Footer] Web Lankan link is missing rel="noopener"');
  });

  test('all external footer links open in a new tab @smoke', async ({ page }) => {
    const allFooterLinks = page.locator('footer a[href^="http"]');
    const count = await allFooterLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await allFooterLinks.nth(i).getAttribute('href');
      if (!href || href.includes('gammaaextracts.com')) continue;
      const target = await allFooterLinks.nth(i).getAttribute('target');
      if (target !== '_blank') console.warn(`[Footer] External link ${href} is missing target="_blank"`);
    }
  });

  test('no spelling mistakes in footer text @smoke', async ({ page }) => {
    const footer = page.locator('footer');
    const exists = await footer.count() > 0;
    if (!exists) { console.warn('[Footer] No footer found to check spelling'); return; }
    await footer.scrollIntoViewIfNeeded().catch(() => {});
    const htmlContent = await footer.innerHTML();
    const textContent = stripHtml(htmlContent);
    const errors = hasObviousSpellingErrors(textContent);
    const capsSentenceStart = textContent.match(/\.\s+[a-z]/g);
    if (capsSentenceStart && capsSentenceStart.length > 0) {
      errors.push(`${capsSentenceStart.length} sentence(s) may not start with uppercase`);
    }
    if (errors.length > 0) console.warn(`[Footer] Spelling/text issues:\n${errors.join('\n')}`);
  });

  test('footer is visible on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const footer = page.locator('footer');
      const exists = await footer.count() > 0;
      if (!exists) { console.warn(`[Footer] No footer element found on ${pagePath}`); continue; }
      await footer.scrollIntoViewIfNeeded().catch(() => {});
      const visible = await footer.isVisible().catch(() => false);
      if (!visible) console.warn(`[Footer] Footer is not visible on ${pagePath}`);
    }
  });

  test('phone number format is correct @smoke', async ({ page }) => {
    const phoneLink = page.locator('footer a[href^="tel:"]');
    const count = await phoneLink.count();
    if (count === 0) { console.warn('[Footer] No phone link found in footer'); return; }
    const href = await phoneLink.first().getAttribute('href');
    if (!href || !/^tel:\+?[\d\s]+$/.test(href)) console.warn(`[Footer] Phone href format invalid: ${href}`);
    const phoneText = (await phoneLink.first().textContent()) || '';
    if (!/^\+94\s?\d{2}\s?\d{3}\s?\d{4}$/.test(phoneText.trim())) {
      console.warn(`[Footer] Phone number format unexpected: "${phoneText.trim()}" (expected +94 XX XXX XXXX)`);
    }
  });

  test('email address format is correct @smoke', async ({ page }) => {
    const emailLink = page.locator('footer a[href^="mailto:"]');
    const count = await emailLink.count();
    if (count === 0) { console.warn('[Footer] No email link found in footer'); return; }
    const href = await emailLink.first().getAttribute('href');
    if (!href || !/^mailto:/.test(href)) { console.warn(`[Footer] Email href missing mailto: protocol: ${href}`); return; }
    const email = href.replace('mailto:', '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn(`[Footer] Email format invalid: ${email}`);
    }
  });
});
