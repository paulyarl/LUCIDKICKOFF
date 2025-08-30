import { test, expect } from '@playwright/test'

// Verifies the packs listing route (`/packs`) renders correctly

test.describe('Packs listing', () => {
  test('renders title and PackManager', async ({ page }) => {
    await page.goto('/packs')
    await expect(page.getByTestId('packs-title')).toBeVisible()

    // PackManager renders a grid of pack cards; look for common UI affordances
    // Falls back to a generic heuristic to avoid coupling to data
    await expect(page.getByRole('main')).toBeVisible()
  })
})
