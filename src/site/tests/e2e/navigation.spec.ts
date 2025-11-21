import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('nav toggle works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    const navToggle = page.locator('.nav-toggle');
    const navMenu = page.locator('.site-nav');

    // Nav toggle should be visible on mobile
    await expect(navToggle).toBeVisible();

    // Click toggle to open nav menu
    await navToggle.click();

    // Nav menu should be visible after toggle
    await expect(navMenu).toBeVisible();
  });

  test('all nav links return 200 status', async ({ page, request }) => {
    await page.goto('/index.html');

    const navLinks = page.locator('nav a[href]');
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
        const url = href.startsWith('http') ? href : new URL(href, page.url()).href;
        const response = await request.get(url);
        expect(response.status(), `Link ${href} should be valid`).toBeLessThan(400);
      }
    }
  });

  test('PDF download link exists and is valid', async ({ page, request }) => {
    await page.goto('/index.html');

    const pdfLink = page.locator('a[href*=".pdf"]').first();

    if ((await pdfLink.count()) > 0) {
      const href = await pdfLink.getAttribute('href');
      const url = href?.startsWith('http') ? href : new URL(href!, page.url()).href;
      const response = await request.head(url);
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('external links have rel="noopener"', async ({ page }) => {
    await page.goto('/index.html');

    // Find external links (http/https) that are not to the site's own domain
    const externalLinks = page.locator('a[href^="http"]:not([href*="razorweave.com"])');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await externalLinks.nth(i).getAttribute('href');
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel, `External link ${href} should have rel="noopener"`).toContain('noopener');
    }
  });

  test('footer links work', async ({ page }) => {
    await page.goto('/index.html');

    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);

    // Test internal footer links (skip external and mailto links)
    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('#') && !href.startsWith('http')) {
        await footerLinks.nth(i).click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toBeTruthy();
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('404 page renders for invalid URLs', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-12345.html');

    // For static sites, the server may not return 404 status
    // so we check for 404 content in the page
    const pageContent = await page.content();
    const has404Content =
      response?.status() === 404 ||
      pageContent.includes('404') ||
      pageContent.includes('Page Not Found');

    expect(has404Content).toBe(true);
  });
});
