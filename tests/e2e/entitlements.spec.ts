import { test, expect } from '@playwright/test'

// These tests validate client-side entitlement storage wiring at a high level.
// They avoid app-specific assumptions by only asserting successful render.

test.describe('Entitlements storage and basic navigation', () => {
  test('guest view (no entitlements) loads child library', async ({ page }) => {
    await page.goto('/child/library')
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false)
    expect(hasHeading).toBeTruthy()
  })

  test('user entitlements in localStorage do not break navigation', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('lc_entitlements_demoUser', JSON.stringify({
        templateIds: ['tpl-101', 'tpl-202'],
        packIds: ['packA'],
        planCodes: ['pro']
      }))
    })
    const resp = await page.goto('/child/library')
    expect(resp).not.toBeNull()
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false)
    expect(hasHeading).toBeTruthy()
  })
})
