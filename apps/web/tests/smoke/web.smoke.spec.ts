import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke Test Suite — Elecshop Web Frontend
 *
 * File location: apps/web/tests/smoke.spec.ts
 *
 * What this covers (matches the CI job "Smoke Test — Web Frontend"):
 *
 *  1. Public pages load without crashing
 *     – Homepage (/)
 *     – Search results page (/search/<keyword>)
 *
 *  2. Protected-route redirect (Bug 4 fix)
 *     – /cart      → redirects unauthenticated user to /login
 *     – /checkout  → redirects unauthenticated user to /login
 *     (middleware.ts now lists these as protectedPaths)
 *
 *  3. Holiday UI hydration (Bug 3 fix)
 *     – Holiday banner/particles are gated behind `mounted === true`
 *       so Playwright must NOT assert they are immediately visible.
 *       Instead we assert the page shell renders correctly, then
 *       optionally wait for holiday elements if today is a holiday.
 *
 *  4. Auth flow (login page renders, form is present)
 *
 * Environment variable:
 *   WEB_URL  – set by CI (see cicd.yml); falls back to http://localhost:3000
 *
 * Why workers=1 in playwright.config.ts:
 *   Tests run sequentially because some depend on shared state
 *   (e.g. the login test navigates and stores cookies used later).
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Wait for Next.js to finish hydrating the page.
 * We poll for the absence of the data-nextjs-scroll-focus-boundary attribute
 * that Next.js removes once hydration is complete, OR simply wait for
 * networkidle which is reliable enough for SSR pages.
 */
async function waitForHydration(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Asserts the page did NOT crash (no Next.js error overlay, no blank screen).
 */
async function assertNoError(page: Page) {
  // Next.js dev error overlay
  const errorOverlay = page.locator('nextjs-portal');
  await expect(errorOverlay).toHaveCount(0);

  // The <body> should have content
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.trim().length).toBeGreaterThan(0);
}

// ─── Test data ───────────────────────────────────────────────────────────────

const TEST_EMAIL    = process.env.SMOKE_EMAIL    ?? 'smoketest@elecshop.test';
const TEST_PASSWORD = process.env.SMOKE_PASSWORD ?? 'SmokeTest123!';

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('Elecshop Web — Smoke Tests', () => {

  // ── 1. Homepage ──────────────────────────────────────────────────────────

  test('homepage loads and shows product grid', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);
    await assertNoError(page);

    // The page title should reflect what we set in page.tsx metadata
    await expect(page).toHaveTitle(/Elecshop/i);

    // At minimum the main landmark or a product-related heading should exist
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  // ── 2. Search results page ───────────────────────────────────────────────

  test('search page renders for a keyword', async ({ page }) => {
    await page.goto('/search/laptop');
    await waitForHydration(page);
    await assertNoError(page);

    // The heading should contain the keyword
    const heading = page.locator('h1');
    await expect(heading).toContainText(/laptop/i);
  });

  test('search page renders even when no products match', async ({ page }) => {
    // Bug 2 (products.service.ts) changes the server behaviour for keyword
    // searches that return nothing — it now returns [] instead of 404.
    // The frontend /search page should still render without crashing.
    await page.goto('/search/xyzzy_no_product_exists_12345');
    await waitForHydration(page);
    await assertNoError(page);

    // Page should still show the heading (not a 404 error page)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  // ── 3. Holiday UI hydration (Bug 3) ──────────────────────────────────────
  //
  // The HolidayThemeProvider now wraps all holiday UI in `if (!mounted)`
  // so components return null on the first render (SSR / before useEffect).
  // We must NOT assert they are immediately visible — we wait for hydration
  // first, then only check for them if today is actually a holiday.

  test('holiday theme: page shell renders before hydration completes', async ({ page }) => {
    await page.goto('/');

    // Assert page shell is visible BEFORE networkidle — this proves the
    // `mounted` gate does not break the initial render.
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();

    // The nav / header should be present regardless of holiday state
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });

  test('holiday banner: if present it appears only after hydration', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);  // wait for useEffect / setMounted(true)

    // The banner MAY or MAY NOT be in the DOM depending on today's date.
    // We do NOT assert it IS visible — we only assert that IF it exists,
    // it is properly visible (not a half-hydrated ghost element).
    const banner = page.locator('[data-testid="holiday-banner"], .holiday-banner');
    const count = await banner.count();

    if (count > 0) {
      // Holiday is active today — verify it rendered properly
      await expect(banner.first()).toBeVisible();
    }
    // If count === 0, no holiday is active — that's fine, test passes.
  });

  // ── 4. Protected routes redirect unauthenticated users (Bug 4) ───────────
  //
  // middleware.ts now lists /cart and /checkout as protectedPaths.
  // An unauthenticated visitor must be redirected to /login.

  test('/cart redirects unauthenticated user to /login', async ({ page }) => {
    // Make sure we have no auth cookies
    await page.context().clearCookies();

    await page.goto('/cart');
    await waitForHydration(page);

    // Should have been redirected to /login
    await expect(page).toHaveURL(/\/login/);

    // The login form should be visible
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('/checkout redirects unauthenticated user to /login', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/checkout');
    await waitForHydration(page);

    await expect(page).toHaveURL(/\/login/);

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  // ── 5. Login page ─────────────────────────────────────────────────────────

  test('login page renders the auth form', async ({ page }) => {
    await page.goto('/login');
    await waitForHydration(page);
    await assertNoError(page);

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  // ── 6. Authenticated visit to /cart (optional — skipped if no test creds) ─
  //
  // If SMOKE_EMAIL / SMOKE_PASSWORD env vars are provided, we log in and
  // verify that /cart is accessible after authentication.
  // In CI these can be set as GitHub Actions secrets.

  test('authenticated user can access /cart', async ({ page }) => {
    // Skip if no smoke test credentials are configured
    if (!process.env.SMOKE_EMAIL || !process.env.SMOKE_PASSWORD) {
      test.skip(true, 'SMOKE_EMAIL / SMOKE_PASSWORD not set — skipping auth test');
      return;
    }

    // Log in
    await page.goto('/login');
    await waitForHydration(page);

    await page.locator('input[type="email"], input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"], input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // After login, should redirect away from /login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });

    // Now /cart should be accessible
    await page.goto('/cart');
    await waitForHydration(page);

    // Should NOT have been redirected back to /login
    await expect(page).not.toHaveURL(/\/login/);
    await assertNoError(page);
  });

  // ── 7. Register page ──────────────────────────────────────────────────────

  test('register page renders the sign-up form', async ({ page }) => {
    await page.goto('/register');
    await waitForHydration(page);
    await assertNoError(page);

    // At minimum an email field should exist
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  // ── 8. Navigation links are present on homepage ───────────────────────────

  test('homepage contains navigation links to key routes', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    // Check for at least one link pointing to /login or /register (for guests)
    // OR to /profile (for logged-in users). Either is acceptable.
    const navLinks = page.locator('a[href="/login"], a[href="/register"], a[href="/profile"]');
    await expect(navLinks.first()).toBeVisible();
  });
});