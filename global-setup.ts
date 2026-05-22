import dotenv from 'dotenv';
import { writeFileSync, existsSync } from 'fs';
import { getPages } from './test-utils/get-pages';

dotenv.config();

async function globalSetup() {
  const baseUrl = process.env.BASE_URL || '';

  if (!baseUrl) {
    throw new Error('BASE_URL is not set. Pass it via env: BASE_URL=https://yoursite.com npx playwright test');
  }

  console.log(`[global-setup] Targeting: ${baseUrl}`);

  // In CI the workflow pre-writes the cache file — skip discovery
  if (process.env.SKIP_PAGE_DISCOVERY === 'true' && existsSync('test-data/.page-cache.json')) {
    console.log('[global-setup] Using pre-written page cache from workflow input');
    return;
  }

  const pages = await getPages();
  writeFileSync('test-data/.page-cache.json', JSON.stringify(pages), 'utf-8');
  console.log(`[global-setup] Pages to test (${pages.length}): ${pages.join(', ')}`);
}

export default globalSetup;
