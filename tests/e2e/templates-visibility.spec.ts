import { test, expect } from '@playwright/test'

/**
 * E2E skeletons for entitlement-gated template visibility.
 * These are marked as skipped by default to avoid CI flakiness until fixtures are in place.
 *
 * Pre-reqs (recommended):
 * - Use /dev/impersonate to sign in quickly in dev (see docs/TEST_ACCOUNTS.md)
 * - Seed users parent@lucid.com, child@lucid.com and grant entitlements via SQL
 * - Create three templates in Admin → Templates: Free, Premium Generic, Premium Gold
 */

test.describe.skip('Templates visibility by entitlement (skeleton)', () => {
  const libraryUrl = '/child/library'

  async function signInAs(page: any, email: string, password: string) {
    // Prefer dev impersonation if available
    await page.goto('/dev/impersonate')
    const exists = await page.getByRole('heading').first().isVisible().catch(() => false)
    if (exists) {
      await page.getByLabel('Email').fill(email)
      await page.getByLabel('Password').fill(password)
      await page.getByRole('button', { name: /sign in/i }).click()
      await page.waitForLoadState('networkidle')
      return
    }

    // Fallback: go to normal sign-in flow (update selectors if your auth UI differs)
    await page.goto('/sign-in')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForLoadState('networkidle')
  }

  test('Anonymous sees only free templates', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto(libraryUrl)
    // TODO: assert premium items are not present. Replace selectors with your UI markers.
    // Example:
    // await expect(page.getByTestId('template-card-premium-gold')).toBeHidden()
  })

  test('Authenticated without entitlements sees only free templates', async ({ page }) => {
    await signInAs(page, 'noentitlements@lucid.com', 'changeme') // TODO: create this test user
    await page.goto(libraryUrl)
    // TODO: assert only free items visible
  })

  test('User with any entitlement sees premium-generic templates', async ({ page }) => {
    await signInAs(page, 'child@lucid.com', 'changeme') // granted some entitlement (e.g., silver)
    await page.goto(libraryUrl)
    // TODO: assert premium-generic items visible
  })

  test('User with specific entitlement sees those specific premium templates', async ({ page }) => {
    await signInAs(page, 'parent@lucid.com', 'changeme') // granted gold entitlement
    await page.goto(libraryUrl)
    // TODO: assert premium-gold items visible
  })

  test('Admin sees all templates', async ({ page }) => {
    await signInAs(page, 'admin@lucid.com', 'changeme')
    await page.goto(libraryUrl)
    // TODO: assert free + premium-generic + premium-specific visible
  })
})
