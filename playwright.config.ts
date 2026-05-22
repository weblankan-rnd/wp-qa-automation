import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const fullMatrix = process.env.FULL_MATRIX === 'true';

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  maxFailures: 0,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
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
    navigationTimeout: 60000,
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(fullMatrix ? [
      {
        name: 'Desktop Firefox',
        use: { ...devices['Desktop Firefox'] },
        },
      {
        name: 'Desktop Safari',
        use: { ...devices['Desktop Safari'] },
        },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
        },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 13'] },
        },
    ] : []),
  ],
  outputDir: 'reports/test-results',
});
