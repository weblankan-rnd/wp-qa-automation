/**
 * Visual regression testing using pixelmatch.
 *
 * Captures screenshots of key pages and compares against baselines.
 * Generates diff images when mismatches are found.
 *
 * WORKFLOW:
 *   1. Run with UPDATE_SNAPSHOTS=true to generate initial baselines
 *   2. Run normally — tests pass if screenshots match baselines
 *   3. When intentional visual changes occur, re-run with UPDATE_SNAPSHOTS=true
 *
 * Install: npm install --save-dev pixelmatch pngjs
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { config } from '../test-utils/config';

const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === 'true';
const THRESHOLD = parseFloat(process.env.VISUAL_REGRESSION_THRESHOLD || '0.05'); // 5% diff allowed

const BASELINE_DIR = config.screenshotBaselineDir;
const DIFF_DIR = config.screenshotDiffDir;

// Ensure directories exist
mkdirSync(BASELINE_DIR, { recursive: true });
mkdirSync(DIFF_DIR, { recursive: true });

interface ScreenshotSpec {
  path: string;
  label: string;
  viewport: { width: number; height: number };
  fullPage: boolean;
}

const SCREENSHOTS: ScreenshotSpec[] = [
  { path: '/', label: 'homepage', viewport: config.viewports.desktop, fullPage: true },
  { path: '/', label: 'homepage-mobile', viewport: config.viewports.mobile, fullPage: true },
  { path: '/about-us/', label: 'about-us', viewport: config.viewports.desktop, fullPage: true },
  { path: '/contact-us/', label: 'contact-us', viewport: config.viewports.desktop, fullPage: true },
];

test.describe('Visual Regression', () => {
  for (const spec of SCREENSHOTS) {
    test(`screenshot matches baseline: ${spec.label} @smoke`, async ({ page }) => {
      await page.setViewportSize(spec.viewport);
      await page.goto(spec.path, { waitUntil: 'networkidle' });

      const screenshotPath = join(BASELINE_DIR, `${spec.label}.png`);
      const diffPath = join(DIFF_DIR, `${spec.label}-diff.png`);

      const screenshotBuffer = await page.screenshot({ fullPage: spec.fullPage });

      // If updating snapshots, write new baseline
      if (UPDATE_SNAPSHOTS) {
        writeFileSync(screenshotPath, screenshotBuffer);
        console.log(`[VisualReg] Updated baseline: ${screenshotPath}`);
        return;
      }

      // Check if baseline exists
      if (!existsSync(screenshotPath)) {
        // No baseline to compare against — write one and warn
        writeFileSync(screenshotPath, screenshotBuffer);
        expect.soft(
          false,
          `[VisualReg] No baseline found for "${spec.label}". Generated at: ${screenshotPath}\n` +
            `Run tests again to compare. Set UPDATE_SNAPSHOTS=true to update intentionally.`
        ).toBeTruthy();
        return;
      }

      // Compare screenshots
      const baseline = PNG.sync.read(readFileSync(screenshotPath));
      const current = PNG.sync.read(screenshotBuffer);

      const { width, height } = baseline;
      const diff = new PNG({ width, height });

      // Resize current image if dimensions differ
      if (current.width !== width || current.height !== height) {
        expect.soft(
          false,
          `[VisualReg] Dimension mismatch for "${spec.label}": baseline ${width}x${height}, current ${current.width}x${current.height}`
        ).toBeTruthy();
        return;
      }

      const mismatchedPixels = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
      );

      const totalPixels = width * height;
      const diffRatio = mismatchedPixels / totalPixels;

      if (diffRatio > THRESHOLD) {
        writeFileSync(diffPath, PNG.sync.write(diff));
        expect.soft(
          false,
          `[VisualReg] "${spec.label}" differs by ${(diffRatio * 100).toFixed(2)}% (threshold: ${(THRESHOLD * 100).toFixed(0)}%)\n` +
            `  Diff image: ${diffPath}`
        ).toBeTruthy();
      }
    });
  }
});
