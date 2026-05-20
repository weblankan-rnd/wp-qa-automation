import { test, expect } from '@playwright/test';

const REG_EMAIL = process.env.TEST_REG_EMAIL || 'qa-test@example.com';
const REG_USERNAME = process.env.TEST_REG_USERNAME || 'qa-testuser';
const REG_PASSWORD = process.env.TEST_REG_PASSWORD || 'QaTest!2024';

test.describe('Registration', () => {
  // Registration tests must never run on live — only staging
  test.skip(
    process.env.ENVIRONMENT === 'live',
    'Registration tests are disabled on live environment'
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/wp-login.php?action=register');
  });

  test('registration page loads with required fields', async ({ page }) => {
    // Try WP default registration first
    const wpReg = page.locator('#registerform, form[name="registerform"]');
    const customReg = page.locator('form[data-testid="registration-form"], .registration-form form, #registration-form');

    const hasWpForm = await wpReg.count() > 0;
    const hasCustomForm = await customReg.count() > 0;

    if (!hasWpForm && !hasCustomForm) {
      // Try a custom registration page
      await page.goto('/register');
    }

    const form = page.locator('#registerform, form[data-testid="registration-form"], .registration-form form, #registration-form').first();
    await expect(form).toBeVisible();
  });

  test('username field accepts input', async ({ page }) => {
    const usernameField = page.locator('#user_login, input[name="user_login"], input[name="username"]').first();
    if (await usernameField.count() === 0) { test.skip(); return; }

    await usernameField.fill(REG_USERNAME);
    await expect(usernameField).toHaveValue(REG_USERNAME);
  });

  test('email field accepts a valid email', async ({ page }) => {
    const emailField = page.locator('#user_email, input[name="user_email"], input[name="email"], input[type="email"]').first();
    if (await emailField.count() === 0) { test.skip(); return; }

    await emailField.fill(REG_EMAIL);
    await expect(emailField).toHaveValue(REG_EMAIL);
  });

  test('password field masks input', async ({ page }) => {
    const passwordField = page.locator('#user_pass, input[name="user_pass"], input[name="password"], input[type="password"]').first();
    if (await passwordField.count() === 0) { test.skip(); return; }

    const type = await passwordField.getAttribute('type');
    expect(type).toBe('password');
  });

  test('submitting empty form shows validation errors', async ({ page }) => {
    const submit = page.locator('#wp-submit, input[type="submit"], button[type="submit"]').first();
    if (await submit.count() === 0) { test.skip(); return; }

    await submit.click();

    const error = page.locator('#login_error, .notice-error, .error, [class*="error-message"], [aria-live="assertive"]');
    const stillOnRegPage = page.url().includes('register') || page.url().includes('action=register');
    expect(stillOnRegPage, 'Form submission navigated away from registration page').toBe(true);
    if (await error.count() > 0) {
      await expect(error.first()).toBeVisible();
    }
  });

  test('invalid email format triggers validation error', async ({ page }) => {
    const emailField = page.locator('#user_email, input[type="email"]').first();
    if (await emailField.count() === 0) { test.skip(); return; }

    await emailField.fill('not-an-email');
    const isValid = await emailField.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('password strength indicator is shown if present', async ({ page }) => {
    const passwordField = page.locator('#user_pass, input[type="password"]').first();
    if (await passwordField.count() === 0) { test.skip(); return; }

    await passwordField.fill(REG_PASSWORD);

    const strengthIndicator = page.locator('.pw-weak, .pw-good, .pw-strong, #pass-strength-result, [class*="password-strength"]');
    if (await strengthIndicator.count() > 0) {
      await expect(strengthIndicator.first()).toBeVisible();
    }
  });

  test('"Register" link is accessible from login page', async ({ page }) => {
    await page.goto('/wp-login.php');
    const registerLink = page.locator('a[href*="register"], a:has-text("Register"), a:has-text("Sign up")').first();
    if (await registerLink.count() > 0) {
      await expect(registerLink).toBeVisible();
    }
  });
});
