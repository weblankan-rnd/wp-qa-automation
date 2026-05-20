# WordPress QA Agent — Playwright Test Suite

Automated frontend QA suite for WordPress sites. Discovers pages automatically from the sitemap and runs tests on Chrome by default. Set `FULL_MATRIX=true` to run across all 5 browsers (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari).

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
- [x] No spelling mistakes in footer text
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

- [x] Image format checks
- [x] Image file size within limit

---

## Environment

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://www.weblankan.lk` | Target site (no trailing slash) |
| `ENVIRONMENT` | `live` | `live` = safe mode, excludes destructive tests |
| `FULL_MATRIX` | `false` | Set `true` to run all 5 browsers instead of Chrome only |
| `WP_LOGIN_URL` | `/wp-login.php` | Login page path |
| `CHECK_LOAD_TIME` | `false` | Fail tests on slow page loads |
| `LOAD_TIME_THRESHOLD_MS` | `3000` | Max load time in ms |
| `IMAGE_SIZE_LIMIT_KB` | `600` | Max image file size |
| `FAIL_ON_DEPRECATED` | `false` | Fail on deprecated API warnings |
| `MAX_FOCUS_CHECK` | `30` | Max elements to check for keyboard focus |

---

## Commands

### General

| Command | Description |
|---|---|
| `npx playwright test` | All tests, Chrome only (default) |
| `FULL_MATRIX=true npx playwright test` | All tests, all 5 browsers |
| `ENVIRONMENT=live BASE_URL=https://yoursite.com npx playwright test` | Against live site |
| `npx playwright test --grep @smoke` | Smoke tests only |
| `npm run test:live` | All tests (safe), live env |
| `npm run test:headed` | Visible browser |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:report` | Open HTML report |

### By spec

| Command | Spec file |
|---------|-----------|
| `npx playwright test tests/images.spec.ts` | Image format & size |
| `npx playwright test tests/seo.spec.ts` | SEO tags |
| `npx playwright test tests/responsive.spec.ts` | Responsive design |
| `npx playwright test tests/performance.spec.ts` | Performance |

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

- `ENVIRONMENT=live` excludes `forms.spec.ts`, `registration.spec.ts`, `login.spec.ts` via `testIgnore` in config (these files are not yet created but are reserved for staging-only use)
- `global-setup.ts` validates domain vs environment:
  - `hostweblankan.in` → must be `staging`
  - Any other domain → must be `live`
  - Mismatch aborts the entire run with a clear error

---

## Page Discovery

Pages are not hardcoded. On every run, `global-setup.ts` fetches `BASE_URL/sitemap.xml`, extracts all `<loc>` paths, and caches them to `test-data/.page-cache.json`. Tests for SEO, broken links, console errors, accessibility, and images generate one test per discovered page. Falls back to `['/']` if sitemap is unavailable.

---

## Project Structure

```
tests/                    # Playwright spec files (8 total)
  header.spec.ts          # Logo, hamburger, active state
  footer.spec.ts          # Logo, links, copyright, social media, spelling
  navigation.spec.ts      # Link navigation, external link targets
  buttons.spec.ts         # CTA visibility, clickability, spelling
  responsive.spec.ts      # Viewport overflow, mobile nav, text readability
  seo.spec.ts             # Title, meta, OG tags, H1, alt, robots
  performance.spec.ts     # Load time, LCP, render-blocking
  images.spec.ts          # Format and size checks
test-utils/
  check-links.ts          # Shared link-checking utility
  get-pages.ts            # Sitemap-based page discovery
test-data/
  .page-cache.json        # Auto-generated page list from sitemap
reports/                  # Auto-generated test reports
.github/workflows/
  qa.yml                  # Manual-trigger GitHub Actions
global-setup.ts           # Env validation + sitemap cache
playwright.config.ts      # Chrome by default; FULL_MATRIX=true for all 5 browsers
AGENTS.md                 # QA agent instructions
.env.example              # Environment template
```

## CI/CD

Triggered manually from GitHub Actions tab → "QA" → "Run workflow". Runs `npm run test:live` against `https://www.weblankan.lk` with `ENVIRONMENT=live`. Report artifacts uploaded on completion.

## Adding a Test

1. Create `tests/<name>.spec.ts`
2. Follow selector priority in `AGENTS.md`
3. Tag read-only checks with `@smoke`
4. Run `npx playwright test tests/<name>.spec.ts` to verify
