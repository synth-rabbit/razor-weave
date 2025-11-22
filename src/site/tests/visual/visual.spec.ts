import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('read.html desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/read.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('read-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('read.html mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/read.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('read-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('read.html TOC open mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/read.html');
    await page.waitForLoadState('networkidle');

    const tocToggle = page.locator('.toc-toggle');
    if (await tocToggle.isVisible()) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await tocToggle.click({ force: true });
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveScreenshot('read-toc-open-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('read.html print', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/read.html');
    await page.emulateMedia({ media: 'print' });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('read-print.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('index.html desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('index-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('index.html mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('index-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('about.html desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/about.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('about-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('404.html desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/404.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('404-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('read.html keyboard shortcuts help panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/read.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    // Open help panel with ? key
    await page.keyboard.press('?');
    await page.waitForTimeout(400); // Wait for slide-in animation

    await expect(page).toHaveScreenshot('read-help-panel.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    });
  });
});
