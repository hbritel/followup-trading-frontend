# Insights Page -- UI/UX Audit Report

**Date:** 2026-03-27
**Scope:** `/src/pages/Insights.tsx` and all child components under `/src/components/insights/`
**Stack:** React + TypeScript + Tailwind CSS + shadcn/ui + Recharts
**Theme:** Dark-mode fintech dashboard

---

## Executive Summary

The Insights page is architecturally sound but suffers from three systemic problems: (1) the tab structure conflates analytical domains that belong together while separating ones that are related, (2) three of five tabs render 100% hardcoded mock data with non-functional controls, giving a misleading impression of functionality, and (3) there is no top-level summary layer -- the user must click through tabs to find the single number they care about. The recommendations below are ordered by impact-to-effort ratio.

---

## 1. Information Architecture

### Current Structure (5 tabs)

```
AI Insights | AI Coach | Metrics | Patterns | Market
```

### Problems

- **"Metrics" and "Patterns" are the same analytical domain.** A trader checking "how am I performing by day of week" and "what is my monthly PnL" is asking the same fundamental question: "where am I strong and where am I weak?" Splitting them into separate tabs adds clicks without adding clarity.
- **"AI Insights" and "AI Coach" overlap conceptually.** Both are AI-generated content. The distinction between a list of insight cards and a weekly digest is a presentation detail, not a navigation-level concept.
- **"Market" is premature.** It is 100% mock data with no backend support. Showing a non-functional market correlation tab erodes trust.
- **RiskMetrics.tsx exists but is not rendered.** It contains the most advanced analytical content (VaR, Sharpe, Sortino, RadarChart, Kelly) and pulls partially real data, yet the user cannot reach it.

### Recommended Structure (3 tabs + above-fold summary)

```
+------------------------------------------------------------------+
|  SUMMARY BAR (always visible, no tab)                            |
|  [Win Rate] [Net PnL] [Profit Factor] [Sharpe] [Best Day]       |
+------------------------------------------------------------------+

  Performance  |  Risk & Position  |  AI Insights
```

**Performance tab** -- Merges current "Metrics" and "Patterns":
- Monthly PnL chart (existing ComposedChart)
- Strategy comparison (existing horizontal BarChart)
- Day-of-week heatmap (replaces current table)
- Hour-of-day bar chart (replaces current PieChart)
- Cumulative equity curve

**Risk & Position tab** -- Promotes current unused RiskMetrics.tsx plus relevant sections:
- Radar risk profile
- VaR cards
- Portfolio diversity / sector exposure
- Kelly criterion sizing
- Margin utilization
- Drawdown waterfall

**AI Insights tab** -- Merges current "AI Insights" and "AI Coach":
- Active insight cards at top
- Weekly digest below
- "Generate Digest" button in header
- Dismissed insights in a collapsible section

**Market Context** -- Defer entirely or show as a small contextual badge/widget on the Performance tab once real data exists. Do not give mock data its own tab.

### Why 3 Tabs Instead of 5

Traders optimize for speed. Fewer tabs means fewer decisions. The mental model becomes: "How am I doing?" (Performance), "Am I managing risk?" (Risk), "What should I change?" (AI). Each question maps to exactly one tab.

---

## 2. Visual Hierarchy -- The Missing Summary Layer

### Problem

There is no above-the-fold information. The page opens with a title ("Insights"), a subtitle, and a tab bar. The user must select a tab and then scroll to find any useful number. This violates the fintech principle that the most important metrics should be visible within 0 seconds of page load.

### Recommendation: KPI Strip

Place a horizontal row of 4-6 KPI cards above the tab bar, identical in style to the Dashboard page's `KpiCard` component (already built). These should be always visible regardless of which tab is active.

```
Wireframe:

+----------+  +----------+  +----------+  +----------+  +----------+
| Win Rate |  | Net PnL  |  | Profit   |  | Sharpe   |  | Active   |
| 62.4%    |  | +$3,240  |  | Factor   |  | Ratio    |  | Alerts   |
| +2.1%    |  | vs prev  |  | 2.1x     |  | 1.84     |  | 3        |
+----------+  +----------+  +----------+  +----------+  +----------+
```

Data source: `useDashboardSummary()` hook -- already available, already fetched on Dashboard. No new API call needed.

Each KPI card should include:
- Primary value (large, `text-2xl font-bold tabular-nums`)
- Label (`text-xs text-muted-foreground uppercase tracking-wider`)
- Delta vs previous period (`text-sm` with green/red coloring)
- Sparkline (optional, using a 40px-wide inline SVG)

