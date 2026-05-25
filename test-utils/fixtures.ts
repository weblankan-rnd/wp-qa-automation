import { test as base } from '@playwright/test';

/**
 * Extended test base for future custom fixtures.
 *
 * Currently extends the default Playwright test without additions.
 * Import from here (not @playwright/test) when custom fixtures are needed:
 *
 *   import { test } from '../test-utils/fixtures';
 *   import { expect } from '@playwright/test';
 *
 *   test('my test', async ({ page }) => { ... });
 */
export const test = base;

export { expect } from '@playwright/test';
