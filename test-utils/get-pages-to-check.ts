import { existsSync, readFileSync } from 'fs';
import { IGNORED_PATHS } from './ignored-paths';

const CACHE_PATH = 'test-data/.page-cache.json';

/**
 * Returns the list of page paths to test from the page cache file.
 * Falls back to `['/']` if cache doesn't exist.
 * Filters out paths listed in IGNORED_PATHS.
 */
export function getPagesToCheck(): string[] {
  const pages: string[] = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, 'utf-8'))
    : ['/'];

  return pages.filter((p: string) => !IGNORED_PATHS.includes(p));
}

/**
 * Returns whether a page path is an archive page (category/tag/author).
 */
export function isArchivePage(path: string): boolean {
  return (
    path.startsWith('/category/') ||
    path.startsWith('/tag/') ||
    path.startsWith('/author/')
  );
}

/**
 * Returns the display label for a page path.
 */
export function pageLabel(path: string): string {
  return path === '/' ? 'homepage' : path;
}
