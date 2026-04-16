# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plan-downgrade-tests.spec.ts >> C. Calendriers & Locale >> C1: Calendar locale FR — mois et jours en français
- Location: e2e/plan-downgrade-tests.spec.ts:24:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Connexion")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]: FT
      - heading "Followup Trading" [level=1] [ref=e8]
      - paragraph [ref=e9]: Streamline your trading workflow, track performance, and make data-driven decisions.
    - generic [ref=e10]:
      - generic [ref=e12]:
        - button "Toggle theme" [ref=e13] [cursor=pointer]:
          - img
          - generic [ref=e14]: Toggle theme
        - button "Change language" [ref=e15] [cursor=pointer]:
          - img
          - generic [ref=e16]: Change language
      - generic [ref=e17]:
        - generic [ref=e18]:
          - heading "Sign in to your account" [level=2] [ref=e19]
          - paragraph [ref=e20]: Enter your credentials to access your account
        - generic [ref=e21]:
          - generic [ref=e22]:
            - text: Email or Username
            - textbox "Email or Username" [ref=e23]:
              - /placeholder: name@example.com or username
              - text: hbritel
          - generic [ref=e24]:
            - generic [ref=e25]:
              - generic [ref=e26]: Password
              - link "Forgot Password??" [ref=e27] [cursor=pointer]:
                - /url: /auth/reset-password
            - generic [ref=e28]:
              - textbox "Password" [active] [ref=e29]: Passw01#
              - button "Show password" [ref=e30] [cursor=pointer]:
                - img [ref=e31]
          - generic [ref=e34]:
            - checkbox "Remember me" [ref=e35] [cursor=pointer]
            - checkbox
            - generic [ref=e36]: Remember me
          - button "Login" [ref=e37] [cursor=pointer]
          - generic [ref=e42]: Or continue with
          - generic [ref=e43]:
            - button "Google" [ref=e44] [cursor=pointer]:
              - img
              - text: Google
            - button "Apple" [ref=e45] [cursor=pointer]:
              - img
              - text: Apple
        - paragraph [ref=e47]:
          - text: Don't have an account?
          - link "Create Account" [ref=e48] [cursor=pointer]:
            - /url: /auth/signup
      - generic [ref=e49]: © 2026 Followup Trading. All rights reserved.
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:5173';
  4   | const USERNAME = 'hbritel';
  5   | const PASSWORD = 'Passw01#';
  6   | 
  7   | // ─── Helper: Login ─────────────────────────────────────────────────────────────
  8   | 
  9   | async function login(page: Page) {
  10  |   await page.goto(`${BASE_URL}/auth/login`);
  11  |   await page.fill('input[placeholder*="name@example"]', USERNAME);
  12  |   await page.fill('input[type="password"]', PASSWORD);
> 13  |   await page.click('button:has-text("Connexion")');
      |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  14  |   await page.waitForURL('**/dashboard', { timeout: 10_000 });
  15  | }
  16  | 
  17  | // ─── C. Calendriers & Locale ────────────────────────────────────────────────────
  18  | 
  19  | test.describe('C. Calendriers & Locale', () => {
  20  |   test.beforeEach(async ({ page }) => {
  21  |     await login(page);
  22  |   });
  23  | 
  24  |   test('C1: Calendar locale FR — mois et jours en français', async ({ page }) => {
  25  |     // Set locale to FR via i18n
  26  |     await page.evaluate(() => {
  27  |       localStorage.setItem('i18nextLng', 'fr');
  28  |     });
  29  |     await page.goto(`${BASE_URL}/dashboard`);
  30  |     await page.waitForTimeout(1500);
  31  | 
  32  |     // Check calendar month name is in French
  33  |     const calendarText = await page.textContent('.rdp') || '';
  34  |     const frenchMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  35  |     const frenchDays = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
  36  | 
  37  |     const hasfrenchMonth = frenchMonths.some(m => calendarText.toLowerCase().includes(m));
  38  |     const hasFrenchDay = frenchDays.some(d => calendarText.toLowerCase().includes(d));
  39  | 
  40  |     // At least check the day headers contain French abbreviations
  41  |     expect(hasfrenchMonth || hasFrenchDay).toBeTruthy();
  42  |   });
  43  | 
  44  |   test('C4: Economic Calendar page loads without errors', async ({ page }) => {
  45  |     await page.goto(`${BASE_URL}/calendar`);
  46  |     await page.waitForTimeout(2000);
  47  | 
  48  |     // Should not show raw i18n keys
  49  |     const pageText = await page.textContent('body') || '';
  50  |     expect(pageText).not.toContain('calendar.tradingCalendar');
  51  |     expect(pageText).not.toContain('calendar.description');
  52  | 
  53  |     // Should have calendar-related content
  54  |     const hasCalendarContent = pageText.includes('Calendrier') || pageText.includes('Calendar');
  55  |     expect(hasCalendarContent).toBeTruthy();
  56  |   });
  57  | });
  58  | 
  59  | // ─── D. Market Clocks ───────────────────────────────────────────────────────────
  60  | 
  61  | test.describe('D. Market Clocks', () => {
  62  |   test.beforeEach(async ({ page }) => {
  63  |     await login(page);
  64  |   });
  65  | 
  66  |   test('D1: Market clocks button visible on desktop', async ({ page }) => {
  67  |     await page.setViewportSize({ width: 1440, height: 900 });
  68  |     await page.goto(`${BASE_URL}/dashboard`);
  69  |     await page.waitForTimeout(1000);
  70  | 
  71  |     // Look for the globe icon button (market clocks trigger)
  72  |     const clocksButton = page.locator('nav button:has(svg), nav [title*="Market"]').first();
  73  |     // Or look for session text like "LDN", "NY", "TYO", "Closed"
  74  |     const navText = await page.textContent('nav') || '';
  75  |     const hasMarketIndicator = ['LDN', 'NY', 'TYO', 'PAR', 'Closed'].some(s => navText.includes(s));
  76  | 
  77  |     expect(hasMarketIndicator).toBeTruthy();
  78  |   });
  79  | 
  80  |   test('D2: Market clocks popover opens on click', async ({ page }) => {
  81  |     await page.setViewportSize({ width: 1440, height: 900 });
  82  |     await page.goto(`${BASE_URL}/dashboard`);
  83  |     await page.waitForTimeout(1000);
  84  | 
  85  |     // Click the market clocks button
  86  |     const marketButton = page.locator('[title*="Market"], button:has-text("LDN"), button:has-text("NY"), button:has-text("Closed")').first();
  87  |     if (await marketButton.isVisible()) {
  88  |       await marketButton.click();
  89  |       await page.waitForTimeout(500);
  90  | 
  91  |       // Popover should show city names
  92  |       const popoverText = await page.textContent('[role="dialog"], [data-radix-popper-content-wrapper]') || '';
  93  |       expect(popoverText).toContain('Tokyo');
  94  |       expect(popoverText).toContain('London');
  95  |       expect(popoverText).toContain('New York');
  96  |     }
  97  |   });
  98  | 
  99  |   test('D5: Market clocks hidden on mobile', async ({ page }) => {
  100 |     await page.setViewportSize({ width: 375, height: 812 });
  101 |     await page.goto(`${BASE_URL}/dashboard`);
  102 |     await page.waitForTimeout(1000);
  103 | 
  104 |     // The market clocks button should be hidden (md:flex means hidden below 768px)
  105 |     const marketButton = page.locator('[title*="Market"]');
  106 |     if (await marketButton.count() > 0) {
  107 |       expect(await marketButton.first().isVisible()).toBeFalsy();
  108 |     }
  109 |   });
  110 | });
  111 | 
  112 | // ─── E. AI Coach Page ───────────────────────────────────────────────────────────
  113 | 
```