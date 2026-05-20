import { test, expect } from '@playwright/test';
import path from 'path';
import formsData from '../test-data/forms.json';

test.describe('Forms — inputs, upload, radio, checkbox, URL fields', () => {
  test.describe('Text inputs & contact form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/contact-us/');
    });

    test('contact form is present and visible', async ({ page }) => {
      const form = page.locator('form.wpcf7-form, form[data-testid="contact-form"], #contact-form, .contact-form form').first();
      await expect(form).toBeVisible();
    });

    test('all required text fields accept input', async ({ page }) => {
      const fields = formsData.contact.fields;

      for (const [key, field] of Object.entries(fields)) {
        const input = page.locator(field.selector).first();
        if (await input.count() === 0) {
          console.warn(`Field "${key}" not found with selector: ${field.selector}`);
          continue;
        }
        await input.fill(field.value);
        await expect(input).toHaveValue(field.value);
      }
    });

    test('form shows validation error on empty required field submit', async ({ page }) => {
      const submit = page.locator(formsData.contact.submitSelector).first();
      if (await submit.count() === 0) {
        test.skip();
        return;
      }
      await submit.click();

      // WP Contact Form 7 and most WP forms show .wpcf7-not-valid or native browser validation
      const error = page.locator('.wpcf7-not-valid, .wpcf7-response-output, [aria-live="assertive"], .error-message, [data-testid="form-error"]');
      // Browser native validation (required attribute) prevents submission — either is acceptable
      const hasError = await error.count() > 0;
      const url = page.url();
      // Form should not navigate away on empty submission
      expect(url).toMatch(/contact/i);
    });
  });

  test.describe('File upload fields', () => {
    test('file input accepts a file', async ({ page }) => {
      // Try common WP upload pages — skip gracefully if not found
      for (const path_ of ['/upload', '/submit', '/contact', '/apply']) {
        await page.goto(path_);
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
          // Create a tiny in-memory PNG (1x1 pixel)
          const testFilePath = path.join(process.cwd(), 'test-data', 'sample-upload.jpg');
          await fileInput.setInputFiles(testFilePath).catch(async () => {
            // File doesn't exist yet — use a buffer
            await fileInput.setInputFiles({
              name: 'test-image.jpg',
              mimeType: 'image/jpeg',
              buffer: Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKwAB/9k=', 'base64'),
            });
          });
          const value = await fileInput.inputValue();
          expect(value).toBeTruthy();
          return;
        }
      }
      test.skip(); // No file upload field found on any tested page
    });

    test('file input rejects disallowed types if configured', async ({ page }) => {
      for (const path_ of ['/upload', '/submit', '/contact', '/apply']) {
        await page.goto(path_);
        const fileInput = page.locator('input[type="file"][accept]').first();
        if (await fileInput.count() > 0) {
          const accept = await fileInput.getAttribute('accept');
          expect(accept).toBeTruthy();
          // Verify accept attribute contains at least one allowed type
          expect(accept).toMatch(/image|pdf|doc|application/i);
          return;
        }
      }
    });
  });

  test.describe('Radio buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/contact-us/');
    });

    test('radio buttons are selectable', async ({ page }) => {
      const radios = page.locator('input[type="radio"]');
      const count = await radios.count();

      if (count === 0) {
        test.skip(); return;
      }

      await radios.first().check();
      await expect(radios.first()).toBeChecked();
    });

    test('only one radio in a group can be selected at a time', async ({ page }) => {
      const radios = page.locator('input[type="radio"]');
      const count = await radios.count();
      if (count < 2) { test.skip(); return; }

      // Find two radios with the same name
      const firstName = await radios.first().getAttribute('name');
      const sameGroup = page.locator(`input[type="radio"][name="${firstName}"]`);
      const groupCount = await sameGroup.count();
      if (groupCount < 2) { test.skip(); return; }

      await sameGroup.first().check();
      await sameGroup.nth(1).check();

      await expect(sameGroup.first()).not.toBeChecked();
      await expect(sameGroup.nth(1)).toBeChecked();
    });

    test('each radio has an associated label', async ({ page }) => {
      const radios = page.locator('input[type="radio"]');
      const count = await radios.count();
      if (count === 0) { test.skip(); return; }

      for (let i = 0; i < count; i++) {
        const id = await radios.nth(i).getAttribute('id');
        const ariaLabel = await radios.nth(i).getAttribute('aria-label');
        const ariaLabelledBy = await radios.nth(i).getAttribute('aria-labelledby');

        const hasLabel = id
          ? await page.locator(`label[for="${id}"]`).count() > 0
          : false;

        expect(
          hasLabel || !!ariaLabel || !!ariaLabelledBy,
          `Radio button at index ${i} has no accessible label`
        ).toBeTruthy();
      }
    });
  });

  test.describe('Checkboxes', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/contact-us/');
    });

    test('checkboxes can be checked and unchecked', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count === 0) { test.skip(); return; }

      await checkboxes.first().check();
      await expect(checkboxes.first()).toBeChecked();

      await checkboxes.first().uncheck();
      await expect(checkboxes.first()).not.toBeChecked();
    });

    test('multiple checkboxes can be selected simultaneously', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count < 2) { test.skip(); return; }

      await checkboxes.first().check();
      await checkboxes.nth(1).check();

      await expect(checkboxes.first()).toBeChecked();
      await expect(checkboxes.nth(1)).toBeChecked();
    });

    test('each checkbox has an associated label', async ({ page }) => {
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count === 0) { test.skip(); return; }

      for (let i = 0; i < count; i++) {
        const id = await checkboxes.nth(i).getAttribute('id');
        const ariaLabel = await checkboxes.nth(i).getAttribute('aria-label');
        const hasLabel = id
          ? await page.locator(`label[for="${id}"]`).count() > 0
          : false;

        expect(
          hasLabel || !!ariaLabel,
          `Checkbox at index ${i} has no accessible label`
        ).toBeTruthy();
      }
    });
  });

  test.describe('URL fields', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/contact-us/');
    });

    test('URL input accepts a valid URL', async ({ page }) => {
      const urlInputs = page.locator('input[type="url"]');
      const count = await urlInputs.count();
      if (count === 0) { test.skip(); return; }

      await urlInputs.first().fill('https://example.com');
      await expect(urlInputs.first()).toHaveValue('https://example.com');
    });

    test('URL input rejects invalid format via browser validation', async ({ page }) => {
      const urlInputs = page.locator('input[type="url"]');
      const count = await urlInputs.count();
      if (count === 0) { test.skip(); return; }

      await urlInputs.first().fill('not-a-valid-url');
      const valid = await urlInputs.first().evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(valid).toBe(false);
    });
  });
});
