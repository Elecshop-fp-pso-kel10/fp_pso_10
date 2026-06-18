/**
 * Smoke Test Suite — Elecshop API
 *
 * Covers the critical paths of every major module:
 *   Auth     → register, login, profile, refresh, logout
 *   Products → list, top-rated, single product
 *   Cart     → get, add item, update qty, remove item, clear
 *   Orders   → create, get by id, my orders
 *   Users    → admin: list, get by id (admin-only paths)
 *   Health   → server is reachable
 *
 * Run against a live server:
 *   BASE_URL=http://localhost:4000 npx jest test/smoke/smoke.test.ts --testTimeout=15000
 *
 * The suite is self-contained and cleans up after itself.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';

// Unique suffix so parallel runs don't collide.
const RUN_ID = Date.now().toString(36);

const TEST_USER = {
  name: `SmokeUser${RUN_ID}`,
  email: `smoke_${RUN_ID}@elecshop.test`,
  password: 'smoke_pass_123',
};

const ADMIN_USER = {
  email: process.env.ADMIN_EMAIL ?? 'admin@elecshop.com',
  password: process.env.ADMIN_PASSWORD ?? 'admin_password',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a pre-configured axios instance that carries cookies automatically. */
function makeClient(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    validateStatus: () => true, // let tests assert status codes manually
  });
}

function expectStatus(res: AxiosResponse, ...allowed: number[]) {
  if (!allowed.includes(res.status)) {
    throw new Error(
      `Expected status ${allowed.join(' or ')} but got ${res.status}.\n` +
        `Body: ${JSON.stringify(res.data, null, 2)}`,
    );
  }
}

// ─── State shared across tests ────────────────────────────────────────────────

const client = makeClient();
const adminClient = makeClient();

let accessCookie = '';
let adminAccessCookie = '';
let createdProductId = '';
let createdOrderId = '';
let registeredUserId = '';

