import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { getPages } from './test-utils/get-pages';

dotenv.config();

async function globalSetup() {
  const baseUrl = process.env.BASE_URL || '';
  const environment = process.env.ENVIRONMENT || '';

  if (!baseUrl) {
    throw new Error('BASE_URL is not set in .env');
  }

  if (!environment) {
    throw new Error('ENVIRONMENT is not set in .env — must be "staging" or "live"');
  }

  if (!['staging', 'live'].includes(environment)) {
    throw new Error(`ENVIRONMENT must be "staging" or "live", got "${environment}"`);
  }

  // Staging sites always use hostweblankan.in domain per project convention.
  // Production sites use other domains.
  // This guard prevents accidental destructive writes on live.
  const isStagingDomain = baseUrl.includes('hostweblankan.in');

  if (isStagingDomain && environment === 'live') {
    throw new Error(
      `MISCONFIGURATION: BASE_URL "${baseUrl}" looks like staging (hostweblankan.in) ` +
      `but ENVIRONMENT is set to "live". Set ENVIRONMENT=staging or check BASE_URL.`
    );
  }

  if (!isStagingDomain && environment === 'staging') {
    throw new Error(
      `MISCONFIGURATION: BASE_URL "${baseUrl}" does not look like staging (hostweblankan.in) ` +
      `but ENVIRONMENT is set to "staging". Set ENVIRONMENT=live or check BASE_URL.`
    );
  }

  console.log(`[global-setup] Targeting ${environment}: ${baseUrl}`);

  // Pre-fetch pages from sitemap into cache for test files to read synchronously
  const pages = await getPages();
  writeFileSync('test-data/.page-cache.json', JSON.stringify(pages), 'utf-8');
  console.log(`[global-setup] Discovered ${pages.length} page(s) from sitemap`);
}

export default globalSetup;
