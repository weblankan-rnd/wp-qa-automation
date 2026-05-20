# WordPress QA Agent — Playwright Test Suite

Automated frontend QA suite for WordPress sites. Detects pages automatically from the sitemap and runs tests across 5 browser projects (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Configure your target site
cp .env.example .env

# 4. Run all tests
npm run test:live

# 5. View HTML report
npm run test:report
```

---

## Environment Setup

Copy `.env.example` to `.env`:

| Variable              | Default                   | Description                                     |
|-----------------------|---------------------------|-------------------------------------------------|
| `BASE_URL`            | `https://www.weblankan.lk`| Target WordPress site URL (no trailing slash)    |
| `ENVIRONMENT`         | `live`                    | `live` — excludes destructive tests             |
| `WP_LOGIN_URL`        | `/wp-login.php`           | WP login page path                              |
| `CHECK_LOAD_TIME`     | `false`                   | Fail tests when page loads exceed threshold     |
| `LOAD_TIME_THRESHOLD_MS` | `3000`                 | Max page load time in ms                        |
| `IMAGE_SIZE_LIMIT_KB` | `600`                     | Max image file size before test fails           |
| `FAIL_ON_DEPRECATED`  | `false`                   | Fail tests on deprecated API warnings           |
| `MAX_FOCUS_CHECK`     | `30`                      | Max interactive elements to check for focus     |

---

## Test Commands

| Command                   | What it runs                                        |
|---------------------------|-----------------------------------------------------|
| `npm run test:live`       | All tests (minus destructive) on live site          |
| `npm test`                | All tests, all browsers                             |
| `npm run test:smoke`      | Only `@smoke` tagged tests                          |
| `npm run test:headed`     | All tests with visible browser                      |
| `npm run test:ui`         | Playwright interactive UI                           |
| `npm run test:report`     | Open last HTML report                               |

### By category

| Command                       | What it runs                        |
|-------------------------------|-------------------------------------|
| `npm run test:header`         | Header tests                        |
| `npm run test:footer`         | Footer tests                        |
| `npm run test:nav`            | Navigation tests                    |
| `npm run test:buttons`        | CTA button tests                    |
| `npm run test:responsive`     | Responsive layout across viewports  |
| `npm run test:seo`            | SEO meta tags, OG, canonical        |
| `npm run test:links`          | Broken link scanner                 |
| `npm run test:console`        | Console errors & failed requests    |
| `npm run test:a11y`           | Accessibility (axe-core WCAG 2.1 AA)|
| `npm run test:perf`           | Performance smoke checks            |
| `npm run test:images`         | WebP format & image size checks     |
| `npm run test:login`          | Login page UI smoke checks          |
| `npm run test:forms`          | Forms, upload, radio, checkbox, URL |
| `npm run test:registration`   | Registration tests (staging only)   |

### By browser

| Command                       | What it runs                                |
|-------------------------------|---------------------------------------------|
| `npm run test:chrome`         | Desktop Chrome + Mobile Chrome              |
| `npm run test:firefox`        | Desktop Firefox                             |
| `npm run test:safari`         | Desktop Safari + Mobile Safari              |
| `npm run test:desktop`        | All 3 desktop browsers                      |
| `npm run test:mobile`         | Both mobile browsers                        |
| `npm run test:browser <name>` | Single project (e.g. `"Desktop Chrome"`)    |
| `npm run live:chrome`         | Chrome only, live environment               |
| `npm run live:firefox`        | Firefox only, live environment              |
| `npm run live:safari`         | Safari only, live environment               |
| `npm run live:desktop`        | Desktop only, live environment              |
| `npm run live:mobile`         | Mobile only, live environment               |
| `npm run live:browser <name>` | Single project, live environment            |

---

## Test Coverage

| Spec File                 | Category              | Live-safe |
|---------------------------|-----------------------|:---------:|
| `header.spec.ts`          | Header                | ✅        |
| `footer.spec.ts`          | Footer                | ✅        |
| `navigation.spec.ts`      | Navigation            | ✅        |
| `buttons.spec.ts`         | Buttons / CTAs        | ✅        |
| `responsive.spec.ts`      | Responsive layout     | ✅        |
| `seo.spec.ts`             | SEO basics            | ✅        |
| `broken-links.spec.ts`    | Broken links          | ✅        |
| `console-errors.spec.ts`  | JS errors             | ✅        |
| `accessibility.spec.ts`   | WCAG 2.1 AA           | ✅        |
| `performance.spec.ts`     | Performance smoke     | ✅        |
| `images.spec.ts`          | WebP format & size    | ✅        |
| `login.spec.ts`           | Login page UI         | ✅        |
| `forms.spec.ts`           | Forms (staging only)  | ❌        |
| `registration.spec.ts`    | Registration          | ❌        |

---

## Project Structure

```
wordpress-qa-agent/
├── tests/                    # All Playwright spec files
│   ├── header.spec.ts
│   ├── footer.spec.ts
│   ├── navigation.spec.ts
│   ├── buttons.spec.ts
│   ├── responsive.spec.ts
│   ├── seo.spec.ts
│   ├── broken-links.spec.ts
│   ├── console-errors.spec.ts
│   ├── accessibility.spec.ts
│   ├── performance.spec.ts
│   ├── images.spec.ts
│   ├── login.spec.ts
│   ├── forms.spec.ts
│   └── registration.spec.ts
├── test-utils/
│   ├── check-links.ts        # Shared link-checking utility
│   └── get-pages.ts          # Sitemap-based page discovery
├── test-data/
│   └── forms.json            # Form selectors and test values
├── reports/                  # Auto-generated test reports
├── .github/workflows/
│   └── qa.yml                # GitHub Actions workflow (manual trigger)
├── global-setup.ts           # Env validation & sitemap cache
├── playwright.config.ts      # Playwright config (5 browser projects)
├── AGENTS.md                 # Rules for Claude/Codex QA agents
├── .env.example              # Environment template
└── package.json
```

---

## Safety

Tests tagged `@smoke` are read-only and safe for live sites. Destructive tests (forms, registration, login writes) are excluded when `ENVIRONMENT=live` via both `playwright.config.ts` `testIgnore` and per-test runtime guards.

A `global-setup.ts` validates that the environment matches the domain:
- `hostweblankan.in` URLs require `ENVIRONMENT=staging`
- Any other domain requires `ENVIRONMENT=live`

---

## Page Discovery

Pages are not hardcoded. On every run, `global-setup.ts` fetches `BASE_URL/sitemap.xml`, extracts all page paths, and caches them to `test-data/.page-cache.json`. Tests like SEO, broken links, console errors, accessibility, and images generate one test per discovered page.

---

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/qa.yml
name: QA
on:
  workflow_dispatch:
jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:live
        env:
          BASE_URL: https://www.weblankan.lk
          ENVIRONMENT: live
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: reports/html/
```

Trigger manually from Actions tab → "QA" → "Run workflow".

---

## Adding New Tests

1. Create `tests/<category>.spec.ts`
2. Follow the selector priority in `AGENTS.md`
3. Tag read-only tests with `@smoke`
4. Run `npm run test:live` to verify
