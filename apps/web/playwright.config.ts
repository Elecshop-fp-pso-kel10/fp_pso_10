import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Elecshop Web — Smoke Tests
 *
 * File location: apps/web/playwright.config.ts
 *
 * Key decisions:
 *  - baseURL points to the staging deployment used by CI.
 *    The CI workflow passes WEB_URL as an env var; locally it
 *    falls back to http://localhost:3000.
 *  - Only Chromium is used for smoke tests (fast, no flakiness
 *    from multi-browser). Add more projects if you want coverage.
 *  - retries=1 in CI so a single network blip doesn't fail the run.
 *  - actionTimeout / navigationTimeout are generous (15 s) because
 *    the staging server on Azure cold-starts slowly.
 *  - testDir points to apps/web/tests — kept separate from src so
 *    tsconfig can exclude it (already done in tsconfig.json).
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  /* Global timeouts */
  timeout: 60_000,          // per-test hard limit
  expect: { timeout: 10_000 },

  /* How many times to retry a failing test in CI */
  retries: process.env.CI ? 1 : 0,

  /* Run tests sequentially — smoke tests depend on auth state */
  workers: 1,
  fullyParallel: false,

  /* Reporter: CI gets the GitHub-friendly reporter + HTML; local gets list */
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list']],

  use: {
    /* Base URL — set WEB_URL in CI; falls back to local dev server */
    baseURL: process.env.WEB_URL ?? 'http://localhost:3000',

    /* Generous timeouts for cold-starting staging server */
    actionTimeout:     15_000,
    navigationTimeout: 15_000,

    /* Always collect trace on first retry so failures are debuggable */
    trace: 'on-first-retry',

    /* Screenshot on failure only */
    screenshot: 'only-on-failure',

    /* Single browser for smoke tests */
    ...devices['Desktop Chrome'],
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});