shadcn/ui implementation: Use `Card` with `p-4` padding, `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3`.

---

## 3. Chart Type Selection

### Time-of-Day Performance: Replace PieChart

**Current:** PieChart showing percentage distribution of trades across 4 time slots.
**Problem:** PieCharts are poor at communicating the dimension traders care about -- *profitability by time slot*, not just *volume*. The user has to cross-reference the pie with a separate table to see that Mid-Day is unprofitable. This is a two-step cognitive process that should be one step.

**Recommendation:** Horizontal diverging bar chart (bars go left for loss, right for profit). Each bar represents a time-of-day slot. Bar length encodes PnL. Bar color encodes profit (green) vs loss (red). A small annotation shows trade count.

```
Wireframe:

         -$800            $0              +$2,300
           |               |                |
  Opening  |               |================| 42 trades
  Mid-Day  |=======        |                | 28 trades
  Closing  |               |===========     | 35 trades
  After Hrs|               |===             | 12 trades
```

Recharts implementation: `BarChart` with `layout="vertical"`, single `Bar` with `Cell` fill based on positive/negative value.

### Day-of-Week Performance: Replace Table with Heatmap

**Current:** Plain HTML table with numbers.
**Problem:** Tables require line-by-line reading. A heatmap lets the trader spot their best/worst days in under 1 second.

**Recommendation:** 5-cell horizontal heatmap strip. Each cell is a rounded rectangle. Background color intensity maps to win rate (deeper green = higher win rate, deeper red = lower). Text overlay shows the win rate percentage and average PnL.

```
Wireframe:

  Mon       Tue       Wed       Thu       Fri
 [48%]     [53%]     [58%]     [51%]     [45%]
 $150      $220      $280      $180      $120
  42t       38t       45t       39t       40t
```

Implementation: Custom Tailwind grid (`grid grid-cols-5 gap-2`), no Recharts needed. Color scale via inline `style` or a utility function mapping win rate to `bg-green-{shade}` / `bg-red-{shade}`.

### Strategy Comparison: Keep Horizontal BarChart, Simplify

**Current:** Horizontal BarChart with 4 overlapping metrics (winRate, profitFactor, expectancy, payoffRatio) per strategy.
**Problem:** Four bars per row creates visual noise. Win rate (0-100) and expectancy (0-1) are on completely different scales, making the bars misleading when shown side by side on the same axis.

**Recommendation:** Show *one primary metric* at a time (default: win rate) with a toggle. Add a mini data table below the chart for the secondary metrics. This reduces cognitive load while preserving access to all data.

Alternative: Use a Recharts `RadarChart` per strategy (small multiples pattern) -- each strategy gets a hexagonal profile showing all metrics normalized to 0-100.

### Sector Exposure: Keep BarChart, Add Treemap Option

The vertical bar chart for sector exposure is acceptable. For a more visually impactful display, consider a `Treemap` (available in Recharts) which uses area to encode size -- traders instantly see which sector dominates.

### Risk-Reward Distribution: ComposedChart is Appropriate

The current approach of overlaying bars (PnL) with a line (win rate) is effective for this data. Keep as-is.

### Missing Chart Type: Equity Curve

The most important chart for any trading journal -- the cumulative equity curve -- is buried inside a sub-tab of "Metrics" labeled "Cumulative." It should be the hero chart of the Performance tab, displayed first and largest (full width, 300-400px height).

---

## 4. Interaction Design

### Timeframe Selector: Make It Real

**Current state:** The `Select` in PerformanceMetrics captures `timeframe` state but never passes it to any data-fetching hook. The MarketConditions selectors are completely decorative.

**Recommendation for Phase 1 (quick win):**
- Wire the timeframe selector to the existing `useDashboardSummary(startDate, endDate)` hook. The hook already accepts date parameters.
- Compute `startDate` from the selected preset using the same `computeDateRange()` utility already used on the Dashboard page.
- Remove mock data arrays and replace with API-driven data.

**Recommendation for Phase 2 (enhanced):**
- Add a global date range picker at the page level (above tabs), not per-tab. This avoids the user selecting "6 months" on Metrics and then switching to Patterns where a different timeframe applies.
- Use the existing `DashboardDateFilter` component with `usePageFilter('insights', ...)`.

### Drill-Down from Insight Cards

When a user sees an insight like "Your win rate drops 15% after 2pm," they should be able to click it and see the relevant trades. Currently insight cards have a dismiss button but no exploration action.

