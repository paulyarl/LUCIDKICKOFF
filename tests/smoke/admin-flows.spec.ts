import { test, expect } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv({ path: path.resolve(__dirname, '../../.env.local') });
loadEnv({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || 'Admin123!';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// @supabase/ssr splits oversized session cookies into <name>.0, .1, …
const COOKIE_CHUNK = 3180;

// /dev/impersonate is production-gated (S4.5) — sign in by injecting the
// sb-<ref>-auth-token cookie directly, same as scripts/sync-e2e.cjs.
async function signInAsAdmin(page) {
  test.skip(!SUPABASE_URL || !ANON_KEY, 'Supabase env vars not configured');
  const res = await page.request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const session = await res.json();
  test.skip(!session.access_token, 'Admin login failed — check DEMO_ADMIN_* env vars');

  const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
  const name = `sb-${ref}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(session), 'utf8').toString('base64')}`;
  const domain = new URL(process.env.E2E_BASE_URL || 'http://localhost:3000').hostname;

  const count = Math.max(1, Math.ceil(value.length / COOKIE_CHUNK));
  const cookies = Array.from({ length: count }, (_, i) => ({
    name: count === 1 ? name : `${name}.${i}`,
    value: value.slice(i * COOKIE_CHUNK, (i + 1) * COOKIE_CHUNK),
    domain,
    path: '/',
  }));
  await page.context().addCookies(cookies);
  await page.goto('/admin');
}

test.describe('Admin dashboard smoke', () => {
  test('admin can navigate to parents and children pages', async ({ page }) => {
    await signInAsAdmin(page);

    // Admin landing
    await expect(page.getByRole('heading', { name: 'Admin', exact: true }).first()).toBeVisible();
    await expect(page.locator('a[href="/admin/parents"]')).toBeVisible();
    await expect(page.locator('a[href="/admin/children"]')).toBeVisible();

    // Parents list
    await page.click('a[href="/admin/parents"]');
    await expect(page.getByRole('heading', { name: /Parents/i })).toBeVisible();

    // Children list
    await page.goto('/admin/children');
    await expect(page.getByRole('heading', { name: /Children/i })).toBeVisible();
  });

  test('admin can open a parent detail page if a parent exists', async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto('/admin/parents');

    const manageLinks = page.getByRole('link', { name: /Manage/i });
    const count = await manageLinks.count();
    test.skip(count === 0, 'No parents found to manage');

    if (count > 0) {
      await manageLinks.first().click();
      await expect(page.getByRole('heading', { name: /Parent/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Link a Child/i })).toBeVisible();
    }
  });
});
