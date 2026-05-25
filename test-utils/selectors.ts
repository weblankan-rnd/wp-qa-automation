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
  NAV: 'header .navigation, header[role="banner"]',

  /** Primary logo link */
  LOGO: 'header [data-testid="header-logo"], header .navbar-brand',

  /** Logo <img> inside header */
  LOGO_IMG: 'header [data-testid="header-logo"] img, header .navbar-brand img',

  /** Logo <img> with main-logo class */
  LOGO_IMG_MAIN: 'header .navbar-brand img.main-logo',

  /** Desktop navigation links (left + right menus) */
  NAV_LINKS:
    'header .navigation .left-menu ul li a, header .navigation .right-menu ul li a, header [data-testid*="nav-link"]',

  /** Hamburger menu button (mobile) */
  HAMBURGER: '[data-testid="hamburger"], .menu-ham, [class*="hamburger"]',

  /** Mobile menu container */
  MOBILE_MENU: '[data-testid="mobile-menu"], .mobile-menu, [class*="mobile-menu"]',

  /** Mobile menu link items */
  MOBILE_LINKS:
    '[data-testid="mobile-menu"] a, .mobile-menu a, .hamburger-menu a',

  /** Current/active menu item */
  ACTIVE_ITEM:
    'header .current-menu-item, header .current_page_item, [data-testid*="active-nav"]',

  /** Active link inside the active item */
  ACTIVE_LINK: 'header .current-menu-item a, header .current_page_item a',

  /** Mobile active item */
  MOBILE_ACTIVE:
    '.mobile-menu .current-menu-item, .mobile-menu .current_page_item',
} as const;

export const FOOTER = {
  /** Footer element */
  CONTAINER: 'footer[data-testid="footer"], footer',

  /** Footer logo link */
  LOGO: 'footer [data-testid="footer-logo"], footer .footerlogo',

  /** Footer logo image */
  LOGO_IMG: 'footer [data-testid="footer-logo"] img, footer .footerlogo img',

  /** Footer menu items */
  MENU_LINKS: 'footer [data-testid="footer-menu"] a, footer .footer-menu ul li a',

  /** Copyright section */
  COPYRIGHT: 'footer [data-testid="copyright"], footer .copyright',

  /** Social links container */
  SOCIAL_LINKS: 'footer [data-testid="social-links"] a, footer .social-links a',

  /** Web Lankan link */
  WEB_LANKAN_LINK: 'footer a[href*="weblankan.com"], footer a[href*="weblankan"]',

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

  /** All header-based links (desktop + banner + mobile) */
  HEADER_LINKS:
    'header a, .menu-wrap a, .mobile-menu a, [data-testid*="nav-link"]',

  /** All external (http) links on page */
  EXTERNAL_LINKS: 'a[href^="http"]',
} as const;

export const BUTTONS = {
  /** CTA buttons */
  CTA: '[data-testid*="cta"], .button-wrap a.hvr-shutter-out-horizontal, .button-wrap a[class*="button"]',

  /** All interactive button elements */
  ALL:
    'a.hvr-shutter-out-horizontal, button, a[role="button"], [data-testid*="button"]',

  /** File upload input */
  FILE_UPLOAD: 'input[type="file"]',

  /** Upload-related elements */
  UPLOAD_TRIGGER:
    'input[type="file"], [class*="upload"], [class*="file"], label[for*="file"], label[for*="upload"]',

  /** Footer contact button */
  FOOTER_CONTACT: 'footer a[href*="contact"]',
} as const;

export const RESPONSIVE = {
  /** Elements that indicate a hamburger/mobile menu */
  HAMBURGER:
    '[class*="hamburger"], [class*="menu-toggle"], [class*="nav-toggle"], ' +
    '[aria-label*="menu" i], [aria-label*="navigation" i], ' +
    'button[class*="menu"], button[class*="toggle"]',
} as const;
