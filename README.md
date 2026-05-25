# WP QA Automation

[![Release](https://img.shields.io/github/v/release/weblankan-rnd/wp-qa-automation?style=flat-square)](https://github.com/weblankan-rnd/wp-qa-automation/releases)
[![Node version](https://img.shields.io/badge/Node.js-%3E=20-3c873a?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

Automated frontend QA suite for WordPress sites. Scans pages discovered from your sitemap and runs **13 test categories** covering SEO, accessibility, performance, security, spelling, responsive design, and UI components.

Built with [Playwright](https://playwright.dev). Runs in CI via GitHub Actions.

[Getting started](#getting-started) • [What's tested](#whats-tested) • [Usage](#usage) • [Configuration](#configuration) • [Project structure](#project-structure) • [CI/CD](#cicd)

---

## Getting started

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Edit `.env` with your target URL, then run:

```bash
npm run test:live
npm run test:report
```

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- A WordPress site (or any HTML site) to test

---

## What's tested

All tests iterate over pages discovered from your sitemap or `PAGES` env var — no hardcoded paths.

### SEO
Title length, meta description, canonical URL, Open Graph tags, H1 count, image `alt` attributes, robots meta.

### Performance
Page load time, Largest Contentful Paint, render-blocking resource count.

### Accessibility
Automated [axe-core](https://www.deque.com/axe/) WCAG 2.0 AA audits with configurable impact threshold.

### Security
HTTP security headers (HSTS, CSP, X-Frame-Options), WordPress REST API user enumeration, mixed content detection.

### Spelling
Dictionary-based checking with [nspell](https://github.com/wooorm/nspell) + [dictionary-en](https://github.com/wooorm/dictionaries) across all visible body text.

### Console errors
JavaScript error detection and uncaught page errors.

### Responsive design
Viewport meta tag, horizontal overflow at 375/768/1440px, mobile navigation, text readability, image sizing.

### Images
WebP format enforcement, CSS background image formats, file size limits.

### Header
Logo visibility, home navigation from logo clicks, hamburger menu, mobile menu, active menu state.

### Footer
Logo and copyright presence, navigation links, social media links (`target="_blank"`/`rel="noopener"`), phone/email format.

### Navigation
Desktop, mobile, and banner menu link correctness, internal link status codes, external link targets.

### Buttons
CTA visibility and navigation, button state (disabled/aria-disabled), empty text detection, keyboard focus, file upload field.

---

## Usage

### Run all tests

```bash
npm test                            # Chrome only (default)
FULL_MATRIX=true npm test           # All 5 browsers
ENVIRONMENT=live npm test           # Live-safe mode (excludes destructive tests)
```

### By category

| Command | Spec |
|---------|------|
| `npm run test:a11y` | Accessibility (axe-core) |
| `npm run test:security` | Security headers, CSP, REST API |
| `npm run test:spell` | Dictionary spelling check |
| `npm run test:console-errors` | JS error detection |
| `npm run test:seo` | SEO tags |
| `npm run test:performance` | Page speed, LCP, render blocking |
| `npm run test:images` | Image format & size |
| `npm run test:responsive` | Responsive design |
| `npm run test:smoke` | Core sanity checks (`@smoke` tag) |

### By browser

| Command | Runs on |
|---------|---------|
| `npm run test:chrome` | Desktop + Mobile Chrome |
| `npm run test:firefox` | Desktop Firefox |
| `npm run test:safari` | Desktop + Mobile Safari |
| `npm run test:desktop` | All 3 desktop browsers |
| `npm run test:mobile` | Both mobile viewports |

### Helpers

```bash
npm run test:headed      # Visible browser (debugging)
npm run test:ui          # Playwright UI mode
npm run test:report      # Open HTML report
```

---

## Configuration

All thresholds are controlled through environment variables — see `.env.example` for the full list.

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://www.weblankan.com` | Target site |
| `ENVIRONMENT` | `live` | `live` = safe mode |
| `PAGES` | auto (sitemap) | Explicit page list (one per line) |
| `FULL_MATRIX` | `false` | Run all 5 browser engines |
| `LOAD_TIME_THRESHOLD_MS` | `5000` | Max page load time |
| `LCP_LIMIT_MS` | `4000` | Max Largest Contentful Paint |
| `MAX_RENDER_BLOCKING` | `8` | Max render-blocking resources |
| `IMAGE_SIZE_LIMIT_KB` | `500` | Max image file size |
| `ACCESSIBILITY_IMPACT` | `critical` | Min axe-core impact to fail on |
| `MAX_PAGES_TO_CHECK` | `20` | Cap on discovered pages |

> [!TIP]
> Set `PAGES` to only the pages you care about for faster runs. Leave it empty to auto-discover via sitemap with link-crawling fallback.

---

## Project structure

```
tests/                        # 13 Playwright spec files
  accessibility.spec.ts       #   axe-core WCAG audits
  buttons.spec.ts             #   CTA buttons, states, focus
  console-errors.spec.ts      #   JS console error detection
  footer.spec.ts              #   Logo, links, copyright, social
  header.spec.ts              #   Logo, hamburger, active state
  images.spec.ts              #   WebP format, file size
  navigation.spec.ts          #   Link navigation, external targets
  performance.spec.ts         #   Load time, LCP, render blocking
  responsive.spec.ts          #   Viewport overflow, mobile UX
  security.spec.ts            #   Headers, CSP, REST API leaks
  seo.spec.ts                 #   Title, meta, OG, H1, alt
  spell-check.spec.ts         #   Dictionary spelling check

test-utils/                   # Shared utilities
  config.ts                   #   Centralized thresholds from env
  get-pages-to-check.ts       #   Page list helpers
  get-pages.ts                #   Sitemap discovery + crawling
  selectors.ts                #   All CSS selectors (one file)
  spell-check.ts              #   nspell-based dictionary checker
  check-links.ts              #   Link validation utility
  reporter.ts                 #   Test annotation helper
  ignored-paths.ts            #   Skip list
  types.d.ts                  #   Type declarations

test-data/                    # Auto-generated during run
  .page-cache.json            #   Page list from sitemap

playwright.config.ts          # Playwright configuration
global-setup.ts               # Env validation + page discovery
lighthouserc.json             # Lighthouse CI budgets (optional)
AGENTS.md                     # Dev conventions & selector guide
```

---

## CI/CD

Triggered manually from GitHub Actions → **QA** → **Run workflow**.

| Input | Description |
|-------|-------------|
| `base_url` | Target URL (default: `https://www.weblankan.com`) |
| `pages` | Comma-separated paths (default: `/`) |
| `full_matrix` | Run all 5 browser engines |
| `accessibility_impact` | Min impact level to fail on |

Artifacts: HTML report (14 days), test results with traces/videos (7 days).

---

## Adapting to a different WordPress theme

All CSS selectors are centralized in `test-utils/selectors.ts`. When changing themes:

1. Run the suite once to see which selectors fail
2. Update `test-utils/selectors.ts` with your theme's actual CSS classes
3. Re-run

For the most stable long-term approach, add `data-testid` attributes to your theme templates and reference those in `selectors.ts` — this eliminates dependency on CSS class names entirely.

---

## Adding a test

1. Create `tests/<name>.spec.ts`
2. Import from shared utilities:
   ```ts
   import { config } from '../test-utils/config';
   import { getPagesToCheck } from '../test-utils/get-pages-to-check';
   import { HEADER } from '../test-utils/selectors';
   ```
3. Tag read-only checks with `@smoke`
4. Run `npx playwright test tests/<name>.spec.ts` to verify

See `AGENTS.md` for detailed conventions.
