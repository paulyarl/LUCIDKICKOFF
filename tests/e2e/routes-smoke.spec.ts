import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', expectText: 'Start Drawing' },
  { path: '/learn/mode', expectText: 'Choose how you want to learn' },
  { path: '/learn/lesson/line-control-1', expectText: 'checkpoints' },
  { path: '/learn/lesson/line-control-1/run', testId: 'lesson-runner' },
  { path: '/tutorial/friendly-lion', expectText: 'checkpoints' },
  { path: '/tutorial/friendly-lion/run', testId: 'tutorial-runner' },
  { path: '/pack', expectText: 'Packs' },
  { path: '/pack/basics/cover', expectText: 'Cover' },
  { path: '/pack/basics', testId: 'pack-carousel' },
  { path: '/admin/author', expectText: 'Authoring Wizard' },
];

for (const r of routes) {
  test(`route ${r.path} renders`, async ({ page }) => {
    await page.goto(r.path);
    if (r.expectText) await expect(page.getByText(r.expectText, { exact: false })).toBeVisible();
    if (r.testId) await expect(page.getByTestId(r.testId)).toBeVisible();
  });
}
