import { test, expect } from '@playwright/test'

// Acceptance: Packs Grid -> Cover -> Swipe Carousel with CTAs
// Routes exercised:
// - /pack
// - /pack/basics/cover
// - /pack/basics
// - /learn/lesson/line-control-1
// - /learn/lesson/line-control-1/run (Quick Start)
// - /tutorial/friendly-lion
// - /tutorial/friendly-lion/run (Quick Start)

test.describe('Packs flow', () => {
  test('Grid -> Cover -> Carousel and CTAs', async ({ page }) => {
    // Grid
    await page.goto('/pack')
    await expect(page.getByRole('heading', { name: 'Packs' })).toBeVisible()

    // Click Basics Pack card
    await page.getByRole('link', { name: /Basics Pack/i }).click()

    // Cover
    await expect(page).toHaveURL(/\/pack\/basics\/cover$/)
    await expect(page.getByRole('heading', { name: /basics cover/i })).toBeVisible()

    // CTAs on cover
    await expect(page.getByRole('link', { name: 'Study' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Tutorial' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explore Pack' })).toBeVisible()

    // Navigate to carousel
    await page.getByRole('link', { name: 'Explore Pack' }).click()

    // Carousel
    await expect(page).toHaveURL(/\/pack\/basics$/)
    await expect(page.getByTestId('pack-carousel')).toBeVisible()
    await expect(page.getByRole('heading', { name: /basics pack/i })).toBeVisible()

    // Slide 1: Lesson
    await expect(page.getByRole('heading', { name: /line control i/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Study Lesson' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quick Start' })).toBeVisible()

    // Go to next slide using Next control
    const nextBtn = page.getByRole('button', { name: 'Next' })
    await nextBtn.click()

    // Slide 2: Tutorial
    await expect(page.getByRole('heading', { name: /friendly lion/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Tutorial' }).or(page.getByRole('link', { name: 'Start Tutorial' }))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quick Start' })).toBeVisible()

    // Quick Start tutorial goes to /run
    await page.getByRole('button', { name: 'Quick Start' }).click()
    await expect(page).toHaveURL(/\/tutorial\/friendly-lion\/run$/)
    await expect(page.getByTestId('tutorial-runner')).toBeVisible()

    // Back to carousel and quick start lesson
    await page.goBack()
    await expect(page.getByTestId('pack-carousel')).toBeVisible()
    // go to previous slide
    await page.getByRole('button', { name: 'Previous' }).click()
    await page.getByRole('button', { name: 'Quick Start' }).click()
    await expect(page).toHaveURL(/\/learn\/lesson\/line-control-1\/run$/)
    await expect(page.getByTestId('lesson-runner')).toBeVisible()
  })
})
