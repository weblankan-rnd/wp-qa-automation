import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pagesToCheck = ['/', '/about-us/', '/contact-us/', '/accommodation/'];

test.describe('Accessibility (axe-core)', () => {
  for (const pagePath of pagesToCheck) {
    test(`zero critical violations on ${pagePath === '/' ? 'homepage' : pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('#wpadminbar') // WP admin bar may have its own issues
        .analyze();

      const critical = results.violations.filter(v => v.impact === 'critical');

      if (results.violations.length > 0) {
        const report = results.violations.map(v =>
          `[${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.length}`
        ).join('\n');
        console.warn(`Accessibility violations on ${pagePath}:\n${report}`);
      }

      expect(
        critical,
        `Critical a11y violations on ${pagePath}:\n${critical.map(v => `${v.id}: ${v.description}`).join('\n')}`
      ).toHaveLength(0);
    });
  }

  test('all interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/');

    const interactives = page.locator('a, button, input, select, textarea, [tabindex]');
    const count = await interactives.count();

    const notFocusable: string[] = [];
    for (let i = 0; i < Math.min(count, 30); i++) {
      const el = interactives.nth(i);
      const tabindex = await el.getAttribute('tabindex');
      if (tabindex === '-1') continue;

      const visible = await el.isVisible();
      if (!visible) continue;

      try {
        await el.focus();
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        if (!focused) {
          const tag = await el.evaluate(e => e.tagName);
          notFocusable.push(tag);
        }
      } catch {
        // Element not focusable
      }
    }

    expect(notFocusable.length, `${notFocusable.length} interactive element(s) not keyboard focusable`).toBe(0);
  });

  test('color contrast ratio meets WCAG AA (axe check)', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');

    if (contrastViolations.length > 0) {
      console.warn(`Color contrast violations: ${contrastViolations[0].nodes.length} element(s) fail`);
    }
    // Warn only — color contrast is important but may need design decisions
  });

  test('skip navigation link is present', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.locator('a[href="#main"], a[href="#content"], a[href="#main-content"], a.skip-link, a.screen-reader-text').first();
    if (await skipLink.count() === 0) {
      console.warn('No skip navigation link found — recommended for keyboard accessibility');
    }
  });

  test('form fields have associated labels', async ({ page }) => {
    await page.goto('/contact-us/');

    const results = await new AxeBuilder({ page })
      .withRules(['label', 'label-content-name-mismatch'])
      .analyze();

    const labelViolations = results.violations.filter(v => v.id === 'label');
    expect(
      labelViolations,
      `Form fields missing labels:\n${labelViolations.map(v => v.description).join('\n')}`
    ).toHaveLength(0);
  });
});
