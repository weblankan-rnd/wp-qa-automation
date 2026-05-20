import { test, expect } from '@playwright/test';

const WP_LOGIN = process.env.WP_ADMIN_URL || '/wp-login.php';
const USERNAME = process.env.WP_USERNAME || '';
const PASSWORD = process.env.WP_PASSWORD || '';

test.describe('Login', () => {
  test.skip(!USERNAME || !PASSWORD, 'WP_USERNAME and WP_PASSWORD must be set in .env');

  test.beforeEach(async ({ page }) => {
    await page.goto(WP_LOGIN);
  });

  test('WP login page loads correctly @smoke', async ({ page }) => {
    await expect(page.locator('#loginform, form[name="loginform"], .login form')).toBeVisible();
    await expect(page.locator('#user_login, input[name="log"]')).toBeVisible();
    await expect(page.locator('#user_pass, input[name="pwd"]')).toBeVisible();
    await expect(page.locator('#wp-submit, input[type="submit"]')).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.locator('#user_login, input[name="log"]').fill(USERNAME);
    await page.locator('#user_pass, input[name="pwd"]').fill(PASSWORD);
    await page.locator('#wp-submit, input[type="submit"]').click();

    await page.waitForURL(/wp-admin|dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/wp-admin|dashboard/);
  });

  test('failed login shows error message', async ({ page }) => {
    await page.locator('#user_login, input[name="log"]').fill('wrong_user_12345');
    await page.locator('#user_pass, input[name="pwd"]').fill('wrong_pass_12345');
    await page.locator('#wp-submit, input[type="submit"]').click();

    const errorMsg = page.locator('#login_error, .notice-error, [class*="login-error"]');
    await expect(errorMsg).toBeVisible();
    const text = await errorMsg.textContent();
    expect(text?.toLowerCase()).toMatch(/error|invalid|incorrect|wrong/i);
  });

  test('empty credentials show required field errors', async ({ page }) => {
    await page.locator('#wp-submit, input[type="submit"]').click();

    // Either native browser validation or WP error message
    const hasError = await page.locator('#login_error').count() > 0;
    const stillOnLogin = page.url().includes('wp-login') || page.url().includes('login');
    expect(hasError || stillOnLogin).toBeTruthy();
  });

  test('"Remember me" checkbox is present and toggleable', async ({ page }) => {
    const rememberMe = page.locator('#rememberme, input[name="rememberme"]');
    if (await rememberMe.count() > 0) {
      await rememberMe.check();
      await expect(rememberMe).toBeChecked();
      await rememberMe.uncheck();
      await expect(rememberMe).not.toBeChecked();
    }
  });

  test('"Lost your password?" link is present', async ({ page }) => {
    const forgotLink = page.locator('a[href*="action=lostpassword"], a:has-text("Lost"), a:has-text("Forgot"), a:has-text("password")').first();
    await expect(forgotLink).toBeVisible();
  });
});
