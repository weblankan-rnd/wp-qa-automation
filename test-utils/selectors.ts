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
  NAV: 'header#header, header.header, header[role="banner"]',

  /** Primary logo link */
  LOGO: 'header [data-testid="header-logo"], header .navbar-brand',

  /** Logo <img> inside header */
  LOGO_IMG: 'header [data-testid="header-logo"] img, header .navbar-brand img',

  /** Logo <img> with main-logo class (fallback) */
  LOGO_IMG_MAIN: 'header .navbar-brand img',

  /** Desktop navigation links (top-bar and main menu) */
  NAV_LINKS:
    'header nav.navbar ul.navbar-nav li a.nav-link, header [data-testid*="nav-link"]',

  /** Hamburger menu button (mobile) — prefers visible toggle buttons */
  HAMBURGER:
    '[data-testid="hamburger"], button.hamburger.btn-close, [class*="menu-toggle"]',

  /** Mobile menu container */
  MOBILE_MENU:
    '[data-testid="mobile-menu"], .menuhamburge.wrapper, .mobilemenuwraper, .mobile-menu-only, [class*="mobile-menu"]',

  /** Mobile menu link items */
  MOBILE_LINKS:
    '[data-testid="mobile-menu"] a, .menuhamburge a, .mobilemenuwraper a, .wrapper a, [class*="mobile-menu"] a',

  /** Current/active menu item */
  ACTIVE_ITEM:
    'header .current-menu-item, header .current_page_item, header .menu-item.current-menu-item',

  /** Active link inside the active item */
  ACTIVE_LINK:
    'header .current-menu-item a, header .current_page_item a, header .menu-item.current-menu-item a',

  /** Mobile active item */
  MOBILE_ACTIVE:
    '.menuhamburge .current-menu-item, .mobilemenuwraper .current-menu-item, .mobile-menu-only .current-menu-item, .mobile-menu .current-menu-item',
} as const;

export const FOOTER = {
  /** Footer element */
  CONTAINER: 'footer[data-testid="footer"], footer',

  /** Footer logo — many themes don't have an explicit footer logo */
  LOGO:
    'footer [data-testid="footer-logo"], footer .footer-logo, footer .footerlogo, footer img[alt*="logo" i], footer img[src*="logo"]',

  /** Footer logo image */
  LOGO_IMG:
    'footer [data-testid="footer-logo"] img, footer .footer-logo img, footer .footerlogo img, footer img[alt*="logo" i], footer img[src*="logo"], footer .goole-partners img',

  /** Footer navigation links (not all themes have a footer menu) */
  MENU_LINKS:
    'footer [data-testid="footer-menu"] a, footer .footer-menu a, footer nav a',

  /** Copyright section */
  COPYRIGHT:
    'footer [data-testid="copyright"], footer .copyright, footer [class*="copyright"], footer section:last-of-type',

  /** Social links container */
  SOCIAL_LINKS:
    'footer [data-testid="social-links"] a, footer .social-links a, footer [class*="social"] a, footer a[href*="facebook.com"], footer a[href*="linkedin.com"], footer a[href*="instagram.com"]',

  /** Web Lankan link — site may not self-link if already on weblankan.com */
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

  /** All header-based links (desktop + mobile) */
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
  /** Elements that indicate a hamburger/mobile menu or mobile nav is visible */
  HAMBURGER:
    'button.hamburger, .mobilemenuwraper, .mobile-menu-only, [class*="menu-toggle"], ' +
    '[aria-label*="menu" i], [aria-label*="navigation" i], ' +
    'button[class*="menu"], button[class*="toggle"], .right-wrap-navMenu',
} as const;
