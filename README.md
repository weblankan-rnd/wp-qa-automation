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
| `header` | Logo visible & links home, nav menu has links, mobile hamburger opens, header stays visible after scroll, all header links return < 400 |
| `footer` | Footer visible on all pages, copyright text, social links, widget areas, all footer links return < 400 |
| `navigation` | Nav links resolve without 4xx/5xx, clicking loads valid pages, dropdowns appear on hover, active page highlighted |
| `buttons` | CTA buttons visible with text/label, button links resolve, submit buttons have proper type, disabled buttons unclickable, back-to-top works |
| `responsive` | No horizontal overflow at 5 viewports (390-1280px), header/footer/main visible at each, hamburger or nav on mobile, images don't overflow, font ≥ 14px, touch targets ≥ 44px |
| `seo` | Title (5-70 chars), meta description (10-160 chars), canonical URL, exactly one H1, OG tags, robots noindex, images have alt, sitemap.xml accessible, robots.txt accessible |
| `broken-links` | Every `<a>` and `<img>` on every page returns < 400, sitemap URLs resolve |
| `console-errors` | Zero JS errors, zero failed network requests, no mixed content warnings, deprecated API warnings (opt-in fail) |
| `performance` | Load time < 3s (opt-in fail), LCP < 2.5s, no render-blocking resources, page weight < 5MB, lazy loading, TTFB < 800ms, no redirect chains |
| `images` | All `<img>` src must be `.webp`, no image exceeds size limit (default 600KB), CSS background images warn if not WebP |
| `login` | Login form visible, remember me checkbox toggleable, lost password link present (UI-only smoke, no credentials) |
| `forms` | Form visible, text fields accept input, validation errors show, file upload works, radio/checkbox selectable with labels, URL input validates |
| `registration` | Reg page loads, fields work, empty form shows error, invalid email rejected, password strength indicator (staging only) |

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

`npm run test:<name>` where `name` is: `header`, `footer`, `nav`, `buttons`, `responsive`, `seo`, `links`, `console`, `a11y`, `perf`, `images`, `login`, `forms`, `registration`

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

- `ENVIRONMENT=live` excludes `forms.spec.ts`, `registration.spec.ts`, `login.spec.ts` via `testIgnore` in config
- Those files also have runtime `test.skip(ENVIRONMENT === 'live')` guards
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
tests/                    # Playwright spec files (14 total)
test-utils/
  check-links.ts          # Shared link-checking utility
  get-pages.ts            # Sitemap-based page discovery
test-data/
  forms.json              # Form selectors and test values
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
4. Add `"test:<name>": "playwright test tests/<name>.spec.ts"` to `package.json`
5. Run `npm run test:live` to verify
