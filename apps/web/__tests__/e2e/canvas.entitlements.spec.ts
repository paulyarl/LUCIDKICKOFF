import { test, expect } from '@playwright/test';

// Guest flow: should open TemplatePicker and show either free templates or mock templates fallback
// We assert the mock title to be robust when DB has no free templates locally.

test.describe('Canvas TemplatePicker - guest', () => {
  test('opens and shows some templates (mock fallback ok)', async ({ page }) => {
    await page.goto('/canvas');

    // Click "Choose Template" button in top bar
    const chooseBtn = page.getByRole('button', { name: /choose template/i });
    await expect(chooseBtn).toBeVisible();
    await chooseBtn.click();

    // Dialog should appear; expect a known mock template title to be present in guest mode when no DB entries
    await expect(page.getByRole('dialog')).toBeVisible();

    // Either free templates from DB or fallbacks. We look for a known mock title.
    const mockCandidate = page.getByText(/Circle Outline|Star Outline|Heart Outline/);
    await expect(mockCandidate).toBeVisible();
  });
});
