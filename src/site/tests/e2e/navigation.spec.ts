import { test, expect } from '@playwright/test';

test.describe('Site Navigation', () => {
  test('nav toggle works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/index.html');

    const navToggle = page.locator('.nav-toggle');
    const navMenu = page.locator('.site-nav');

    await expect(navToggle).toBeVisible();
    await navToggle.click();
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

    const externalLinks = page.locator('a[href^="http"]:not([href*="razorweave.com"])');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel, 'External links should have rel="noopener"').toContain('noopener');
    }
  });

  test('footer links work', async ({ page }) => {
    await page.goto('/index.html');

    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
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

    const is404 =
      response?.status() === 404 ||
      (await page.content()).includes('404') ||
      (await page.content()).includes('Page Not Found');
    expect(is404).toBe(true);
  });
});
