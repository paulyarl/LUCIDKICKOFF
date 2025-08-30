import { test, expect } from '@playwright/test'

// Basic canvas interaction smoke test
// Ensures a canvas is present and responds to pointer events without errors

test.describe('Canvas interaction', () => {
  test('lesson run page has interactive canvas', async ({ page }) => {
    await page.goto('/learn/lesson/line-control-1/run')

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    if (!box) throw new Error('No canvas bounding box')

    const x = box.x + box.width / 4
    const y = box.y + box.height / 4

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + 50, y + 25)
    await page.mouse.move(x + 100, y + 50)
    await page.mouse.up()

    // Expect still on the same page, implying no crashes occurred
    await expect(page).toHaveURL(/\/learn\/lesson\/line-control-1\/run$/)
  })
})
