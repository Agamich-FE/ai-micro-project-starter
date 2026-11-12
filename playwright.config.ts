import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests run on the host against the DDEV site.
 *
 * Override the site with BASE_URL, e.g. BASE_URL=https://example.ddev.site.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://ls-events.ddev.site',
    // DDEV uses a local CA that the Playwright browser does not trust.
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
