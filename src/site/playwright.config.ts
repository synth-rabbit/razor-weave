import { defineConfig, devices } from '@playwright/test';

// Use BASE_URL env var for health checks against live site, otherwise localhost
const baseURL = process.env.BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Only start local server if not testing against external BASE_URL
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm build && pnpm exec live-server dist --port=4173 --no-browser',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  snapshotPathTemplate: '{testDir}/visual/snapshots/{projectName}/{testFilePath}/{arg}{ext}',
});
