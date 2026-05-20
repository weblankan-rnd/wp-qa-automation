import { test, expect } from '@playwright/test';

const WP_LOGIN = process.env.WP_LOGIN_URL || '/wp-login.php';

test.describe('Login UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WP_LOGIN);
  });

  test('WP login page loads correctly @smoke', async ({ page }) => {
    await expect(page.locator('#loginform, form[name="loginform"], .login form')).toBeVisible();
    await expect(page.locator('#user_login, input[name="log"]')).toBeVisible();
    await expect(page.locator('#user_pass, input[name="pwd"]')).toBeVisible();
    await expect(page.locator('#wp-submit, input[type="submit"]')).toBeVisible();
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
