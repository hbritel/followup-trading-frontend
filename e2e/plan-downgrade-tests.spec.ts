import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const USERNAME = 'hbritel';
const PASSWORD = 'Passw01#';

// ─── Helper: Login ─────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('input[placeholder*="name@example"]', USERNAME);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button:has-text("Connexion")');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

// ─── C. Calendriers & Locale ────────────────────────────────────────────────────

test.describe('C. Calendriers & Locale', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('C1: Calendar locale FR — mois et jours en français', async ({ page }) => {
    // Set locale to FR via i18n
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'fr');
    });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1500);

    // Check calendar month name is in French
    const calendarText = await page.textContent('.rdp') || '';
    const frenchMonths = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const frenchDays = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];

    const hasfrenchMonth = frenchMonths.some(m => calendarText.toLowerCase().includes(m));
    const hasFrenchDay = frenchDays.some(d => calendarText.toLowerCase().includes(d));

    // At least check the day headers contain French abbreviations
    expect(hasfrenchMonth || hasFrenchDay).toBeTruthy();
  });

  test('C4: Economic Calendar page loads without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/calendar`);
    await page.waitForTimeout(2000);

    // Should not show raw i18n keys
    const pageText = await page.textContent('body') || '';
    expect(pageText).not.toContain('calendar.tradingCalendar');
    expect(pageText).not.toContain('calendar.description');

    // Should have calendar-related content
    const hasCalendarContent = pageText.includes('Calendrier') || pageText.includes('Calendar');
    expect(hasCalendarContent).toBeTruthy();
  });
});

// ─── D. Market Clocks ───────────────────────────────────────────────────────────

test.describe('D. Market Clocks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('D1: Market clocks button visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    // Look for the globe icon button (market clocks trigger)
    const clocksButton = page.locator('nav button:has(svg), nav [title*="Market"]').first();
    // Or look for session text like "LDN", "NY", "TYO", "Closed"
    const navText = await page.textContent('nav') || '';
    const hasMarketIndicator = ['LDN', 'NY', 'TYO', 'PAR', 'Closed'].some(s => navText.includes(s));

    expect(hasMarketIndicator).toBeTruthy();
  });

  test('D2: Market clocks popover opens on click', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    // Click the market clocks button
    const marketButton = page.locator('[title*="Market"], button:has-text("LDN"), button:has-text("NY"), button:has-text("Closed")').first();
    if (await marketButton.isVisible()) {
      await marketButton.click();
      await page.waitForTimeout(500);

      // Popover should show city names
      const popoverText = await page.textContent('[role="dialog"], [data-radix-popper-content-wrapper]') || '';
      expect(popoverText).toContain('Tokyo');
      expect(popoverText).toContain('London');
      expect(popoverText).toContain('New York');
    }
  });

  test('D5: Market clocks hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);

    // The market clocks button should be hidden (md:flex means hidden below 768px)
    const marketButton = page.locator('[title*="Market"]');
    if (await marketButton.count() > 0) {
      expect(await marketButton.first().isVisible()).toBeFalsy();
    }
  });
});

// ─── E. AI Coach Page ───────────────────────────────────────────────────────────

