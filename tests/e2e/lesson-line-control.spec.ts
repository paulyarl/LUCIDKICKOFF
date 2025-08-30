import { test, expect } from '@playwright/test'

// Acceptance: Line Control 1 lesson entry + run page

test.describe('Lesson: Line Control 1', () => {
  test('entry page shows metadata and Start CTA', async ({ page }) => {
    await page.goto('/learn/lesson/line-control-1')

    await expect(page.getByRole('heading', { name: /line control/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start lesson/i })).toBeVisible()

    await page.getByRole('button', { name: /start lesson/i }).click()
    await expect(page).toHaveURL(/\/learn\/lesson\/line-control-1\/run$/)
  })

  test('run page renders runner container', async ({ page }) => {
    await page.goto('/learn/lesson/line-control-1/run')
    await expect(page.getByTestId('lesson-runner')).toBeVisible()
    await expect(page.getByRole('heading', { name: /lesson runner/i })).toBeVisible()
  })
})
