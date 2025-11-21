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
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const tocToggle = page.locator('.toc-toggle');
    const tocSidebar = page.locator('.reader-toc');

    // Wait for TOC sidebar to be attached to DOM
    await expect(tocSidebar).toBeAttached();

    // TOC should not have 'open' class initially on mobile
    // (it's positioned off-screen with left: -300px, not hidden)
    await expect(tocSidebar).not.toHaveClass(/open/);

    // Scroll down significantly to avoid pointer interception by breadcrumb element
    await page.evaluate(() => window.scrollBy(0, 300));

    // Click toggle to open TOC sidebar
    await tocToggle.click();

    // TOC should now have 'open' class
    await expect(tocSidebar).toHaveClass(/open/);
  });

  test('TOC closes when clicking outside on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const tocToggle = page.locator('.toc-toggle');
    const tocSidebar = page.locator('.reader-toc');
    const readerContent = page.locator('.reader-content');

    // Wait for TOC sidebar to be attached to DOM
    await expect(tocSidebar).toBeAttached();

    // Scroll down significantly to avoid pointer interception by breadcrumb element
    await page.evaluate(() => window.scrollBy(0, 300));

    // Open TOC
    await tocToggle.click();
    await expect(tocSidebar).toHaveClass(/open/);

    // Click outside the TOC on the reader content area
    await readerContent.click();

    // TOC should close (lose 'open' class)
    await expect(tocSidebar).not.toHaveClass(/open/);
  });

  test('TOC link scrolls to section', async ({ page }) => {
    // Click a TOC link
    const tocLink = page.locator('.toc-list a').first();
    const href = await tocLink.getAttribute('href');

    await tocLink.click();

    // Verify target section is in viewport using condition-based waiting
    const targetId = href?.replace('#', '');
    if (targetId) {
      const targetSection = page.locator(`#${targetId}`);
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
