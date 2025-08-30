import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || 'Admin123!';

async function signInAsAdmin(page) {
  await page.goto('/dev/impersonate');
  await expect(page.getByRole('heading', { name: /Impersonate/i })).toBeVisible();
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Sign In/i }).click();
  // Navigate directly to admin after auth
  await page.goto('/admin');
}

test.describe('Admin dashboard smoke', () => {
  test('admin can navigate to parents and children pages', async ({ page }) => {
    await signInAsAdmin(page);

    // Admin landing
    await expect(page.getByRole('navigation', { name: /Admin/i })).toBeVisible();
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