**Recommendation:**
- Add a "View Trades" button on actionable insights.
- On click, navigate to `/trades?filter=<insight-specific-params>` or open a sheet/dialog with filtered trades.
- The backend `InsightResponseDto` already contains a `data` JSON payload -- use it to construct the filter query.

### Account Filtering

The Insights page has no account selector, unlike the Dashboard. Traders with multiple accounts need to filter insights and metrics per account.

**Recommendation:** Add `AccountSelector` in the page header, matching Dashboard's pattern. Pass `accountIds` to all metric hooks.

---

## 5. Data Density

### Per-Tab Assessment

| Tab | Current Density | Verdict |
|-----|----------------|---------|
| AI Insights | Low -- vertical list of cards with generous spacing | Appropriate for reading AI text |
| AI Coach | Very low -- single card or empty state | Needs supplementary content |
| Metrics | High -- 6 chart sections, nested tabs | Too much per scroll; needs prioritization |
| Patterns | Low -- one pie + two tables | Under-utilizing available screen space |
| Market | Low -- one line chart + card grid | Feels like a placeholder |

### Recommendations

**Performance tab (merged Metrics + Patterns):**
- Lead with equity curve (full width, 300px)
- Two-column grid below: Monthly PnL + Day/Hour heatmaps
- Strategy comparison as an expandable/collapsible section
- Target: 3-4 visible chart sections without scrolling on desktop (1440px)

**Risk tab (promoted RiskMetrics):**
- Lead with radar profile (half width) + VaR cards (half width)
- Portfolio diversity and margin below
- Kelly criterion as an expandable advanced section
- Mark sections as "Advanced" to not intimidate newer traders

**AI tab (merged Insights + Coach):**
- Side-by-side layout on desktop: insight cards (2/3 width) + weekly digest (1/3 width sidebar)
- On mobile: digest card pinned at top, insights below
- Add insight count badge on the tab trigger

---

## 6. Missing UI Components

### A. Period Comparison

Traders constantly ask "am I improving?" The current UI shows absolute numbers but no period-over-period comparison.

**Recommendation:** Add a comparison toggle in the page header: "vs Previous Period." When active, every KPI card and chart shows a delta. Implementation: fetch the same metrics for the previous equivalent period and compute differences client-side.

### B. Export Functionality

**Recommendation:** Add a dropdown button in the page header:
- "Export as PDF" -- captures the current tab as a report
- "Export as CSV" -- exports the underlying data table
- "Share Snapshot" -- generates a shareable image (useful for social/TikTok content)

Use shadcn/ui `DropdownMenu` with `Download`, `FileSpreadsheet`, `Share2` icons.

### C. Insight Notification Badge

The "AI Insights" tab should show a count badge when there are unread/active insights. The user should see at a glance if there is something requiring attention without clicking the tab.

```tsx
<TabsTrigger value="ai" className="relative">
  AI Insights
  {activeCount > 0 && (
    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive
                     text-[10px] font-bold text-destructive-foreground
                     flex items-center justify-center">
      {activeCount}
    </span>
  )}
</TabsTrigger>
```

### D. Empty States with Guidance

Current empty states show an icon and "No insights." They should guide the user toward generating data.

**Recommendation:** Each empty state should include:
1. Clear illustration or icon
2. Explanation of what would appear
3. A primary CTA ("Add your first trade," "Connect a broker," "Generate digest")
4. A secondary link ("Learn more about how insights work")

---

## 7. Dark Mode Fintech Best Practices

### Color System

**Current issues:**
- Recharts defaults are used (`#8884d8`, `#82ca9d`, `#ffc658`). These are adequate but not optimized for dark backgrounds.
- Profit/loss color coding is inconsistent: sometimes `text-green-500` / `text-red-500`, sometimes `#10b981` / `#ef4444`.

**Recommended palette for dark mode charts:**

```
Profit / Bullish:  #22c55e (green-500) -- strong enough on dark backgrounds
Loss / Bearish:    #ef4444 (red-500) -- standard, accessible
Primary series:    #3b82f6 (blue-500)
Secondary series:  #a78bfa (violet-400)
Tertiary series:   #f59e0b (amber-500)
Neutral / grid:    #374151 (gray-700) at 50% opacity
Background areas:  #1f2937 (gray-800) for chart container
Tooltip bg:        #111827 (gray-900) with border-gray-700
```

