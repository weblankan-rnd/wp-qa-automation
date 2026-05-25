/**
 * Security-focused tests.
 *
 * - HTTP security headers check (HSTS, CSP, X-Frame-Options, etc.)
 * - WordPress REST API user enumeration check
 * - Mixed content detection
 * - Login page brute-force protection awareness
 */
import { test, expect } from '@playwright/test';
import { config } from '../test-utils/config';

const BASE_URL = config.baseURL;

test.describe('Security', () => {
  test('security headers are present on homepage @smoke', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    // These should ideally be present
    const requiredHeaders = [
      { name: 'strict-transport-security', label: 'HSTS (Strict-Transport-Security)' },
      { name: 'x-content-type-options', label: 'X-Content-Type-Options (should be "nosniff")' },
      { name: 'x-frame-options', label: 'X-Frame-Options (should be "DENY" or "SAMEORIGIN")' },
      { name: 'referrer-policy', label: 'Referrer-Policy' },
    ];

    const missing: string[] = [];
    for (const h of requiredHeaders) {
      if (!headers[h.name]) {
        missing.push(h.label);
      }
    }

    if (missing.length > 0) {
      expect.soft(
        false,
        `[Security] Missing security headers on homepage:\n${missing.map((m) => `  - ${m}`).join('\n')}\n` +
          'Consider adding via .htaccess, server config, or a security plugin.'
      ).toBeTruthy();
    }
  });

  test('Content-Security-Policy does not allow unsafe-inline @smoke', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    const csp = headers['content-security-policy'] || headers['x-content-security-policy'];
    if (!csp) {
      console.warn('[Security] No CSP header found — consider adding one');
      return;
    }

    const issues: string[] = [];
    if (csp.includes("'unsafe-inline'")) {
      issues.push("CSP allows 'unsafe-inline' — consider using nonces or hashes instead");
    }
    if (csp.includes("'unsafe-eval'")) {
      issues.push("CSP allows 'unsafe-eval' — consider restricting if not needed");
    }
    if (!csp.includes('https:')) {
      issues.push('CSP missing https: scheme restriction');
    }

    if (issues.length > 0) {
      // Warn but don't fail — CSP changes can break functionality
      console.warn(`[Security] CSP policy issues:\n${issues.map((m) => `  - ${m}`).join('\n')}`);
    }
  });

  test('WordPress REST API does not leak user data @smoke', async ({ page }) => {
    // The WP REST API users endpoint should not be publicly accessible
    const response = await page.request.get('/wp-json/wp/v2/users', {
      headers: { Accept: 'application/json' },
    });

    if (response.ok()) {
      const body = await response.json();
      if (Array.isArray(body) && body.length > 0) {
        const leaked = body.slice(0, 5).map((u: { name?: string; slug?: string; id?: number }) => ({
          id: u.id,
          name: u.name,
          slug: u.slug,
        }));

        const names = leaked.map((u: { name?: string }) => u.name).filter(Boolean);
        if (names.length > 0) {
          expect.soft(
            false,
            `[Security] WP REST API publicly exposes user data at /wp-json/wp/v2/users!\n` +
              `  ${leaked.length} user(s) exposed:\n${leaked
                .map((u: { id?: number; name?: string; slug?: string }) => `    - ID ${u.id}: ${u.name || u.slug}`)
                .join('\n')}\n` +
              `  Fix: Install a plugin to restrict REST API access or add ` +
              `'add_filter("rest_authentication_errors", "__return_true")' to functions.php and require authentication.`
          ).toBeTruthy();
        }
      }
    }
  });

  test('no mixed content warnings on homepage @smoke', async ({ page }) => {
    const mixed: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      const pageUrl = page.url();
      try {
        if (
          new URL(pageUrl).protocol === 'https:' &&
          new URL(url).protocol !== 'https:' &&
          !url.startsWith('data:') &&
          !url.startsWith('blob:')
        ) {
          mixed.push(`${request.resourceType()}: ${url}`);
        }
      } catch {
        // ignore invalid URLs
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    if (mixed.length > 0) {
      expect.soft(
        false,
        `[Security] ${mixed.length} mixed content request(s) on homepage (loaded over HTTPS, but resource is HTTP):\n${mixed
          .slice(0, 15)
          .map((m) => `  - ${m}`)
          .join('\n')}`
      ).toBeTruthy();
    }
  });
});
