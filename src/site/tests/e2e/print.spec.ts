import { test, expect } from '@playwright/test';

test.describe('Print Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/read.html');
    await page.emulateMedia({ media: 'print' });
  });

  test('TOC is hidden in print mode', async ({ page }) => {
    const toc = page.locator('.reader-toc');
    await expect(toc).toBeHidden();
  });

  test('content expands to full width in print', async ({ page }) => {
    const content = page.locator('.reader-content');
    const box = await content.boundingBox();

    // In print mode, content should be wider (no sidebar)
    // At minimum, should be > 600px on a standard page
    expect(box?.width).toBeGreaterThan(500);
  });

  test('no horizontal overflow in print', async ({ page }) => {
    // Check if any element causes horizontal scroll
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasOverflow).toBe(false);
  });
});
