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

  test('chapter anchor links resolve', async ({ page }) => {
    // Test chapter-specific anchors (skip part-* IDs which are TOC-only)
    const anchors = page.locator('a[href^="#ch-"]');
    const count = await anchors.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await anchors.nth(i).getAttribute('href');
      if (href && href.length > 1) {
        const targetId = href.replace('#', '');
        const target = page.locator(`[id="${targetId}"]`);
        const targetCount = await target.count();
        expect(targetCount, `Target for ${href} should exist`).toBeGreaterThan(0);
      }
    }
  });

  test.describe('Bookmarks', () => {
    test('bookmark buttons are rendered', async ({ page }) => {
      // Look for bookmark buttons near headings
      const bookmarkBtn = page.locator('.bookmark-btn');
      const count = await bookmarkBtn.count();

      // There should be bookmark buttons on headings
      expect(count).toBeGreaterThan(0);
    });

    test('headings have scroll-margin-top for navigation', async ({ page }) => {
      // Verify CSS scroll-margin-top is applied for navigation
      const heading = page.locator('.reader-content h2[id]').first();

      if (await heading.count() > 0) {
        const scrollMargin = await heading.evaluate((el) => {
          return window.getComputedStyle(el).scrollMarginTop;
        });

        // Should have scroll margin to account for fixed header
        expect(scrollMargin).not.toBe('0px');
      }
    });

    test('hash navigation works', async ({ page }) => {
      // First get a valid chapter ID from the TOC
      await page.goto('/read.html');
      await page.waitForLoadState('networkidle');

      const firstChapterLink = page.locator('.toc-list a[href^="#ch-"]').first();
      const href = await firstChapterLink.getAttribute('href');

      if (href) {
        // Navigate with hash
        await page.goto(`/read.html${href}`);
        await page.waitForTimeout(500);

        // Either scrolled or target visible
        const scrollY = await page.evaluate(() => window.scrollY);
        const targetVisible = await page.locator(`[id="${href.replace('#', '')}"]`).isVisible();
        expect(scrollY > 0 || targetVisible).toBe(true);
      }
    });
  });
});
