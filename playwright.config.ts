import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  // Dev-only tests that depend on a running backend + seeded user account cannot
  // pass in the current CI (frontend preview server only, no backend). Skip in CI.
  testIgnore: process.env.CI ? ['**/plan-downgrade-tests.spec.ts'] : [],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
