# QA Agent Guide

This document describes conventions, selector strategies, and best practices for this Playwright-based WordPress QA suite.

---

## Selector Strategy

All CSS selectors are centralized in `test-utils/selectors.ts`. When the WordPress theme changes, update that single file.

### Priority Order (by fragility, best first)

1. **`data-testid`** attributes (added to theme templates by dev team)
   - `[data-testid="header-logo"]`
   - `[data-testid="mobile-menu"]`
   - `[data-testid="cta-button"]`
2. **Accessible labels / ARIA roles**
   - `[aria-label="Menu"]`
   - `nav[aria-label="Footer Navigation"]`
   - `role="banner"` for header
3. **Semantic selectors** (if unique enough)
   - `footer .footerlogo` — only if there's one footer
   - `header .navbar-brand` — namespace under header/footer
4. **Generic selectors** (last resort — most fragile)
   - `.hvr-shutter-out-horizontal` — CSS-only class, may change with theme update

### Adding Selectors

Never hardcode a selector in a spec file. Add it to `selectors.ts`:
```ts
export const HEADER = {
  LOGO: 'header [data-testid="header-logo"], header .navbar-brand',
  NAV_LINKS: 'header .navigation ul li a',
  HAMBURGER: '.menu-ham',
  MOBILE_MENU: '.mobile-menu',
};
```

---

## Test Writing Guidelines

### Structure

- Each `describe` block = one component / feature area (e.g., "Header", "SEO")
- Each `test` = one assertion concern (soft-assert multiple related points within)
- `@smoke` tag on every test — CI runs all tests, `--grep @smoke` for quick smoke runs
- Dynamic tests (one test per page generated via `for...of`) are the standard pattern for SEO, responsive, images

### Assertions

- Use `expect.soft` for non-blocking assertions — gather all issues in one run
- Always provide actionable error messages: `expect.soft(false, \`[Tag] Descriptive message with values\`)`
- Skip `expect.soft` only when a failure must abort the test immediately

### Page Navigation

- Prefer `waitUntil: 'domcontentloaded'` for content checks
- Use `waitUntil: 'load'` for performance / image measurements
- Use `Promise.all([page.waitForURL(...), action.click()])` for navigation actions

### Error Handling

- All flaky lookups should use `.catch(() => fallback)` — don't let selector errors crash the suite
- Log warnings (`console.warn`) for soft recoverable issues, not silent skips

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `BASE_URL` | Yes (CI) | `http://localhost` | Target WordPress site |
| `ENVIRONMENT` | Yes | `live` | `live` = safe mode; `staging` = enables destructive tests |
| `FULL_MATRIX` | No | `false` | Run all 5 browser engines |
| `PAGES` | No | auto (sitemap) | Explicit page list overrides auto-discovery |
| `SKIP_PAGE_DISCOVERY` | No | `false` | Use pre-cached pages (CI optimization) |
| `CHECK_LOAD_TIME` | No | `false` | Strictly fail on slow page loads |
| `IMAGE_SIZE_LIMIT_KB` | No | `500` | Max image file size |
| `LOAD_TIME_THRESHOLD_MS` | No | `5000` | Max page load time |
| `LCP_LIMIT_MS` | No | `4000` | Max LCP on homepage |
| `MAX_RENDER_BLOCKING` | No | `8` | Max render-blocking resources |
| `MAX_PAGES_TO_CHECK` | No | `20` | Cap on dynamically discovered pages |
| `ACCESSIBILITY_IMPACT` | No | `critical` | Min impact level to fail on (`critical`, `serious`, `moderate`, `minor`) |

---

## Adding a New Spec

1. Create `tests/<name>.spec.ts`
2. Import shared utilities:
   ```ts
   import { config } from '../test-utils/config';
   import { getPagesToCheck } from '../test-utils/get-pages-to-check';
   import { HEADER, FOOTER, BUTTONS } from '../test-utils/selectors';
   ```
3. Tag all read-only checks with `@smoke`
4. Use `describe` block matching the component name
5. Run `npx playwright test tests/<name>.spec.ts` to verify

---

## Running Tests

```bash
npm run test:live              # Full suite against live site
npm run test:headed            # Visible browser for debugging
npm run test:ui                # Playwright UI mode
FULL_MATRIX=true npm test      # Cross-browser
npm run test:smoke             # Quick sanity (all @smoke)
npm run test:report            # Open HTML report
```

---

## CI/CD

- Workflow: `.github/workflows/qa.yml`
- Triggered manually or on schedule (nightly at 6 AM UTC weekdays)
- Artifact: HTML report retained 14 days
- Reports available in `reports/html/` locally
