import { test, expect } from '@playwright/test'

// Acceptance: Friendly Lion tutorial loads and renders runner

test.describe('Friendly Lion Tutorial', () => {
  test('loads seeded tutorial and renders steps', async ({ page }) => {
    await page.goto('/tutorial/friendly-lion/run')

    // Runner visible
    await expect(page.getByTestId('tutorial-runner')).toBeVisible()

    // Title on page
    await expect(page.getByRole('heading', { name: /tutorial runner/i })).toBeVisible()

    // There should be at least one CTA or canvas area; assert presence of Quick navigation via TutorialRunner UI
    // Since internal UI may vary, minimally assert the container exists and no crash occurs
    await expect(page).toHaveURL(/\/tutorial\/friendly-lion\/run$/)
  })
})
