import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { getPages } from './test-utils/get-pages';

dotenv.config();

async function globalSetup() {
  const baseUrl = process.env.BASE_URL || '';

  if (!baseUrl) {
    throw new Error('BASE_URL is not set. Pass it via env: BASE_URL=https://yoursite.com npx playwright test');
  }

  console.log(`[global-setup] Targeting: ${baseUrl}`);

  const pages = await getPages();
  writeFileSync('test-data/.page-cache.json', JSON.stringify(pages), 'utf-8');
  console.log(`[global-setup] Pages to test (${pages.length}): ${pages.join(', ')}`);
}

export default globalSetup;
