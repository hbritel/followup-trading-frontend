import { test, expect } from '@playwright/test';

// Backend-free smoke tests — run in CI against the static preview build.
// Any test that needs an API must live in plan-downgrade-tests.spec.ts (local-only).

test('login page renders', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('root URL serves the SPA', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#root')).toBeAttached();
});