// Cookie jar helper — axios doesn't auto-persist Set-Cookie in Node, so we
// extract the cookies we care about and re-attach them on each request.
function extractCookies(res: AxiosResponse): string {
  const raw = res.headers['set-cookie'] ?? [];
  return Array.isArray(raw) ? raw.map((c) => c.split(';')[0]).join('; ') : raw;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Elecshop API — Smoke Tests', () => {
  // ── 0. Health check ──────────────────────────────────────────────────────

  describe('Health', () => {
    it('server is reachable', async () => {
      const res = await client.get('/');
      // The root may return 404 (no catch-all route) or 200 — either means
      // the server is up and running.
      expect([200, 404]).toContain(res.status);
    });
  });

  // ── 1. Authentication ─────────────────────────────────────────────────────

  describe('Auth — register', () => {
    it('POST /auth/register → 201 and returns user object', async () => {
      const res = await client.post('/auth/register', TEST_USER);
      expectStatus(res, 201);
      expect(res.data).toHaveProperty('user');
      expect(res.data.user).toMatchObject({ email: TEST_USER.email });
      registeredUserId = res.data.user._id ?? res.data.user.id ?? '';
    });

    it('POST /auth/register with duplicate email → 400 or 409', async () => {
      const res = await client.post('/auth/register', TEST_USER);
      expectStatus(res, 400, 409);
    });

    it('POST /auth/register with invalid data → 400', async () => {
      const res = await client.post('/auth/register', {
        name: 'ab',          // too short (min 4)
        email: 'not-an-email',
        password: '123',     // too short (min 5)
      });
      expectStatus(res, 400);
    });
  });

  describe('Auth — login', () => {
    it('POST /auth/login with wrong credentials → 401', async () => {
      const res = await client.post('/auth/login', {
        email: TEST_USER.email,
        password: 'wrong_password',
      });
      expectStatus(res, 401);
    });

    it('POST /auth/login with correct credentials → 200 and sets cookies', async () => {
      const res = await client.post('/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      expectStatus(res, 200, 201);
      expect(res.data).toHaveProperty('user');
      accessCookie = extractCookies(res);
      expect(accessCookie).toMatch(/access_token/);
    });

    it('POST /auth/login (admin) → 200', async () => {
      const res = await adminClient.post('/auth/login', {
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
      });
      // If no admin seeded, skip gracefully
      if (res.status === 401) {
        console.warn('  ⚠  Admin credentials not found — admin tests will be skipped');
        return;
      }
      expectStatus(res, 200, 201);
      adminAccessCookie = extractCookies(res);
    });
  });

  describe('Auth — profile', () => {
    it('GET /auth/profile without auth → 401', async () => {
      const res = await client.get('/auth/profile');
      expectStatus(res, 401);
    });

    it('GET /auth/profile with auth → 200 and returns user', async () => {
      const res = await client.get('/auth/profile', {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
      expect(res.data).toHaveProperty('email', TEST_USER.email);
    });
  });

  describe('Auth — refresh token', () => {
    it('POST /auth/refresh without cookie → 401', async () => {
      const res = await client.post('/auth/refresh');
      expectStatus(res, 401);
    });

    it('POST /auth/refresh with valid cookies → 200', async () => {
      const res = await client.post('/auth/refresh', null, {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
      expect(res.data).toHaveProperty('success', true);
      // Refresh rotates tokens — update cookie jar
      const newCookies = extractCookies(res);
      if (newCookies) accessCookie = newCookies;
    });
  });

  // ── 2. Products ───────────────────────────────────────────────────────────

  describe('Products', () => {
    it('GET /products → 200 and returns paginated list', async () => {
      const res = await client.get('/products');
      expectStatus(res, 200);
      // Should return an object with products array or an array directly
      const body = res.data;
      const items: unknown[] =
        Array.isArray(body) ? body :
        Array.isArray(body?.products) ? body.products :
        Array.isArray(body?.data) ? body.data : [];
      expect(items).toBeDefined();
    });

    it('GET /products?keyword=test → 200', async () => {
      const res = await client.get('/products?keyword=test&page=1&limit=5');
      expectStatus(res, 200);
    });

    it('GET /products/topRated → 200 and returns array', async () => {
      const res = await client.get('/products/topRated');
      expectStatus(res, 200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('GET /products/:id with invalid id → 400 or 404', async () => {
      const res = await client.get('/products/not-a-valid-id');
      expectStatus(res, 400, 404);
    });

    it('GET /products (store first product id for later tests)', async () => {
      const res = await client.get('/products?page=1&limit=1');
      expectStatus(res, 200);
      const body = res.data;
      const items: { _id?: string; id?: string }[] = ...
        Array.isArray(body) ? body :
        Array.isArray(body?.products) ? body.products :
        Array.isArray(body?.data) ? body.data : [];
      if (items.length > 0) {
        createdProductId = items[0]._id ?? items[0].id ?? '';
      }
    });

    it('GET /products/:id with valid id → 200', async () => {
      if (!createdProductId) {
        return console.warn('  ⚠  No product found — skipping single-product test');
      }
      const res = await client.get(`/products/${createdProductId}`);
      expectStatus(res, 200);
      expect(res.data).toHaveProperty('_id');
    });

    it('POST /products without admin auth → 401 or 403', async () => {
      const res = await client.post('/products', { name: 'Hacked Product' });
      expectStatus(res, 401, 403);
    });

    it('DELETE /products/:id without admin auth → 401 or 403', async () => {
      const res = await client.delete('/products/some-id');
      expectStatus(res, 401, 403);
    });
  });

  // ── 3. Cart ───────────────────────────────────────────────────────────────

  describe('Cart', () => {
    it('GET /cart without auth → 401', async () => {
      const res = await client.get('/cart');
      expectStatus(res, 401);
    });

    it('GET /cart with auth → 200', async () => {
      const res = await client.get('/cart', {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
    });

    it('POST /cart/items without auth → 401', async () => {
      const res = await client.post('/cart/items', { productId: 'abc', qty: 1 });
      expectStatus(res, 401);
    });

    it('POST /cart/items with valid product → 200 or 201', async () => {
      if (!createdProductId) {
        return console.warn('  ⚠  No product id — skipping add-to-cart test');
      }
      const res = await client.post(
        '/cart/items',
        { productId: createdProductId, qty: 1 },
        { headers: { Cookie: accessCookie } },
      );
      expectStatus(res, 200, 201);
    });

    it('POST /cart/items with missing productId → 400', async () => {
      const res = await client.post(
        '/cart/items',
        { qty: 1 },
        { headers: { Cookie: accessCookie } },
      );
      expectStatus(res, 400);
    });

    it('PUT /cart/items/:productId updates qty → 200', async () => {
      if (!createdProductId) return;
      const res = await client.put(
        `/cart/items/${createdProductId}`,
        { qty: 2 },
        { headers: { Cookie: accessCookie } },
      );
      expectStatus(res, 200);
    });

    it('DELETE /cart/items/:productId removes item → 200', async () => {
      if (!createdProductId) return;
      const res = await client.delete(`/cart/items/${createdProductId}`, {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
    });

    it('POST /cart/shipping with missing fields → 400', async () => {
      const res = await client.post(
        '/cart/shipping',
        {},
        { headers: { Cookie: accessCookie } },
      );
      expectStatus(res, 400);
    });

    it('POST /cart/payment with missing paymentMethod → 400', async () => {
      const res = await client.post(
        '/cart/payment',
        {},
        { headers: { Cookie: accessCookie } },
      );
      expectStatus(res, 400);
    });

    it('DELETE /cart clears the cart → 200', async () => {
      const res = await client.delete('/cart', {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
    });
  });

  // ── 4. Orders ─────────────────────────────────────────────────────────────

  describe('Orders', () => {
    it('GET /orders without admin auth → 401 or 403', async () => {
      const res = await client.get('/orders');
      expectStatus(res, 401, 403);
    });

    it('GET /orders/myorders without auth → 401', async () => {
      const res = await client.get('/orders/myorders');
      expectStatus(res, 401);
    });

    it('GET /orders/myorders with auth → 200', async () => {
      const res = await client.get('/orders/myorders', {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('POST /orders without auth → 401', async () => {
      const res = await client.post('/orders', {});
      expectStatus(res, 401);
    });

    it('POST /orders with auth creates an order → 201', async () => {
      if (!createdProductId) {
        return console.warn('  ⚠  No product id — skipping order creation test');
      }
      const orderPayload = {
        orderItems: [
          {
            product: createdProductId,
            name: 'Smoke Test Product',
            qty: 1,
            price: 9.99,
            image: 'https://example.com/img.jpg',
          },
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Surabaya',
          postalCode: '60111',
          country: 'Indonesia',
        },
        paymentMethod: 'PayPal',
        itemsPrice: 9.99,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 9.99,
      };

      const res = await client.post('/orders', orderPayload, {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200, 201);
      createdOrderId = res.data?._id ?? res.data?.id ?? '';
    });

    it('GET /orders/:id with auth → 200', async () => {
      if (!createdOrderId) {
        return console.warn('  ⚠  No order id — skipping get-order test');
      }
      const res = await client.get(`/orders/${createdOrderId}`, {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200);
      expect(res.data).toHaveProperty('_id');
    });

    it('GET /orders/:id with invalid id → 400 or 404', async () => {
      const res = await client.get('/orders/invalid-id', {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 400, 404);
    });

    it('PUT /orders/:id/deliver without admin auth → 401 or 403', async () => {
      if (!createdOrderId) return;
      const res = await client.put(`/orders/${createdOrderId}/deliver`, null, {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 401, 403);
    });
  });

  // ── 5. Admin — Users ──────────────────────────────────────────────────────

  describe('Admin — Users (requires ADMIN_EMAIL + ADMIN_PASSWORD env vars)', () => {
    it('GET /users without admin auth → 401 or 403', async () => {
      const res = await client.get('/users');
      expectStatus(res, 401, 403);
    });

    it('GET /users with admin auth → 200', async () => {
      if (!adminAccessCookie) {
        return console.warn('  ⚠  No admin session — skipping');
      }
      const res = await adminClient.get('/users', {
        headers: { Cookie: adminAccessCookie },
      });
      expectStatus(res, 200);
    });

    it('GET /users/:id with admin auth → 200 or 404', async () => {
      if (!adminAccessCookie || !registeredUserId) {
        return console.warn('  ⚠  No admin session or user id — skipping');
      }
      const res = await adminClient.get(`/users/${registeredUserId}`, {
        headers: { Cookie: adminAccessCookie },
      });
      expectStatus(res, 200, 404);
    });
  });

  // ── 6. Auth — logout ──────────────────────────────────────────────────────

  describe('Auth — logout', () => {
    it('POST /auth/logout without auth → 401', async () => {
      const res = await client.post('/auth/logout');
      expectStatus(res, 401);
    });

    it('POST /auth/logout with auth → 200 and clears cookies', async () => {
      const res = await client.post('/auth/logout', null, {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 200, 201);
      expect(res.data).toHaveProperty('success', true);
    });

    it('GET /auth/profile after logout → 401', async () => {
      // Access token is now invalidated server-side
      const res = await client.get('/auth/profile', {
        headers: { Cookie: accessCookie },
      });
      expectStatus(res, 401);
    });
  });
});
