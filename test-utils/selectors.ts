/**
 * Centralized selectors for the WordPress theme.
 *
 * When the theme changes, update selectors here instead of in every spec file.
 *
 * Order of precedence in each selector (most stable first):
 *   1. data-testid attributes (add to theme templates)
 *   2. ARIA / accessible labels
 *   3. Semantic class names (namespaced under header/footer/body)
 *   4. Generic presentational classes (most fragile)
 */

export const HEADER = {
  /** Header navigation bar container */
  NAV: 'header, header#header, header.header, header[role="banner"]',

  /** Primary logo link — Next.js: header a[href="/"], WP: .navbar-brand */
  LOGO:
    'header [data-testid="header-logo"], header .navbar-brand, header a[href="/"]',

  /** Logo <img> — Next.js: img[alt="Logo"], WP: .navbar-brand img */
  LOGO_IMG:
    'header [data-testid="header-logo"] img, header .navbar-brand img, header img[alt="Logo"], header img[alt*="logo" i]',

  /** Logo <img> main — same as LOGO_IMG, alias used by some tests */
  LOGO_IMG_MAIN:
    'header .navbar-brand img, header img[alt="Logo"], header img[alt*="logo" i]',

  /** Desktop navigation links */
  NAV_LINKS:
    'header nav a, header nav.navbar ul.navbar-nav li a.nav-link, header [data-testid*="nav-link"]',

  /** Hamburger menu button (mobile) */
  HAMBURGER:
    '[data-testid="hamburger"], button[class*="hamburger"], button[class*="menu-toggle"], button[class*="toggle"], [class*="menu-toggle"], header button[aria-label*="menu" i], header button[aria-label*="navigation" i]',

  /** Mobile menu container */
  MOBILE_MENU:
    '[data-testid="mobile-menu"], [class*="mobile-menu"], [class*="mobileMenu"], .menuhamburge, .mobilemenuwraper, .mobile-menu-only, header nav ul',

  /** Mobile menu link items */
  MOBILE_LINKS:
    '[data-testid="mobile-menu"] a, [class*="mobile-menu"] a, [class*="mobileMenu"] a, .menuhamburge a, .mobilemenuwraper a, header nav ul a',

  /** Current/active menu item — Next.js: a[class*="active"], WP: .current-menu-item */
  ACTIVE_ITEM:
    'header .current-menu-item, header .current_page_item, header [class*="active"]',

  /** Active link — Next.js: a[class*="menu-link-active"], WP: .current-menu-item a */
  ACTIVE_LINK:
    'header .current-menu-item a, header .current_page_item a, header a[class*="menu-link-active"], header a[class*="active"]',

  /** Mobile active item */
  MOBILE_ACTIVE:
    '.menuhamburge .current-menu-item, .mobilemenuwraper .current-menu-item, .mobile-menu-only .current-menu-item, [class*="mobile-menu"] .current-menu-item, [class*="mobile-menu"] a[class*="active"]',
} as const;

export const FOOTER = {
  /** Footer element */
  CONTAINER: 'footer[data-testid="footer"], footer',

  /** Footer logo link — Next.js: footer a[href="/"], WP: .footer-logo */
  LOGO:
    'footer [data-testid="footer-logo"], footer .footer-logo, footer .footerlogo, footer a[href="/"], footer img[alt*="logo" i], footer img[src*="logo"]',

  /** Footer logo image — Next.js: img[alt="Footer Logo"], WP: .footer-logo img */
  LOGO_IMG:
    'footer [data-testid="footer-logo"] img, footer .footer-logo img, footer .footerlogo img, footer img[alt="Footer Logo"], footer img[alt*="logo" i], footer img[src*="logo"], footer .goole-partners img',

  /** Footer navigation links — Next.js: footer nav a, WP: .footer-menu a */
  MENU_LINKS:
    'footer [data-testid="footer-menu"] a, footer .footer-menu a, footer nav a',

  /** Copyright section — Next.js: footer [class*="copyright"] or last div with year text, WP: .copyright */
  COPYRIGHT:
    'footer [data-testid="copyright"], footer .copyright, footer [class*="copyright"], footer [class*="bottom"], footer section:last-of-type, footer > div:last-child',

  /** Social links — href-based works for both Next.js and WP */
  SOCIAL_LINKS:
    'footer [data-testid="social-links"] a, footer .social-links a, footer [class*="social"] a, footer a[href*="facebook.com"], footer a[href*="linkedin.com"], footer a[href*="instagram.com"], footer a[href*="twitter.com"], footer a[href*="youtube.com"]',

  /** Web Lankan link */
  WEB_LANKAN_LINK:
    'footer a[href*="weblankan.com"], footer a[href*="weblankan"], footer img[src*="weblankan"]',

  /** Phone (tel:) link */
  PHONE_LINK: 'footer a[href^="tel:"]',

  /** Email (mailto:) link */
  EMAIL_LINK: 'footer a[href^="mailto:"]',

  /** External links (http) */
  EXTERNAL_LINKS: 'footer a[href^="http"]',
} as const;

export const NAVIGATION = {
  /** Banner / hero menu links */
  BANNER_LINKS: '.menu-wrap ul li a, [data-testid*="banner-link"]',

  /** All header-based links (desktop + mobile) — Next.js: header a, WP: .right-wrap-navMenu a */
  HEADER_LINKS:
    'header a, .right-wrap-navMenu a, .menuhamburge a, [data-testid*="nav-link"]',

  /** All external (http) links on page */
  EXTERNAL_LINKS: 'a[href^="http"]',
} as const;

export const BUTTONS = {
  /** CTA / call-to-action buttons */
  CTA:
    '[data-testid*="cta"], a[class*="btn"], a[class*="button"], .right-wrap-navMenu a[href*="calendly"]',

  /** All interactive button elements */
  ALL:
    'a[class*="btn"], a[class*="button"], button, a[role="button"], [data-testid*="button"], .right-wrap-navMenu a[href*="calendly"]',

  /** File upload input */
  FILE_UPLOAD: 'input[type="file"]',

  /** Upload-related elements */
  UPLOAD_TRIGGER:
    'input[type="file"], [class*="upload"], [class*="file"], label[for*="file"], label[for*="upload"]',

  /** Footer contact button */
  FOOTER_CONTACT: 'footer a[href*="contact"]',
} as const;

export const RESPONSIVE = {
  /** Elements that indicate a hamburger/mobile menu is present — Next.js: button[class*="hamburger"] or button[class*="toggle"], WP: .mobilemenuwraper */
  HAMBURGER:
    'button[class*="hamburger"], button[class*="menu-toggle"], button[class*="toggle"], ' +
    '.mobilemenuwraper, .mobile-menu-only, [class*="menu-toggle"], ' +
    '[aria-label*="menu" i], [aria-label*="navigation" i], ' +
    'button[class*="menu"], .right-wrap-navMenu',
} as const;
