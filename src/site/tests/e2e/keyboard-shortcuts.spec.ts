import { test, expect } from '@playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/read.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Help Panel', () => {
    test('? key opens help panel', async ({ page }) => {
      const helpPanel = page.locator('.shortcuts-help-panel');

      await page.keyboard.press('?');
      await page.waitForTimeout(300);
      await expect(helpPanel).toHaveClass(/open/);
    });

    test('help panel shows keyboard shortcuts content', async ({ page }) => {
      await page.keyboard.press('?');
      await page.waitForTimeout(300);

      const helpPanel = page.locator('.shortcuts-help-panel');
      await expect(helpPanel).toContainText('Keyboard Shortcuts');
      await expect(helpPanel).toContainText('Navigation');
    });

    test('close button closes help panel', async ({ page }) => {
      const helpPanel = page.locator('.shortcuts-help-panel');

      await page.keyboard.press('?');
      await page.waitForTimeout(300);
      await expect(helpPanel).toHaveClass(/open/);

      await page.locator('.shortcuts-help-close').click();
      await page.waitForTimeout(300);
      await expect(helpPanel).not.toHaveClass(/open/);
    });

    test('pressing ? again closes help panel', async ({ page }) => {
      const helpPanel = page.locator('.shortcuts-help-panel');

      // Open
      await page.keyboard.press('?');
      await page.waitForTimeout(300);
      await expect(helpPanel).toHaveClass(/open/);

      // Close with ?
      await page.keyboard.press('?');
      await page.waitForTimeout(300);
      await expect(helpPanel).not.toHaveClass(/open/);
    });
  });

  test.describe('Navigation Shortcuts', () => {
    test('Alt+ArrowRight triggers scroll', async ({ page }) => {
      // Get initial scroll position
      const initialScroll = await page.evaluate(() => window.scrollY);

      await page.keyboard.press('Alt+ArrowRight');
      await page.waitForTimeout(500);

      // Scroll position should have changed
      const newScroll = await page.evaluate(() => window.scrollY);
      expect(newScroll).toBeGreaterThan(initialScroll);
    });
  });

  test.describe('Quick Jump Shortcuts', () => {
    test('Alt+G scrolls page', async ({ page }) => {
      const initialScroll = await page.evaluate(() => window.scrollY);

      await page.keyboard.press('Alt+g');
      await page.waitForTimeout(500);

      const newScroll = await page.evaluate(() => window.scrollY);
      expect(newScroll).toBeGreaterThan(initialScroll);
    });

    test('Alt+I scrolls page', async ({ page }) => {
      const initialScroll = await page.evaluate(() => window.scrollY);

      await page.keyboard.press('Alt+i');
      await page.waitForTimeout(500);

      const newScroll = await page.evaluate(() => window.scrollY);
      expect(newScroll).toBeGreaterThan(initialScroll);
    });

    test('Alt+S scrolls page', async ({ page }) => {
      const initialScroll = await page.evaluate(() => window.scrollY);

      await page.keyboard.press('Alt+s');
      await page.waitForTimeout(500);

      const newScroll = await page.evaluate(() => window.scrollY);
      expect(newScroll).toBeGreaterThan(initialScroll);
    });
  });

  test.describe('Platform-aware key display', () => {
    test('help panel shows key symbols', async ({ page }) => {
      await page.keyboard.press('?');
      await page.waitForTimeout(300);

      const helpPanel = page.locator('.shortcuts-help-panel');
      const keyDisplay = await helpPanel.textContent();

      // Should contain either Mac symbols or Windows text
      expect(keyDisplay).toMatch(/⌥|Alt/);
    });
  });
});
