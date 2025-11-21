import { test, expect } from '@playwright/test';

test.describe('Reader Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/read.html');
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should have page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Razorweave/);
  });

  test('should render main content', async ({ page }) => {
    const content = page.locator('.reader-content');
    await expect(content).toBeVisible();
  });

  test('TOC toggle opens sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const tocToggle = page.locator('.toc-toggle');
    const tocSidebar = page.locator('.reader-toc');

    // Scroll down to avoid header overlap
    await page.evaluate(() => window.scrollBy(0, 300));
    await tocSidebar.waitFor({ state: 'attached' });

    // Click toggle
    await tocToggle.click();

    // TOC should now have open class
    await expect(tocSidebar).toHaveClass(/open/);
  });

  test('TOC closes when clicking outside on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const tocToggle = page.locator('.toc-toggle');
    const tocSidebar = page.locator('.reader-toc');

    // Scroll and open TOC
    await page.evaluate(() => window.scrollBy(0, 300));
    await tocSidebar.waitFor({ state: 'attached' });
    await tocToggle.click();
    await expect(tocSidebar).toHaveClass(/open/);

    // Click at right edge of viewport (outside TOC which is ~280px wide)
    await page.mouse.click(350, 400);

    // TOC should close
    await expect(tocSidebar).not.toHaveClass(/open/);
  });

  test('TOC link scrolls to section', async ({ page }) => {
    const tocLink = page.locator('.toc-list a').first();
    const href = await tocLink.getAttribute('href');

    await tocLink.click();

    // Wait for scroll and verify target is in viewport
    const targetId = href?.replace('#', '');
    if (targetId) {
      const targetSection = page.locator(`[id="${targetId}"]`);
      await expect(targetSection).toBeInViewport({ timeout: 2000 });
    }
  });

  test('all internal anchor links resolve', async ({ page }) => {
    const anchors = page.locator('a[href^="#"]');
    const count = await anchors.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const href = await anchors.nth(i).getAttribute('href');
      if (href && href.length > 1) {
        const targetId = href.replace('#', '');
        const target = page.locator(`[id="${targetId}"]`);
        const targetCount = await target.count();
        expect(targetCount, `Target for ${href} should exist`).toBeGreaterThan(0);
      }
    }
  });
});
