import { Page, Locator } from '@playwright/test';

export async function checkLinks(
  page: Page,
  links: Locator,
  baseURL: string
): Promise<string[]> {
  const broken: string[] = [];
  const count = await links.count();

  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('tel:') ||
      href.startsWith('mailto:') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }
    urls.push(href.startsWith('http') ? href : `${baseURL}${href}`);
  }

  // Use browser fetch() so requests come from the same context as the page,
  // bypassing any server-side blocks on standalone API requests.
  const results: string[] = await page.evaluate(async (checkUrls) => {
    const out: string[] = [];
    for (const url of checkUrls) {
      try {
        const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
        if (r.status >= 400) {
          out.push(`${url} → ${r.status}`);
        }
      } catch {
        out.push(`${url} → connection error`);
      }
    }
    return out;
  }, urls);

  return results;
}
