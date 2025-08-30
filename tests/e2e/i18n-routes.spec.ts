import { test, expect } from '@playwright/test'

// Core app routes to verify language switching awareness
const routes = [
  '/',
  // Parent area
  '/parent',
  '/parent/assign',
  '/parent/link',
  '/parent/privacy',
  '/parent/time-limits',
  '/parent/activity',
  '/parent/child/123',
  // Child area
  '/child',
  '/child/library',
  '/child/link',
  // Admin
  '/admin/author',
  '/admin/local-overrides',
  // Additional user-facing pages
  '/packs',
  '/pack/test',
  '/category',
  '/settings',
  '/dashboard',
  '/profile',
  '/library',
  '/community',
  '/offline',
  // Learning routes (use a valid example id/slug if required by the page)
  '/tutorial/friendly-lion'
]

test.describe('i18n: language awareness across routes', () => {
  for (const route of routes) {
    test(`switches language on ${route} and persists`, async ({ page }) => {
      await page.goto(route)

      // Verify default lang
      await expect(page.locator('html')).toHaveAttribute('lang', /en|es|sw|fr/)

      // Click ES, then FR in LanguageSwitcher
      // Uses aria-label="Language selector" from the component
      const group = page.getByRole('group', { name: 'Language selector' })
      await group.getByRole('button', { name: 'ES' }).click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')

      await group.getByRole('button', { name: 'FR' }).click()
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

      // Ensure persistence across reload
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr')

      // Ensure localStorage flag is set
      const stored = await page.evaluate(() => localStorage.getItem('lc_lang'))
      expect(stored).toBe('fr')
    })
  }
})
