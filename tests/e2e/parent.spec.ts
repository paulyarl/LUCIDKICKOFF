import { test, expect } from '@playwright/test'

const routes = [
  '/parent',
  '/parent/assign',
  '/parent/link',
  '/parent/privacy',
  '/parent/time-limits',
  '/parent/activity',
  '/parent/child/123'
]

test.describe('Parent area routes', () => {
  for (const route of routes) {
    test(`navigates to ${route}`, async ({ page }) => {
      const resp = await page.goto(route)
      // Route should respond (may redirect to auth depending on env)
      expect(resp).not.toBeNull()
      // Basic sanity: page renders some content
      const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false)
      expect(hasHeading).toBeTruthy()
    })
  }
})
