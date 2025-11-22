import { test, expect } from '@playwright/test';

test.describe('Print Layout', () => {
  test('page renders correctly in print mode', async ({ page }) => {
    await page.goto('/read.html');
    await page.waitForLoadState('networkidle');
    await page.emulateMedia({ media: 'print' });

    // TOC should be hidden
    const toc = page.locator('.reader-toc');
    await expect(toc).toBeHidden();

    // Content should be visible and wider (no sidebar)
    const content = page.locator('.reader-content');
    await expect(content).toBeVisible();
    const box = await content.boundingBox();
    expect(box?.width).toBeGreaterThan(500);
  });
});
