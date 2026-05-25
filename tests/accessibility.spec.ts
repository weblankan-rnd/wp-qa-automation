/**
 * Accessibility testing using axe-core.
 *
 * Runs automated aXe audits on every discovered page and fails on
 * violations at or above the configured impact level (default: critical).
 *
 * Install: npm install --save-dev @axe-core/playwright
 *
 * Impact levels: critical, serious, moderate, minor
 * Configure via env: ACCESSIBILITY_IMPACT=serious
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { config } from '../test-utils/config';
import { getPagesToCheck, pageLabel } from '../test-utils/get-pages-to-check';

const pagesToCheck = getPagesToCheck();

// Map config impact level to axe-core values for filtering
const IMPACT_ORDER: Record<string, number> = {
  minor: 0,
  moderate: 1,
  serious: 2,
  critical: 3,
};

const minImpactLevel: number = IMPACT_ORDER[config.accessibilityImpact] ?? IMPACT_ORDER.critical;

test.describe('Accessibility', () => {
  for (const pagePath of pagesToCheck) {
    const label = pageLabel(pagePath);

    test(`no ${config.accessibilityImpact}+ accessibility violations on ${label}`, async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();

      const relevantViolations = results.violations.filter((v) => {
        const level: number = v.impact ? (IMPACT_ORDER[v.impact] ?? 0) : 0;
        return level >= minImpactLevel;
      });

      if (relevantViolations.length > 0) {
        const summary = relevantViolations
          .slice(0, 15)
          .map(
            (v) =>
              `  [${(v.impact || 'unknown').toUpperCase()}] ${v.id}: ${v.help}\n` +
              `    ${v.helpUrl}\n` +
              `    ${v.nodes.length} element(s) affected\n` +
              v.nodes
                .slice(0, 3)
                .map((n) => `      - ${n.target.join(', ')}`)
                .join('\n')
          )
          .join('\n');

        expect.soft(
          false,
          `[A11y] ${relevantViolations.length} accessibility violation(s) on ${pagePath} (impact ≥ ${config.accessibilityImpact}):\n${summary}`
        ).toBeTruthy();
      }
    });
  }
});