Apply these consistently via a shared `CHART_COLORS` constant. Override Recharts defaults by passing explicit stroke/fill values and a custom `Tooltip` component with dark background.

### Chart Grid and Axis Styling

All CartesianGrid instances use the default stroke color, which is too bright on dark backgrounds.

```tsx
<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
<XAxis tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#374151' }} />
<YAxis tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#374151' }} />
```

### Card Elevation

Current: `glass-card rounded-2xl` is used inconsistently (some cards have it, some don't).

**Recommendation:** Standardize on two elevation levels:
- **Surface:** `bg-card border border-border rounded-xl` -- default for all metric containers
- **Elevated:** `bg-card border border-border rounded-xl shadow-lg shadow-black/20` -- for the KPI strip and primary chart cards

Avoid mixing `rounded-2xl` (16px) and default `rounded-lg` (8px). Pick one: `rounded-xl` (12px) is the sweet spot for fintech.

### Typography Hierarchy within Charts

```
Chart title:       text-base font-semibold (already correct via CardTitle)
Chart description:  text-sm text-muted-foreground (already correct)
Axis labels:       12px, gray-400, font-mono tabular-nums
Tooltip header:    text-sm font-medium
Tooltip values:    text-sm font-mono tabular-nums
Legend items:      text-xs text-muted-foreground
```

All numeric values in charts and KPIs should use `font-mono tabular-nums` for proper alignment.

---

## 8. Mobile Responsiveness

### Current Issues

- Charts are set to `height={300}` which is appropriate for desktop but wastes mobile viewport space when the chart has only 5-6 data points.
- The `grid grid-cols-1 md:grid-cols-2` pattern is used correctly for side-by-side charts but the PieChart in TradingPatterns shares a row with a table, which collapses poorly on mobile.
- The tab bar with 5 items overflows horizontally on small screens -- shadcn TabsList does not auto-scroll.

### Recommendations

**Tab bar:** With 3 tabs (recommended restructuring), overflow is unlikely. If overflow does occur, add `overflow-x-auto` and `scrollbar-hide` classes to the TabsList, and ensure TabsTrigger items use `whitespace-nowrap`.

**Chart heights:** Use responsive heights:
```tsx
<ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
```
Or simpler: use Tailwind's `h-[220px] md:h-[300px]` on the container div.

**KPI strip:** On mobile, switch from 5-column to 2-column + scrollable:
```
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3
```
The fifth card wraps to a new row on mobile, which is acceptable.

**Touch targets:** The dismiss button on insight cards (`h-7 px-2`) is 28px tall -- below the 44px minimum for comfortable mobile touch targets. Increase to `h-9 px-3` on mobile or use a swipe-to-dismiss gesture instead.

**Bottom sheet pattern:** For drill-down interactions on mobile (viewing trades for an insight, expanding a chart), use a bottom sheet (shadcn `Sheet` with `side="bottom"`) instead of a dialog. This respects thumb-reach zones.

**Chart tooltip:** On mobile, Recharts tooltips follow the cursor, which can be obscured by the user's finger. Consider using a fixed-position tooltip bar above the chart that updates on touch.

---

## 9. Priority Implementation Order

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Add KPI summary strip above tabs | Small | High -- instant value on page load |
| P0 | Merge "AI Insights" + "AI Coach" into one tab | Small | Reduces clutter, improves IA |
| P0 | Promote RiskMetrics.tsx into a "Risk" tab | Small | Unlocks existing code with real data |
| P1 | Replace time-of-day PieChart with diverging bar | Medium | Better data communication |
| P1 | Wire timeframe selector to real API hooks | Medium | Eliminates fake interactivity |
| P1 | Merge "Patterns" into "Performance" tab | Small | Reduces tabs from 5 to 3 |
| P1 | Remove or hide "Market" tab (100% mock) | Trivial | Removes misleading content |
| P1 | Standardize chart color palette for dark mode | Small | Visual consistency |
| P2 | Add account selector to page header | Medium | Multi-account support |
| P2 | Day-of-week heatmap replacement | Medium | Better visual scanning |
| P2 | Add drill-down from insight cards to trades | Medium | Makes insights actionable |
| P2 | Period-over-period comparison | Large | Key trader need |
| P3 | Export functionality | Medium | Nice to have |
| P3 | Mobile bottom sheet for drill-downs | Medium | Mobile polish |
| P3 | Custom dark-mode Recharts tooltip component | Small | Visual refinement |

---

## 10. Specific Code-Level Notes

**Insights.tsx line 66:** `glass-card rounded-2xl` is applied to insight cards but not to the weekly digest card container. Standardize to one approach.

**PerformanceMetrics.tsx line 30-74:** All six data arrays are hardcoded. Replace with hooks from `useAdvancedMetrics.ts` (already built) and the time metrics endpoint (`DayOfWeekPerformance`, `HourOfDayPerformance`) mentioned in the task description.

**PerformanceMetrics.tsx line 105-110:** Nested tabs within a tab is a navigation anti-pattern. The "Profit/Loss | Key Metrics | Cumulative" toggle inside the monthly performance card forces the user to discover sub-navigation. Replace with a single ComposedChart that shows bars + cumulative line simultaneously, and move "Key Metrics" into its own card below.

**TradingPatterns.tsx line 12-17:** The time-of-day mock data uses labels ("Opening Hour", "Mid-Day", "Closing Hour", "After Hours") that do not match the backend model, which uses hour ranges (0-23). The frontend should map backend hour buckets to human-readable labels.

**MarketConditions.tsx line 13-19:** All dates are hardcoded as 2023. Even as mock data, this should use relative dates or carry a visible "SAMPLE DATA" badge.

**RiskMetrics.tsx line 72-78:** The margin utilization mock data derives from `realMarginUtil` but multiplies by arbitrary factors (0.7, 0.9, etc.) to simulate history. This creates a false trend line. Either show just the current value (as a gauge) or wait for the backend to provide a time series.

**RiskMetrics.tsx line 389:** The Kelly criterion stacked bar uses raw `bg-gray-200` for the track, which is invisible in dark mode. Replace with `bg-muted` or `bg-accent`.

---

## 11. Wireframe: Recommended Page Layout (Desktop, 1440px)

```
+----------------------------------------------------------------------+
| Insights                                                    [Export] |
| Your trading performance and AI-powered analysis                      |
+----------------------------------------------------------------------+
|                                                                      |
| +----------+ +----------+ +----------+ +----------+ +----------+     |
| | Win Rate | | Net PnL  | | Profit   | | Sharpe   | | Active   |     |
| | 62.4%    | | +$3,240  | | Factor   | | Ratio    | | Insights |     |
| | +2.1 pp  | | +12% MoM | | 2.1x     | | 1.84     | | 3 new    |     |
| +----------+ +----------+ +----------+ +----------+ +----------+     |
|                                                                      |
| [Performance]  [Risk & Position]  [AI Insights (3)]                  |
|                                                                      |
| Performance tab:                                                     |
| +----------------------------------------------------------------+   |
| | Equity Curve (full width, 300px height)                        |   |
| | Area chart, green fill when positive, red when below start     |   |
| +----------------------------------------------------------------+   |
|                                                                      |
| +-----------------------------+  +-----------------------------+     |
| | Monthly PnL                 |  | Strategy Comparison          |     |
| | ComposedChart               |  | Horizontal BarChart          |     |
| | Bars (green/red) + line     |  | One metric at a time         |     |
| +-----------------------------+  +-----------------------------+     |
|                                                                      |
| +-----------------------------+  +-----------------------------+     |
| | Day of Week Heatmap         |  | Hour of Day Performance     |     |
| | 5-cell color strip          |  | Diverging bar chart          |     |
| | Mon Tue Wed Thu Fri         |  | -$800 ... $0 ... +$2300     |     |
| +-----------------------------+  +-----------------------------+     |
+----------------------------------------------------------------------+
```

---

## 12. Wireframe: Mobile Layout (375px)

```
+----------------------------------+
| Insights                         |
| Performance & analysis           |
+----------------------------------+
| [Win Rate] [Net PnL]            |
| [62.4%   ] [+$3,240]            |
| [P.Factor] [Sharpe ]            |
| [2.1x    ] [1.84   ]            |
+----------------------------------+
| [Perf] [Risk] [AI (3)]          |
+----------------------------------+
| Equity Curve                     |
| ~~~~~~~~~~~~~~~~~~~~~~~~~~~~     |
|        220px height              |
+----------------------------------+
| Monthly PnL                      |
| ||||||||||||||||||||||||         |
|        220px height              |
+----------------------------------+
| Day of Week                      |
| [M] [T] [W] [T] [F]            |
| 48  53  58  51  45              |
+----------------------------------+
| Hour of Day Performance          |
| ============ diverging bars      |
+----------------------------------+
```

---

*Report generated for the FollowUp Trading frontend team. All recommendations reference existing components and APIs where possible to minimize development effort.*
