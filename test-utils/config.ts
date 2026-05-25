/**
 * Centralized configuration for QA test thresholds.
 * All values read from environment variables with sensible defaults.
 */

export const config = {
  /** Target WordPress site (no trailing slash) */
  baseURL: process.env.BASE_URL || 'http://localhost',

  /** Live or staging — `live` excludes destructive tests */
  environment: process.env.ENVIRONMENT || 'live',

  /** Maximum page load time in milliseconds */
  loadTimeThresholdMs: Number(process.env.LOAD_TIME_THRESHOLD_MS) || 5000,

  /** Max LCP on homepage in milliseconds */
  lcpLimitMs: Number(process.env.LCP_LIMIT_MS) || 4000,

  /** Max render-blocking resources */
  maxRenderBlocking: Number(process.env.MAX_RENDER_BLOCKING) || 8,

  /** Max image file size in KB */
  imageSizeLimitKb: Number(process.env.IMAGE_SIZE_LIMIT_KB) || 500,

  /** Max pages to dynamically discover and test */
  maxPagesToCheck: Number(process.env.MAX_PAGES_TO_CHECK) || 20,

  /** Max elements to check for keyboard focus */
  maxFocusCheck: Number(process.env.MAX_FOCUS_CHECK) || 30,

  /** Whether to strictly fail on slow page loads */
  checkLoadTime: process.env.CHECK_LOAD_TIME === 'true',

  /** Minimum accessibility impact level to fail on: critical | serious | moderate | minor */
  accessibilityImpact: (process.env.ACCESSIBILITY_IMPACT || 'critical') as 'critical' | 'serious' | 'moderate' | 'minor',

  /** Viewport presets for responsive testing */
  viewports: {
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
  } as const,

  /** Retry count for flaky tests */
  retries: process.env.CI ? 1 : 0,
} as const;
