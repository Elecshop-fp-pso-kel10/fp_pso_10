import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Elecshop Web smoke tests.
 *
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/smoke',
  testMatch: '**/*.spec.ts',

  /* Run tests serially — smoke tests share login state */
  fullyParallel: false,
  workers: 1,

  /* Retry once on CI to handle flaky network */
  retries: process.env.CI ? 1 : 0,

  /* Reporter */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    /* Base URL — override with WEB_URL env var */
    baseURL: process.env.WEB_URL ?? 'http://localhost:3000',

    /* Collect trace on failure */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    /* Reasonable timeouts */
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* Uncomment to also run on Firefox and Safari:
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],

  /* Optionally start the web server automatically in CI:
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  */
});