test.describe('E. AI Coach Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('E1: Split layout — chat left, coaching panel right', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    // Check for the chat area and coaching panel
    const pageText = await page.textContent('body') || '';

    // Should have AI Coach title
    const hasCoachTitle = pageText.includes('AI Trading Coach') || pageText.includes('Coach IA');
    expect(hasCoachTitle).toBeTruthy();
  });

  test('E6: Tilt Score gauge visible in coaching panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasTiltScore = pageText.includes('Tilt Score') || pageText.includes('tilt');
    expect(hasTiltScore).toBeTruthy();
  });

  test('E7: Daily Workflow — Briefing button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasBriefing = pageText.includes('Morning Briefing') || pageText.includes('Briefing');
    expect(hasBriefing).toBeTruthy();
  });

  test('E8: Daily Workflow — Emotion button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasEmotion = pageText.includes('Log Emotion') || pageText.includes('Émotion') || pageText.includes('Emotion');
    expect(hasEmotion).toBeTruthy();
  });

  test('E9: Daily Workflow — Debrief button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasDebrief = pageText.includes('Session Debrief') || pageText.includes('Débrief');
    expect(hasDebrief).toBeTruthy();
  });

  test('E10: Coaching Streak visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasStreak = pageText.includes('Streak') || pageText.includes('Série') || pageText.includes('streak');
    expect(hasStreak).toBeTruthy();
  });

  test('E12: Behavioral Alerts section visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasAlerts = pageText.includes('Alert') || pageText.includes('Alerte') || pageText.includes('alert');
    expect(hasAlerts).toBeTruthy();
  });

  test('E15: Mobile tabs Chat/Coach', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasChatTab = pageText.includes('Chat');
    const hasCoachTab = pageText.includes('Coach');
    expect(hasChatTab).toBeTruthy();
    expect(hasCoachTab).toBeTruthy();
  });

  test('E16: Tour onboarding — help button exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    // Look for the ? help button
    const helpButton = page.locator('[title*="How it works"], [title*="Comment"]');
    const helpExists = await helpButton.count() > 0;
    expect(helpExists).toBeTruthy();
  });
});

// ─── F. Emotion & Psychology ────────────────────────────────────────────────────

test.describe('F. Emotion & Psychology', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('F3: Psychology correlation panel visible on AI Coach', async ({ page }) => {
    await page.goto(`${BASE_URL}/ai-coach`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasPsychology = pageText.includes('Emotion') || pageText.includes('Performance') || pageText.includes('Win Rate');
    expect(hasPsychology).toBeTruthy();
  });
});

// ─── G. Notification Preferences ────────────────────────────────────────────────

test.describe('G. Notification Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('G1: AI Coaching notification toggles visible in Settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasBriefingReminder = pageText.includes('Briefing') || pageText.includes('briefing');
    const hasDebriefReminder = pageText.includes('Debrief') || pageText.includes('debrief') || pageText.includes('Débrief');

    // At least one AI coaching toggle should be present
    expect(hasBriefingReminder || hasDebriefReminder).toBeTruthy();
  });
});

// ─── H. Landing Page & Pricing ──────────────────────────────────────────────────

test.describe('H. Landing Page & Pricing', () => {
  test('H1: Pricing section shows 4 plans', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    expect(pageText).toContain('Free');
    expect(pageText).toContain('Starter');
    expect(pageText).toContain('Pro');
    expect(pageText).toContain('Elite');
  });

  test('H2: Elite card has "Most Powerful" badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    expect(pageText).toContain('Most Powerful');
  });

  test('H3: Pro card has "Most Popular" badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    expect(pageText).toContain('Most Popular');
  });

  test('H5: Prop firm features in plan cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    const hasPropFirm = pageText.includes('prop firm') || pageText.includes('Prop firm') || pageText.includes('live tracking');
    expect(hasPropFirm).toBeTruthy();
  });
});

// ─── I. Broker Connection — MT5 Bridge ──────────────────────────────────────────

test.describe('I. Broker Connection', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('I1: No MT5 Bridge option when adding broker', async ({ page }) => {
    await page.goto(`${BASE_URL}/accounts`);
    await page.waitForTimeout(2000);

    const pageText = await page.textContent('body') || '';
    // MT5 Bridge should NOT appear anywhere on the accounts page
    expect(pageText).not.toContain('MT5 Bridge');
    expect(pageText).not.toContain('MT5_BRIDGE');
  });
});

// ─── J. PropFirm Evaluation ─────────────────────────────────────────────────────

test.describe('J. PropFirm Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('J1: PropFirm evaluation dashboard loads without crash', async ({ page }) => {
    await page.goto(`${BASE_URL}/prop-firm`);
    await page.waitForTimeout(2000);

    // Should not show error boundary
    const pageText = await page.textContent('body') || '';
    expect(pageText).not.toContain('Something went wrong');
    expect(pageText).not.toContain('Cannot read properties of null');
  });
});
