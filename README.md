# WordPress QA Agent — Playwright Test Suite

Automated frontend QA suite for WordPress sites. Discovers pages automatically from the sitemap and runs tests across 5 browser projects (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari).

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

| Spec | What it checks |
|------|----------------|
| `header` | Logo visible in desktop header and mobile hamburger, clicking logo navigates to home from any page, hamburger menu opens on mobile, active state (`current-menu-item`) shown on current page |
| `footer` | Footer visible on all pages, footer logo present and navigates to home, footer nav links load correct pages, copyright section with year, social media links (Instagram, LinkedIn) present and open in new tab, Web Lankan link opens in new tab, all external footer links have `target="_blank"`, no spelling mistakes in footer text, phone number format (+94 XX XXX XXXX), email format validation |
| `navigation` | Desktop header nav links navigate to correct pages, mobile menu links navigate correctly, banner menu links navigate correctly, all internal header links resolve without 4xx/5xx, external links on all pages have `target="_blank"`, active state persists after navigating between pages |
| `buttons` | CTA buttons visible and clickable, button hrefs are valid URLs, buttons are enabled (no disabled/aria-disabled attr), button text is non-empty and checked for common misspellings, upload field exists on contact page (read-only visibility check), footer contact button clickable on all pages |
| `responsive` | Viewport meta tag present (width=device-width), no horizontal overflow at 375px/768px/1440px viewports, navigation usable on mobile (hamburger or visible links), text font-size ≥ 12px on mobile, images not wider than viewport on mobile |
| `seo` | Title length 10–70 chars, meta description 50–160 chars, canonical URL is absolute, Open Graph tags (og:title, og:description, og:image, og:url), exactly one H1 per page, all images have alt attributes, robots meta does not contain noindex on homepage |
| `broken-links` | All `<a href>` URLs on every page return < 400 status (HEAD + GET fallback), batched with 8s timeout per link |
| `performance` | Page load time within threshold, LCP element visible, no render-blocking resources, page weight within limit, lazy loading, TTFB threshold, no redirect chains |
| `images` | All `<img>` src checks for format and size limits |

---

## Environment

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://www.weblankan.lk` | Target site (no trailing slash) |
| `ENVIRONMENT` | `live` | `live` = safe mode, excludes destructive tests |
| `WP_LOGIN_URL` | `/wp-login.php` | Login page path |
| `CHECK_LOAD_TIME` | `false` | Fail tests on slow page loads |
| `LOAD_TIME_THRESHOLD_MS` | `3000` | Max load time in ms |
| `IMAGE_SIZE_LIMIT_KB` | `600` | Max image file size |
| `FAIL_ON_DEPRECATED` | `false` | Fail on deprecated API warnings |
| `MAX_FOCUS_CHECK` | `30` | Max elements to check for keyboard focus |

---

## Commands

### General

| Command | Runs |
|---|---|
| `npm run test:live` | All tests (safe), live env |
| `npm test` | All tests, all browsers |
| `npm run test:headed` | Visible browser |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:report` | Open HTML report |
| `npm run test:smoke` | Only `@smoke` tagged |

### By category

| Command | Spec file |
|---------|-----------|
| `npm run test:images` | `tests/images.spec.ts` |
| `npm run test:links` | `tests/broken-links.spec.ts` |
| `npm run test:seo` | `tests/seo.spec.ts` |
| `npm run test:responsive` | `tests/responsive.spec.ts` |

Run any other spec directly: `npx playwright test tests/<name>.spec.ts`

### By browser

| Command | Runs on |
|---|---|
| `npm run test:chrome` | Desktop + Mobile Chrome |
| `npm run test:firefox` | Desktop Firefox |
| `npm run test:safari` | Desktop + Mobile Safari |
| `npm run test:desktop` | All 3 desktop browsers |
| `npm run test:mobile` | Both mobile |
| `npm run test:browser <name>` | Single project by name |

Prefix with `live:` to also set `ENVIRONMENT=live`:
`npm run live:chrome`, `live:firefox`, `live:safari`, `live:desktop`, `live:mobile`, `live:browser <name>`

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
tests/                    # Playwright spec files (9 total)
  header.spec.ts          # Logo, hamburger, active state
  footer.spec.ts          # Logo, links, copyright, social media, spelling
  navigation.spec.ts      # Link navigation, external link targets
  buttons.spec.ts         # CTA visibility, clickability, spelling
  responsive.spec.ts      # Viewport overflow, mobile nav, text readability
  seo.spec.ts             # Title, meta, OG tags, H1, alt, robots
  broken-links.spec.ts    # All hrefs return < 400
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
playwright.config.ts      # 5 browser projects (Chrome, Firefox, Safari x2)
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
