import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const isLive = process.env.ENVIRONMENT === 'live';
const fullMatrix = process.env.FULL_MATRIX === 'true';

const ignoredSpecs = isLive ? ['**/registration.spec.ts', '**/forms.spec.ts', '**/login.spec.ts'] : [];

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  maxFailures: process.env.CI ? 50 : undefined,
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
    navigationTimeout: 60000,
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ignoredSpecs,
    },
    ...(fullMatrix ? [
      {
        name: 'Desktop Firefox',
        use: { ...devices['Desktop Firefox'] },
        testIgnore: ignoredSpecs,
      },
      {
        name: 'Desktop Safari',
        use: { ...devices['Desktop Safari'] },
        testIgnore: ignoredSpecs,
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
        testIgnore: ignoredSpecs,
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 13'] },
        testIgnore: ignoredSpecs,
      },
    ] : []),
  ],
  outputDir: 'reports/test-results',
});
