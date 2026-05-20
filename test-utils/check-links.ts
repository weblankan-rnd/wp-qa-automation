import { APIRequestContext, Locator } from '@playwright/test';

export async function checkLinks(
  request: APIRequestContext,
  links: Locator,
  baseURL: string
): Promise<string[]> {
  const broken: string[] = [];
  const count = await links.count();

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
    const url = href.startsWith('http') ? href : `${baseURL}${href}`;
    try {
      const response = await request.get(url);
      if (response.status() >= 400) {
        broken.push(`${url} → ${response.status()}`);
      }
    } catch {
      broken.push(`${url} → connection error`);
    }
  }
  return broken;
}
