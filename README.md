# WordPress QA Agent — Playwright Test Suite

Automated frontend QA suite for WordPress sites. Discovers pages automatically from the sitemap and runs tests across **15+ categories** including SEO, accessibility, performance, visual regression, security, and spelling.

---

## Quick Start

```bash
npm install
npx playwright install
cp .env.example .env
npm run test:live
npm run test:report
```

---

## What Gets Tested

### `header`
- [x] Logo visible in desktop header
- [x] Logo visible in mobile hamburger menu
- [x] Clicking logo navigates to home page from any page
- [x] Hamburger menu opens on mobile
- [x] Mobile menu logo navigates to home page
- [x] Active state (`current-menu-item`) shown on current page

### `footer`
- [x] Footer section present on all pages
- [x] Footer logo visible
- [x] Clicking footer logo navigates to home page from any page
- [x] Footer navigation links load correct pages
- [x] Copyright section present with year
- [x] Social media links present (Instagram, LinkedIn)
- [x] Social media links open in new tab (`target="_blank"`)
- [x] Web Lankan link opens in new tab
- [x] All external footer links have `rel="noopener noreferrer"`
- [x] **No spelling mistakes in footer text** (uses real dictionary)
- [x] Phone number format (+94 XX XXX XXXX)
- [x] Email address format validation

### `navigation`
- [x] Desktop header nav links navigate to correct pages
- [x] Mobile menu links navigate to correct pages
- [x] Banner menu links navigate to correct pages
- [x] All internal header links resolve without 4xx/5xx
- [x] External links on all pages open in new tab
- [x] Active state persists after navigating between pages

### `buttons`
- [x] CTA buttons visible on homepage
- [x] CTA buttons have valid href actions
- [x] CTA buttons are clickable and navigate correctly
- [x] CTA button text checked for common misspellings
- [x] Buttons are enabled (no `disabled`/`aria-disabled` attr)
- [x] Button text is non-empty
- [x] Upload field exists on contact page (read-only)
- [x] Upload trigger element is clickable
- [x] Footer contact button clickable on all pages
- [x] Buttons accept keyboard focus

### `responsive`
- [x] Viewport meta tag present (`width=device-width`)
- [x] No horizontal overflow at 375px viewport
- [x] No horizontal overflow at 768px viewport
- [x] No horizontal overflow at 1440px viewport
- [x] Navigation usable on mobile (hamburger or visible links)
- [x] Text font-size >= 12px on mobile
- [x] Images not wider than viewport on mobile

### `seo`
- [x] Title length 10–70 chars
- [x] Meta description 50–160 chars
- [x] Canonical URL is absolute
- [x] Open Graph tags present (og:title, og:description, og:image, og:url)
- [x] Exactly one H1 per page
- [x] All images have alt attributes
- [x] Robots meta does not contain `noindex` on homepage

### `performance`
- [x] Page load time within threshold
- [x] LCP element visible
- [x] No render-blocking resources
- [x] Page weight within limit
- [x] Lazy loading enabled
- [x] TTFB within threshold
- [x] No redirect chains

### `images`
- [x] Image format checks (WebP enforcement)
- [x] Image file size within limit
- [x] No PNG/JPEG in CSS backgrounds

### `accessibility` (axe-core)
- [x] Automated aXe audits on every page
- [x] WCAG 2.0 AA + best practice rules
- [x] Configurable impact threshold (critical/serious/moderate/minor)
- [x] Detailed violation reports with element selectors

### `console-errors`
- [x] JavaScript console error detection per page
- [x] Uncaught page error tracking
- [x] Plugin conflict / broken enqueue detection

### `spell-check`
- [x] Real dictionary-based spell checking (nspell + dictionary-en)
- [x] WordPress/CMS term skip list
- [x] Spell suggestions on misspellings
- [x] Double-space detection

### `visual-regression` (pixelmatch)
- [x] Pixel-perfect screenshot comparison
- [x] Multi-viewport (desktop + mobile)
- [x] Diff image generation
- [x] Configurable threshold
- [x] Baseline update with `UPDATE_SNAPSHOTS=true`

### `security`
- [x] Security headers check (HSTS, X-Frame-Options, etc.)
- [x] CSP unsafe-inline/unsafe-eval detection
- [x] WP REST API user data leak detection
- [x] Mixed content detection (HTTPS page loading HTTP resources)

---

## Environment

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://yoursite.com` | Target site (no trailing slash) |
| `ENVIRONMENT` | `live` | `live` = safe mode, excludes destructive tests |
| `FULL_MATRIX` | `false` | Set `true` to run all 5 browsers instead of Chrome only |
| `PAGES` | auto (sitemap) | Explicit page list overrides auto-discovery |
| `SKIP_PAGE_DISCOVERY` | `false` | Use pre-cached pages (CI optimization) |
| `CHECK_LOAD_TIME` | `false` | Fail tests on slow page loads |
| `LOAD_TIME_THRESHOLD_MS` | `5000` | Max page load time in ms |
| `LCP_LIMIT_MS` | `4000` | Max LCP on homepage in ms |
| `MAX_RENDER_BLOCKING` | `8` | Max render-blocking resources |
| `IMAGE_SIZE_LIMIT_KB` | `500` | Max image file size |
| `ACCESSIBILITY_IMPACT` | `critical` | Min impact level to fail on |
| `UPDATE_SNAPSHOTS` | `false` | Generate new visual regression baselines |
| `VISUAL_REGRESSION_THRESHOLD` | `0.05` | Max pixel diff ratio (5%) |
| `MAX_PAGES_TO_CHECK` | `20` | Cap on dynamically discovered pages |
| `MAX_FOCUS_CHECK` | `30` | Max elements to check for keyboard focus |
| `SLACK_WEBHOOK_URL` | — | Slack webhook for CI failure notifications |

