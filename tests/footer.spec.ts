import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';
import { getPagesToCheck } from '../test-utils/get-pages-to-check';
import { FOOTER } from '../test-utils/selectors';
import { checkSpelling, stripHtml } from '../test-utils/spell-check';

const pagesToCheck = getPagesToCheck();

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('footer section is present @smoke', async ({ page }) => {
    const visible = await page.locator(FOOTER.CONTAINER).isVisible().catch(() => false);
    if (!visible)
      expect.soft(false, '[Footer] Footer element is not visible on homepage').toBeTruthy();
  });

  test('footer logo is visible @smoke', async ({ page }) => {
    const footerLogo = page.locator(FOOTER.LOGO_IMG).first();
    const visible = await footerLogo.isVisible().catch(() => false);
    if (!visible) {
      expect.soft(false, '[Footer] Footer logo is not visible').toBeTruthy();
      return;
    }
    const src = await footerLogo.getAttribute('src');
    if (!src)
      expect.soft(false, '[Footer] Footer logo has no src attribute').toBeTruthy();
  });

  test('clicking footer logo navigates to home page @smoke', async ({ page }) => {
    await page.goto('/ceylon-cannabis/', { waitUntil: 'domcontentloaded' });
    const footerLogo = page.locator(FOOTER.LOGO).first();
    if ((await footerLogo.count()) === 0) {
      console.warn('[Footer] Footer logo not found on /ceylon-cannabis/');
      return;
    }
    await footerLogo.scrollIntoViewIfNeeded();
    try {
      await Promise.all([
        page.waitForURL(
          (url) =>
            url.pathname === '/' ||
            url.href.replace(/\/$/, '') === config.baseURL,
          { timeout: 10000 }
        ),
        footerLogo.click(),
      ]);
      const currentUrl = page.url().replace(/\/$/, '');
      if (currentUrl !== config.baseURL)
        expect
          .soft(
            false,
            `[Footer] Footer logo navigated to "${currentUrl}", expected "${config.baseURL}"`
          )
          .toBeTruthy();
    } catch {
      expect
        .soft(false, '[Footer] Footer logo click did not navigate to home page')
        .toBeTruthy();
    }
  });

  test('footer logo navigates to home from any page @smoke', async ({ page }) => {
    const testPages = pagesToCheck.filter((p: string) => p !== '/').slice(0, 3);
    for (const pagePath of testPages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const footerLogo = page.locator(FOOTER.LOGO).first();
      if ((await footerLogo.count()) === 0) {
        console.warn(`[Footer] Footer logo not found on ${pagePath}`);
        continue;
      }
      await footerLogo.scrollIntoViewIfNeeded().catch(() => {});
      if (!(await footerLogo.isVisible().catch(() => false))) continue;
      try {
        await Promise.all([
          page.waitForURL(
            (url) =>
              url.pathname === '/' ||
              url.href.replace(/\/$/, '') === config.baseURL,
            { timeout: 10000 }
          ),
          footerLogo.click(),
        ]);
        const currentUrl = page.url().replace(/\/$/, '');
        if (currentUrl !== config.baseURL)
          expect
            .soft(
              false,
              `[Footer] Logo on ${pagePath} navigated to "${currentUrl}", expected "${config.baseURL}"`
            )
            .toBeTruthy();
      } catch {
        expect
          .soft(
            false,
            `[Footer] Footer logo click on ${pagePath} did not navigate to home`
          )
          .toBeTruthy();
      }
    }
  });

  test('footer navigation links are present and clickable @smoke', async ({ page }) => {
    const footerMenu = page.locator(FOOTER.MENU_LINKS);
    const count = await footerMenu.count();
    if (count === 0) {
      expect.soft(false, '[Footer] No footer navigation links found').toBeTruthy();
      return;
    }
    for (let i = 0; i < count; i++) {
      const link = footerMenu.nth(i);
      await link.scrollIntoViewIfNeeded().catch(() => {});
      const visible = await link.isVisible().catch(() => false);
      if (!visible)
        expect.soft(false, `[Footer] Footer nav link ${i} is not visible`).toBeTruthy();
      const href = await link.getAttribute('href');
      if (!href)
        expect.soft(false, `[Footer] Footer nav link ${i} has no href`).toBeTruthy();
    }
  });

  test('clicking footer links loads correct pages @smoke', async ({ page }) => {
    const footerMenu = page.locator(FOOTER.MENU_LINKS);
    const count = await footerMenu.count();
    for (let i = 0; i < count; i++) {
      const text = ((await footerMenu.nth(i).textContent()) || '').trim();
      const href = await footerMenu.nth(i).getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      await footerMenu.nth(i).scrollIntoViewIfNeeded().catch(() => {});
      await footerMenu.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      const expectedPath = new URL(href).pathname.replace(/\/$/, '') || '/';
      if (!page.url().includes(expectedPath)) {
        expect
          .soft(
            false,
            `[Footer] Footer link "${text}" navigated to "${page.url()}", expected path "${expectedPath}"`
          )
          .toBeTruthy();
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    }
  });

  test('copyright section is present @smoke', async ({ page }) => {
    const copyright = page.locator(FOOTER.COPYRIGHT).first();
    if ((await copyright.count()) === 0) {
      expect.soft(false, '[Footer] No copyright section found').toBeTruthy();
      return;
    }
    await copyright.scrollIntoViewIfNeeded().catch(() => {});
    const visible = await copyright.isVisible().catch(() => false);
    if (!visible) {
      expect.soft(false, '[Footer] Copyright section is not visible').toBeTruthy();
      return;
    }
    const text = (await copyright.textContent()) || '';
    if (!text.trim())
      expect.soft(false, '[Footer] Copyright section has no text content').toBeTruthy();
    if (!/\d{4}/.test(text))
      expect.soft(false, '[Footer] Copyright section does not contain a year').toBeTruthy();
  });

  test('social media links are present @smoke', async ({ page }) => {
    const socialLinks = page.locator(FOOTER.SOCIAL_LINKS);
    const count = await socialLinks.count();
    if (count === 0) {
      expect.soft(false, '[Footer] No social media links found in footer').toBeTruthy();
      return;
    }
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await socialLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }
    if (!hrefs.some((h) => h.includes('instagram.com')))
      expect.soft(false, '[Footer] No Instagram link found in footer').toBeTruthy();
    if (!hrefs.some((h) => h.includes('linkedin.com')))
      expect.soft(false, '[Footer] No LinkedIn link found in footer').toBeTruthy();
  });

  test('social media links open in a new tab @smoke', async ({ page }) => {
    const socialLinks = page.locator(FOOTER.SOCIAL_LINKS);
    const count = await socialLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await socialLinks.nth(i).getAttribute('href');
      const target = await socialLinks.nth(i).getAttribute('target');
      if (target !== '_blank')
        expect
          .soft(false, `[Footer] Social link "${href}" is missing target="_blank"`)
          .toBeTruthy();
      const rel = await socialLinks.nth(i).getAttribute('rel');
      if (!rel?.includes('noopener'))
        expect
          .soft(false, `[Footer] Social link "${href}" is missing rel="noopener"`)
          .toBeTruthy();
    }
  });

  test('Web Lankan link opens in a new tab @smoke', async ({ page }) => {
    const webLankanLink = page.locator(FOOTER.WEB_LANKAN_LINK);
    if ((await webLankanLink.count()) === 0) {
      console.warn('[Footer] Web Lankan link not found in footer');
      return;
    }
    const target = await webLankanLink.getAttribute('target');
    if (target !== '_blank')
      expect
        .soft(false, '[Footer] Web Lankan link is missing target="_blank"')
        .toBeTruthy();
    const rel = await webLankanLink.getAttribute('rel');
    if (!rel?.includes('noopener'))
      expect
        .soft(false, '[Footer] Web Lankan link is missing rel="noopener"')
        .toBeTruthy();
  });

  test('all external footer links open in a new tab @smoke', async ({ page }) => {
    const allFooterLinks = page.locator(FOOTER.EXTERNAL_LINKS);
    const count = await allFooterLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await allFooterLinks.nth(i).getAttribute('href');
      if (!href || href.includes('gammaaextracts.com')) continue;
      const target = await allFooterLinks.nth(i).getAttribute('target');
      if (target !== '_blank')
        expect
          .soft(
            false,
            `[Footer] External link "${href}" is missing target="_blank"`
          )
          .toBeTruthy();
    }
  });

  test('no spelling mistakes in footer text @smoke', async ({ page }) => {
    const footer = page.locator(FOOTER.CONTAINER);
    if ((await footer.count()) === 0) {
      console.warn('[Footer] No footer found to check spelling');
      return;
    }
    await footer.scrollIntoViewIfNeeded().catch(() => {});
    const htmlContent = await footer.innerHTML();
    const textContent = stripHtml(htmlContent);
    const errors = await checkSpelling(textContent);
    const capsSentenceStart = textContent.match(/\.\s+[a-z]/g);
    if (capsSentenceStart?.length)
      errors.push(`${capsSentenceStart.length} sentence(s) may not start with uppercase`);
    if (errors.length > 0) {
      expect
        .soft(
          false,
          `[Footer] Spelling/text issues in footer:\n${errors.map((e) => `  - ${e}`).join('\n')}`
        )
        .toBeTruthy();
    }
  });

  test('footer is visible on all pages @smoke', async ({ page }) => {
    for (const pagePath of pagesToCheck.slice(0, 5)) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const footer = page.locator(FOOTER.CONTAINER);
      if ((await footer.count()) === 0) {
        expect.soft(false, `[Footer] No footer element on ${pagePath}`).toBeTruthy();
        continue;
      }
      await footer.scrollIntoViewIfNeeded().catch(() => {});
      const visible = await footer.isVisible().catch(() => false);
      if (!visible)
        expect.soft(false, `[Footer] Footer is not visible on ${pagePath}`).toBeTruthy();
    }
  });

  test('phone number format is correct @smoke', async ({ page }) => {
    const phoneLink = page.locator(FOOTER.PHONE_LINK);
    if ((await phoneLink.count()) === 0) {
      console.warn('[Footer] No phone link found in footer');
      return;
    }
    const href = await phoneLink.first().getAttribute('href');
    if (!href || !/^tel:\+?[\d\s]+$/.test(href))
      expect
        .soft(false, `[Footer] Phone href format invalid: "${href}"`)
        .toBeTruthy();
    const phoneText = (await phoneLink.first().textContent()) || '';
    if (!/^\+94\s?\d{2}\s?\d{3}\s?\d{4}$/.test(phoneText.trim())) {
      expect
        .soft(
          false,
          `[Footer] Phone number format invalid: "${phoneText.trim()}" (expected: +94 XX XXX XXXX)`
        )
        .toBeTruthy();
    }
  });

  test('email address format is correct @smoke', async ({ page }) => {
    const emailLink = page.locator(FOOTER.EMAIL_LINK);
    if ((await emailLink.count()) === 0) {
      console.warn('[Footer] No email link found in footer');
      return;
    }
    const href = await emailLink.first().getAttribute('href');
    if (!href || !/^mailto:/.test(href)) {
      expect
        .soft(
          false,
          `[Footer] Email href missing mailto: protocol: "${href}"`
        )
        .toBeTruthy();
      return;
    }
    const email = href.replace('mailto:', '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      expect
        .soft(false, `[Footer] Email format invalid: "${email}"`)
        .toBeTruthy();
    }
  });
});
