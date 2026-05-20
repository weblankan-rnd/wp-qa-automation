import { TestInfo } from '@playwright/test';

export function reportIssues(testInfo: TestInfo, tag: string, issues: string[]) {
  if (issues.length === 0) return;
  const body = issues.map(i => `  ⚠ ${i}`).join('\n');
  const msg = `[${tag}] ${issues.length} issue(s) found:\n${body}`;
  console.warn(msg);
  testInfo.annotations.push({ type: 'issue', description: msg });
}
