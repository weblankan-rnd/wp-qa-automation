# WordPress QA Agent — Playwright Test Suite

Automated frontend QA suite for WordPress sites. Tests header, footer, navigation, buttons, forms (upload, radio, checkbox, URL), login, registration, responsive layout, SEO, broken links, console errors, accessibility, and performance.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Configure your target site
cp .env.example .env
# Edit .env — set BASE_URL, WP_USERNAME, WP_PASSWORD, ENVIRONMENT

# 4. Run all tests
npm test

# 5. View HTML report
npm run test:report
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in:

| Variable           | Description                                          | Example                        |
|--------------------|------------------------------------------------------|--------------------------------|
| `BASE_URL`         | Target WordPress site URL (no trailing slash)        | `https://staging.example.com`  |
| `ENVIRONMENT`      | `staging` or `live`                                  | `staging`                      |
| `WP_USERNAME`      | WordPress login username                             | `admin`                        |
| `WP_PASSWORD`      | WordPress login password                             | `your-password`                |
| `WP_ADMIN_URL`     | WP login page path                                   | `/wp-login.php`                |
| `TEST_REG_EMAIL`   | Disposable email for registration tests              | `qa@example.com`               |
| `TEST_REG_USERNAME`| Test account username                                | `qa-testuser`                  |
| `TEST_REG_PASSWORD`| Test account password                                | `QaTest!2024`                  |

---

## Test Commands

| Command                  | What it runs                                     |
|--------------------------|--------------------------------------------------|
| `npm test`               | All tests, all browsers                          |
| `npm run test:smoke`     | Only `@smoke` tagged tests (safe for live)       |
| `npm run test:live`      | Smoke tests on live site                         |
| `npm run test:staging`   | Full suite on staging                            |
| `npm run test:headed`    | All tests with visible browser                   |
| `npm run test:ui`        | Playwright interactive UI                        |
| `npm run test:header`    | Header tests only                                |
| `npm run test:footer`    | Footer tests only                                |
| `npm run test:forms`     | Forms, upload, radio, checkbox, URL fields       |
| `npm run test:login`     | Login flow tests                                 |
| `npm run test:registration` | Registration tests (staging only)             |
| `npm run test:responsive`| Responsive layout across viewports              |
| `npm run test:seo`       | SEO meta tags, title, OG, canonical             |
| `npm run test:links`     | Broken link scanner                              |
| `npm run test:a11y`      | Accessibility (axe-core WCAG 2.1 AA)            |
| `npm run test:perf`      | Performance smoke checks                         |
| `npm run test:console`   | Console errors and failed requests               |
| `npm run test:report`    | Open last HTML report                            |

---

## Test Coverage

| Spec File                 | Category           | Safe on Live? |
|---------------------------|--------------------|:-------------:|
| `header.spec.ts`          | Header             | ✅            |
| `footer.spec.ts`          | Footer             | ✅            |
| `navigation.spec.ts`      | Navigation         | ✅            |
| `buttons.spec.ts`         | Buttons / CTAs     | ✅            |
| `forms.spec.ts`           | Forms, upload, radio, checkbox, URL | ⚠️ staging only |
| `login.spec.ts`           | WP Login           | ⚠️ staging only |
| `registration.spec.ts`    | Registration       | ❌ staging only |
| `responsive.spec.ts`      | Responsive layout  | ✅            |
| `seo.spec.ts`             | SEO basics         | ✅            |
| `broken-links.spec.ts`    | Broken links       | ✅ (read-only) |
| `console-errors.spec.ts`  | JS errors          | ✅            |
| `accessibility.spec.ts`   | WCAG 2.1 AA        | ✅            |
| `performance.spec.ts`     | Performance smoke  | ✅            |

---

## Project Structure

```
wordpress-qa-agent/
├── tests/                    # All Playwright spec files
│   ├── header.spec.ts
│   ├── footer.spec.ts
│   ├── navigation.spec.ts
│   ├── buttons.spec.ts
│   ├── forms.spec.ts         # Upload, radio, checkbox, URL fields
│   ├── login.spec.ts
│   ├── registration.spec.ts
│   ├── responsive.spec.ts
│   ├── seo.spec.ts
│   ├── broken-links.spec.ts
│   ├── console-errors.spec.ts
│   ├── accessibility.spec.ts
│   └── performance.spec.ts
├── test-data/
│   ├── pages.json            # Page paths and names
│   └── forms.json            # Form selectors and test values
├── reports/                  # Auto-generated test reports
├── playwright.config.ts      # Playwright config (5 browser projects)
├── AGENTS.md                 # Rules for Claude/Codex QA agents
├── .env.example              # Environment template
└── package.json
```

---

## Live vs Staging Safety Rules

The `ENVIRONMENT=live` flag automatically skips all destructive tests (registration, form submissions, file uploads). Only `@smoke` tagged read-only tests run on live.

Run smoke-only on live:
```bash
npm run test:live
```

Run full suite on staging:
```bash
npm run test:staging
```

---

## Adding New Tests

1. Create `tests/<category>.spec.ts`
2. Follow the selector priority in `AGENTS.md`
3. Tag read-only tests with `@smoke`
4. Add page paths to `test-data/pages.json` if needed
5. Run `npm test` to verify

---

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/qa.yml
name: QA

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6am

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:staging
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          WP_USERNAME: ${{ secrets.WP_USERNAME }}
          WP_PASSWORD: ${{ secrets.WP_PASSWORD }}
          ENVIRONMENT: staging
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: reports/html/
```