---

## Commands

### General

| Command | Description |
|---|---|
| `npx playwright test` | All tests, Chrome only (default) |
| `FULL_MATRIX=true npx playwright test` | All tests, all 5 browsers |
| `ENVIRONMENT=live BASE_URL=https://yoursite.com npx playwright test` | Against live site |
| `npx playwright test --grep @smoke` | Smoke tests only |
| `npm run test:report` | Open HTML report |

### By Check Type

| Command | Description |
|---|---|
| `npm run test:a11y` | Accessibility audit (axe-core) |
| `npm run test:security` | Security headers & REST API |
| `npm run test:spell` | Dictionary-based spell check |
| `npm run test:console-errors` | JS console error detection |
| `npm run test:visual` | Visual regression (screenshot comparison) |
| `npm run test:visual:update` | Update visual regression baselines |
| `npm run test:seo` | SEO tags only |
| `npm run test:performance` | Performance only |
| `npm run test:images` | Image format & size |
| `npm run test:responsive` | Responsive design |

### Lighthouse

| Command | Description |
|---|---|
| `npm run lighthouse` | Lighthouse CI (perf, a11y, SEO budgets) |
| `npm run lighthouse:desktop` | Lighthouse desktop preset |

### By browser (full matrix)

| Command | Runs on |
|---|---|
| `npm run test:chrome` | Desktop + Mobile Chrome |
| `npm run test:firefox` | Desktop Firefox |
| `npm run test:safari` | Desktop + Mobile Safari |
| `npm run test:desktop` | All 3 desktop browsers |
| `npm run test:mobile` | Both mobile |

---

## Safety

- `ENVIRONMENT=live` excludes `forms.spec.ts`, `registration.spec.ts`, `login.spec.ts` via `testIgnore` in config
- `global-setup.ts` validates domain vs environment
  - `hostweblankan.in` → must be `staging`
  - Any other domain → must be `live`
  - Mismatch aborts the entire run with a clear error

---

## Page Discovery

Pages are not hardcoded. On every run, `global-setup.ts` fetches `BASE_URL/sitemap.xml`, extracts all `<loc>` paths, and caches them to `test-data/.page-cache.json`. Falls back to link crawling, then `['/']`.

---

## Project Structure

```
tests/                       # Playwright spec files (15 total)
  header.spec.ts             # Logo, hamburger, active state
  footer.spec.ts             # Logo, links, copyright, social, spelling
  navigation.spec.ts         # Link navigation, external link targets
  buttons.spec.ts            # CTA visibility, clickability, spelling
  responsive.spec.ts         # Viewport overflow, mobile nav, readable text
  seo.spec.ts                # Title, meta, OG tags, H1, alt, robots
  performance.spec.ts        # Load time, LCP, render-blocking
  images.spec.ts             # Format and size checks
  accessibility.spec.ts      # axe-core WCAG audits
  console-errors.spec.ts     # JS error detection per page
  spell-check.spec.ts        # Dictionary-based spelling across pages
  visual-regression.spec.ts  # Screenshot comparison with pixelmatch
  security.spec.ts           # Security headers, CSP, REST API
  forms.spec.ts              # (reserved, staging only)
  registration.spec.ts       # (reserved, staging only)
  login.spec.ts              # (reserved, staging only)
test-utils/
  config.ts                  # Centralized thresholds from env
  get-pages-to-check.ts      # Shared page discovery helpers
  get-pages.ts               # Sitemap-based page discovery
  selectors.ts               # All CSS selectors in one file
  check-links.ts             # Shared link-checking utility
  spell-check.ts             # Dictionary-based spell checker (nspell)
  reporter.ts                # Issue annotation helper
  ignored-paths.ts           # Paths to skip during testing
  fixtures.ts                # Custom test fixtures
test-data/
  .page-cache.json           # Auto-generated page list from sitemap
  screenshots/               # Visual regression baselines + diffs
    baseline/                # Reference screenshots
    diff/                    # Generated diff images
reports/                     # Auto-generated test reports
.github/workflows/
  qa.yml                     # CI: manual trigger + Slack notifications
global-setup.ts              # Env validation + sitemap cache
playwright.config.ts         # Chrome by default; FULL_MATRIX for all 5
lighthouserc.json            # Lighthouse CI budget configuration
AGENTS.md                    # QA agent instructions & conventions
.env.example                 # Environment template
```

## CI/CD

- **Manual trigger**: GitHub Actions tab → "QA" → "Run workflow"
- **Slack notification**: On failure (configure `SLACK_WEBHOOK_URL` secret)
- **Artifacts**: HTML report (14 days), test results (7 days), visual diffs (30 days)

## Visual Regression Workflow

1. First run generates baselines (test warns "no baseline found")
2. Run again to compare — passes if within threshold
3. After intentional visual changes:
   ```bash
   npm run test:visual:update   # regenerates baselines
   ```
4. Commit the updated baseline images to the repo

## Adding a Test

1. Create `tests/<name>.spec.ts`
2. Import shared utilities: `config`, `getPagesToCheck`, `selectors`
3. Tag read-only checks with `@smoke`
4. Run `npx playwright test tests/<name>.spec.ts` to verify
5. See `AGENTS.md` for detailed selector conventions
