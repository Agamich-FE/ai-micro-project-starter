import { test, expect } from '@playwright/test';

// Temporary check that the Playwright setup reaches the DDEV site.
// Replaced by the events smoke test in plan step 10.
test('site front page responds', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});
