import { test, expect } from '@playwright/test'

const routes = [
  '/child',
  '/child/library',
  '/child/link'
]

test.describe('Child area routes', () => {
  for (const route of routes) {
    test(`navigates to ${route}`, async ({ page }) => {
      const resp = await page.goto(route)
      expect(resp).not.toBeNull()
      const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false)
      expect(hasHeading).toBeTruthy()
    })
  }
})
