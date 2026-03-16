# Frontend API Sync Design

Date: 2026-02-27
Branch: `feature/frontend-api-sync`
Status: Approved

## Context

The backend audit (49 items) is complete. The backend now returns new response DTOs (Arch-4), has strategy/tag CRUD, and sends `recentDailyPerformance` + `openPositions` in `DashboardSummaryResponse`. The frontend types are ~95% aligned but missing these new fields, and several pages use hardcoded mock data where real APIs exist.

## Scope

### Part 1: Type Updates (dto.ts)

Add missing types to `DashboardSummary`:
- `recentDailyPerformance?: DailyPerformance[]`
- `openPositions?: OpenPosition[]`

New interfaces:
- `DailyPerformance` — date, totalTrades, winningTrades, losingTrades, profitLoss, equity, winRate, drawdownPercent
- `OpenPosition` — tradeId, symbol, entryDate, entryPrice, currentPrice, quantity, direction, unrealizedPnL, unrealizedPnLPercentage
- `StrategyResponse` — id (UUID), name, description, active, createdAt, updatedAt
- `StrategyRequest` — name, description, active?
- `TagResponse` — id (Integer), name, color (hex string), createdAt, updatedAt
- `TagRequest` — name, color

### Part 2: New Services + Hooks

**strategy.service.ts** — `/api/v1/strategies`
- `getStrategies()` → GET → StrategyResponse[]
- `createStrategy(req)` → POST → StrategyResponse
- `updateStrategy(id, req)` → PUT → StrategyResponse
- `deleteStrategy(id)` → DELETE → void

**tag.service.ts** — `/api/v1/tags`
- `getTags()` → GET → TagResponse[]
- `createTag(req)` → POST → TagResponse
- `updateTag(id, req)` → PUT → TagResponse
- `deleteTag(id)` → DELETE → void

**useStrategies.ts** — React Query hooks
- `useStrategies()` — list query
- `useCreateStrategy()` — mutation, invalidates 'strategies'
- `useUpdateStrategy()` — mutation, invalidates 'strategies'
- `useDeleteStrategy()` — mutation, invalidates 'strategies'

**useTags.ts** — React Query hooks
- `useTags()` — list query
- `useCreateTag()` — mutation, invalidates 'tags'
- `useUpdateTag()` — mutation, invalidates 'tags'
- `useDeleteTag()` — mutation, invalidates 'tags'

### Part 3: Dashboard Enhancements

Add to Dashboard page (below existing content):
- **Open Positions panel** — table: symbol, direction, entry price, current price, unrealized P&L, P&L%. Data from `useAnalytics()` response (already fetched).
- **Recent Daily Performance** — mini bar chart of last 7-14 days P&L. Data from `useDashboardSummary()` response (already fetched).

### Part 4: Performance Page Wiring

Replace hardcoded `monthlyData`, `symbolData`, `strategyData` arrays:
- **Summary cards** — use `useTradePerformance()` for totalProfitLoss, winRate, profitFactor
- **Monthly tab** — fetch trades via `useTrades()` with date range, group client-side by month
- **Symbols tab** — use `performanceByAssetType` from `useDashboardSummary()`
- **Strategies tab** — use `useStrategies()` + cross-reference with `useTrades()` filtered by strategy

### Part 5: Strategy & Tag Management UI

Add to Settings page as new tabs/sections:
- **Strategies section** — list with name, description, active toggle. Create/Edit dialog (name, description, active). Delete with confirmation.
- **Tags section** — list with name, color swatch. Create/Edit dialog (name, color picker). Delete with confirmation.

## Files to Create
- `src/types/dto.ts` — update existing (add DailyPerformance, OpenPosition, Strategy*, Tag* types)
- `src/services/strategy.service.ts` — new
- `src/services/tag.service.ts` — new
- `src/hooks/useStrategies.ts` — new
- `src/hooks/useTags.ts` — new
- `src/components/dashboard/OpenPositionsPanel.tsx` — new
- `src/components/dashboard/DailyPerformanceChart.tsx` — new
- `src/components/settings/StrategiesSection.tsx` — new
- `src/components/settings/TagsSection.tsx` — new
- `src/components/settings/StrategyDialog.tsx` — new
- `src/components/settings/TagDialog.tsx` — new
- `src/pages/Performance.tsx` — rewrite (remove mock data, wire to API)

## Files to Modify
- `src/pages/Dashboard.tsx` — add OpenPositions + DailyPerformance panels
- `src/pages/Settings.tsx` — add Strategies + Tags sections

## Out of Scope
- Backend changes (all APIs already exist)
- Pages with no backend API (Backtesting, Alerts, Watchlists, Reports, Journal, TradeReplay, Statistics, Administration)
- `brokerType` deprecation migration (cosmetic, not breaking)
