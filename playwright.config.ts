import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isLive = process.env.ENVIRONMENT === 'live';

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  maxFailures: process.env.CI ? 10 : undefined,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: isLive ? ['**/registration.spec.ts', '**/forms.spec.ts', '**/login.spec.ts'] : [],
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: isLive ? ['**/registration.spec.ts', '**/forms.spec.ts', '**/login.spec.ts'] : [],
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testIgnore: isLive ? ['**/registration.spec.ts', '**/forms.spec.ts', '**/login.spec.ts'] : [],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: isLive ? ['**/registration.spec.ts', '**/forms.spec.ts', '**/login.spec.ts'] : [],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      testIgnore: isLive ? ['**/registration.spec.ts', '**/forms.spec.ts', '**/login.spec.ts'] : [],
    },
  ],
  outputDir: 'reports/test-results',
});
