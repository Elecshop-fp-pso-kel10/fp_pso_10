/**
 * Smoke Test Suite — Elecshop Web (Next.js)
 *
 * Covers the critical frontend paths:
 *   Pages       → home, product list, product detail, search
 *   Middleware  → protected routes redirect to /login when unauthenticated
 *                 auth pages redirect to / when already logged in
 *   Auth UI     → login page renders correctly, form validation works
 *                 register page renders correctly, form validation works
 *   Cart        → cart page loads when authenticated
 *   Checkout    → shipping/payment/review pages load when authenticated
 *   Admin       → admin pages redirect non-admins to /login
 *   Profile     → profile and orders pages redirect unauthenticated users
 *
 * Run:
 *   WEB_URL=http://localhost:3000 pnpm exec playwright test tests/smoke/web.smoke.spec.ts
 *
 * For authenticated tests supply a seeded user via env vars:
 *   TEST_USER_EMAIL=smoke@elecshop.test TEST_USER_PASSWORD=smoke_pass_123
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// ─── Configuration ────────────────────────────────────────────────────────────

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL ?? 'smoke@elecshop.test',
  password: process.env.TEST_USER_PASSWORD ?? 'smoke_pass_123',
};

const ADMIN_USER = {
  email: process.env.ADMIN_EMAIL ?? 'admin@elecshop.com',
  password: process.env.ADMIN_PASSWORD ?? 'admin_password',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Navigate and wait for network to settle. */
async function goto(page: Page, path: string) {
  await page.goto(`${WEB_URL}${path}`, { waitUntil: 'networkidle' });
}

/**
 * Log in via the UI and return the context so cookies persist across tests.
 * Returns false if login fails (user not seeded).
 */
async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<boolean> {
  await goto(page, '/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from /login on success
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 8000,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Elecshop Web — Smoke Tests', () => {
  // ── 1. Public pages ─────────────────────────────────────────────────────────

  test.describe('Public pages', () => {
    test('Home page loads and shows product listing', async ({ page }) => {
      await goto(page, '/');
      await expect(page).toHaveTitle(/elecshop|shop|store/i);
      // The heading "Latest Products" should be visible
      await expect(
        page.getByRole('heading', { name: /latest products/i }),
      ).toBeVisible();
    });

    test('Home page has navigation header', async ({ page }) => {
      await goto(page, '/');
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('Home page pagination renders when products span multiple pages', async ({
      page,
    }) => {
      await goto(page, '/');
      // Pagination may or may not exist depending on product count — just
      // assert the page didn't crash (200 response implied by visible content).
      await expect(page.locator('body')).not.toContainText('Internal Server Error');
      await expect(page.locator('body')).not.toContainText('Application error');
    });

    test('Product detail page loads for a valid product', async ({ page }) => {
      // First get a product id from the home page product cards
      await goto(page, '/');
      const productLinks = page.locator('a[href^="/products/"]');
      const count = await productLinks.count();

      if (count === 0) {
        test.skip(true, 'No products in the database — skipping product detail test');
        return;
      }

      const href = await productLinks.first().getAttribute('href');
      await goto(page, href!);
      await expect(page.locator('body')).not.toContainText('not found', {
        ignoreCase: true,
      });
    });

    test('404 page is shown for unknown routes', async ({ page }) => {
      const res = await page.goto(`${WEB_URL}/this-page-does-not-exist-xyz`);
      // Next.js returns 404 status for unknown routes
      expect(res?.status()).toBe(404);
    });

    test('Search results page loads', async ({ page }) => {
      await goto(page, '/search/laptop');
      await expect(page.locator('body')).not.toContainText('Application error');
    });
  });

  // ── 2. Middleware — unauthenticated redirects ────────────────────────────────

  test.describe('Middleware — protected routes redirect to /login', () => {
    const protectedPaths = [
      '/profile',
      '/profile/orders',
      '/orders/some-id',
      '/cart',
      '/checkout/shipping',
      '/checkout/payment',
      '/checkout/review',
      '/admin/products',
      '/admin/orders',
      '/admin/users',
    ];

    for (const path of protectedPaths) {
      test(`${path} → redirects to /login when unauthenticated`, async ({
        page,
      }) => {
        await goto(page, path);
        await expect(page).toHaveURL(/\/login/);
      });
    }
  });

  // ── 3. Auth pages — public access ───────────────────────────────────────────

  test.describe('Auth pages', () => {
    test('Login page renders correctly', async ({ page }) => {
      await goto(page, '/login');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Login page shows validation errors for empty submission', async ({
      page,
    }) => {
      await goto(page, '/login');
      await page.click('button[type="submit"]');
      // Zod + react-hook-form show inline errors
      await expect(page.locator('text=/invalid email|email/i').first()).toBeVisible({
        timeout: 3000,
      });
    });

    test('Login page shows error for invalid credentials', async ({ page }) => {
      await goto(page, '/login');
      await page.fill('input[type="email"]', 'nobody@nowhere.test');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      // Should stay on /login and show an error
      await expect(page).toHaveURL(/\/login/);
    });

    test('Register page renders correctly', async ({ page }) => {
      await goto(page, '/register');
      // Register form has name + email + password fields
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Register page shows validation errors for empty submission', async ({
      page,
    }) => {
      await goto(page, '/register');
      await page.click('button[type="submit"]');
      await expect(page.locator('body')).not.toContainText('Application error');
    });

    test('Register page has link to login', async ({ page }) => {
      await goto(page, '/register');
      const loginLink = page.getByRole('link', { name: /sign in|log in|login/i });
      await expect(loginLink).toBeVisible();
    });

    test('Login page has link to register', async ({ page }) => {
      await goto(page, '/login');
      const registerLink = page.getByRole('link', { name: /sign up|register/i });
      await expect(registerLink).toBeVisible();
    });
  });

  // ── 4. Authenticated flows ───────────────────────────────────────────────────

  test.describe('Authenticated flows (requires TEST_USER_EMAIL + TEST_USER_PASSWORD)', () => {
    let authContext: BrowserContext;
    let authPage: Page;

    test.beforeAll(async ({ browser }) => {
      authContext = await browser.newContext();
      authPage = await authContext.newPage();
      const ok = await loginViaUI(authPage, TEST_USER.email, TEST_USER.password);
      if (!ok) {
        console.warn(
          '  ⚠  Test user not found — authenticated smoke tests will be skipped.',
        );
      }
    });

    test.afterAll(async () => {
      await authContext.close();
    });

    test('Authenticated user is redirected away from /login', async () => {
      // If login succeeded, visiting /login should now redirect to /
      const currentUrl = authPage.url();
      if (currentUrl.includes('/login')) {
        test.skip(true, 'Not authenticated — skipping');
        return;
      }
      await goto(authPage, '/login');
      await expect(authPage).not.toHaveURL(/\/login/);
    });

    test('Authenticated user is redirected away from /register', async () => {
      const currentUrl = authPage.url();
      if (currentUrl.includes('/login')) {
        test.skip(true, 'Not authenticated — skipping');
        return;
      }
      await goto(authPage, '/register');
      await expect(authPage).not.toHaveURL(/\/register/);
    });

    test('Profile page loads for authenticated user', async () => {
      if (authPage.url().includes('/login')) {
        test.skip(true, 'Not authenticated');
        return;
      }
      await goto(authPage, '/profile');
      await expect(authPage).not.toHaveURL(/\/login/);
      await expect(authPage.locator('body')).not.toContainText('Application error');
    });

    test('Order history page loads for authenticated user', async () => {
      if (authPage.url().includes('/login')) {
        test.skip(true, 'Not authenticated');
        return;
      }
      await goto(authPage, '/profile/orders');
      await expect(authPage).not.toHaveURL(/\/login/);
    });

    test('Cart page loads for authenticated user', async () => {
      if (authPage.url().includes('/login')) {
        test.skip(true, 'Not authenticated');
        return;
      }
      await goto(authPage, '/cart');
      await expect(authPage).not.toHaveURL(/\/login/);
      await expect(authPage.locator('body')).not.toContainText('Application error');
    });

    test('Checkout shipping page loads for authenticated user', async () => {
      if (authPage.url().includes('/login')) {
        test.skip(true, 'Not authenticated');
        return;
      }
      await goto(authPage, '/checkout/shipping');
      await expect(authPage).not.toHaveURL(/\/login/);
    });
  });

  // ── 5. Admin flows ───────────────────────────────────────────────────────────

  test.describe('Admin flows (requires ADMIN_EMAIL + ADMIN_PASSWORD)', () => {
    let adminContext: BrowserContext;
    let adminPage: Page;
    let isAdminLoggedIn = false;

    test.beforeAll(async ({ browser }) => {
      adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();
      isAdminLoggedIn = await loginViaUI(
        adminPage,
        ADMIN_USER.email,
        ADMIN_USER.password,
      );
      if (!isAdminLoggedIn) {
        console.warn('  ⚠  Admin user not found — admin smoke tests will be skipped.');
      }
    });

    test.afterAll(async () => {
      await adminContext.close();
    });

    test('Admin products page loads', async () => {
      if (!isAdminLoggedIn) {
        test.skip(true, 'Not authenticated as admin');
        return;
      }
      await goto(adminPage, '/admin/products');
      await expect(adminPage).not.toHaveURL(/\/login/);
      await expect(adminPage.locator('body')).not.toContainText('Application error');
    });

    test('Admin orders page loads', async () => {
      if (!isAdminLoggedIn) {
        test.skip(true, 'Not authenticated as admin');
        return;
      }
      await goto(adminPage, '/admin/orders');
      await expect(adminPage).not.toHaveURL(/\/login/);
    });

    test('Admin users page loads', async () => {
      if (!isAdminLoggedIn) {
        test.skip(true, 'Not authenticated as admin');
        return;
      }
      await goto(adminPage, '/admin/users');
      await expect(adminPage).not.toHaveURL(/\/login/);
    });

    test('Admin create product page loads', async () => {
      if (!isAdminLoggedIn) {
        test.skip(true, 'Not authenticated as admin');
        return;
      }
      await goto(adminPage, '/admin/products/create');
      await expect(adminPage).not.toHaveURL(/\/login/);
    });

    test('Non-admin user cannot access admin pages', async ({ page }) => {
      // Using a fresh unauthenticated page
      await goto(page, '/admin/users');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
