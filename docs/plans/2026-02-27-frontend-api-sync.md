# Frontend API Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the frontend to real backend APIs for strategies, tags, performance metrics, and dashboard enhancements — replacing all hardcoded mock data.

**Architecture:** React + TypeScript + @tanstack/react-query v5. Services call `apiClient` (Axios with JWT interceptors at `/api/v1/`). Hooks wrap services with `useQuery`/`useMutation`. Components consume hooks. All new code follows existing patterns in `metrics.service.ts` and `useAdvancedMetrics.ts`.

**Tech Stack:** React 18, TypeScript, @tanstack/react-query v5, Axios, shadcn/ui, i18next, Zod (optional for validation)

**Design Doc:** `docs/plans/2026-02-27-frontend-api-sync-design.md`

---

## Task 1: Add Missing Types to dto.ts

**Files:**
- Modify: `src/types/dto.ts`

**Step 1: Add DailyPerformance, OpenPosition, Strategy, and Tag types**

Add at the end of `src/types/dto.ts`:

```typescript
// --- Performance & Dashboard types ---

/** Matches backend DailyPerformanceResponse */
export interface DailyPerformanceDto {
  date: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  equity: number;
  winRate: number;
  drawdownPercent: number;
}

/** Matches backend OpenPositionResponse */
export interface OpenPositionDto {
  tradeId: string;
  symbol: string;
  entryDate: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  direction: string;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
}

// --- Strategy types (matches backend StrategyDto) ---

export interface StrategyResponseDto {
  id: string;        // UUID
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;  // ISO date
  updatedAt: string;  // ISO date
}

export interface StrategyRequestDto {
  name: string;
  description?: string | null;
  active?: boolean;
}

// --- Tag types (matches backend TagDto) ---

export interface TagResponseDto {
  id: number;          // Integer, not UUID
  name: string;
  color: string;       // hex string, e.g. "#FF5733"
  createdAt: string;   // ISO date
  updatedAt: string;   // ISO date
}

export interface TagRequestDto {
  name: string;
  color: string;       // hex string
}
```

**Step 2: Add optional fields to DashboardSummary in metrics.service.ts**

In `src/services/metrics.service.ts`, update the `DashboardSummary` interface (around line 56-75):

```typescript
// Add these two optional fields at the end of DashboardSummary:
  recentDailyPerformance?: DailyPerformanceDto[];
  openPositions?: OpenPositionDto[];
```

Also add the import at the top of `metrics.service.ts`:

```typescript
import type { DailyPerformanceDto, OpenPositionDto } from '@/types/dto';
```

**Step 3: Verify types compile**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable
git add src/types/dto.ts src/services/metrics.service.ts
git commit -m "feat: add Strategy, Tag, DailyPerformance, OpenPosition types"
```

---

## Task 2: Create Strategy Service

**Files:**
- Create: `src/services/strategy.service.ts`

**Step 1: Create the strategy service**

Create `src/services/strategy.service.ts`:

```typescript
import apiClient from './apiClient';
import type { StrategyResponseDto, StrategyRequestDto } from '@/types/dto';

export const strategyService = {
  /**
   * Get all strategies for the authenticated user.
   * Backend: GET /api/v1/strategies
   */
  getStrategies: async (): Promise<StrategyResponseDto[]> => {
    const response = await apiClient.get<StrategyResponseDto[]>('/strategies');
    return response.data;
  },

  /**
   * Create a new strategy.
   * Backend: POST /api/v1/strategies
   */
  createStrategy: async (data: StrategyRequestDto): Promise<StrategyResponseDto> => {
    const response = await apiClient.post<StrategyResponseDto>('/strategies', data);
    return response.data;
  },

  /**
   * Update an existing strategy.
   * Backend: PUT /api/v1/strategies/{id}
   */
  updateStrategy: async (id: string, data: StrategyRequestDto): Promise<StrategyResponseDto> => {
    const response = await apiClient.put<StrategyResponseDto>(`/strategies/${id}`, data);
    return response.data;
  },

  /**
   * Delete a strategy.
   * Backend: DELETE /api/v1/strategies/{id}
   */
  deleteStrategy: async (id: string): Promise<void> => {
    await apiClient.delete(`/strategies/${id}`);
  },
};
```

**Step 2: Verify types compile**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/services/strategy.service.ts
git commit -m "feat: add strategy service (CRUD for /api/v1/strategies)"
```

---

## Task 3: Create Tag Service

**Files:**
- Create: `src/services/tag.service.ts`

**Step 1: Create the tag service**

Create `src/services/tag.service.ts`:

```typescript
import apiClient from './apiClient';
import type { TagResponseDto, TagRequestDto } from '@/types/dto';

export const tagService = {
  /**
   * Get all tags for the authenticated user.
   * Backend: GET /api/v1/tags
   */
  getTags: async (): Promise<TagResponseDto[]> => {
    const response = await apiClient.get<TagResponseDto[]>('/tags');
    return response.data;
  },

  /**
   * Create a new tag.
   * Backend: POST /api/v1/tags
   */
  createTag: async (data: TagRequestDto): Promise<TagResponseDto> => {
    const response = await apiClient.post<TagResponseDto>('/tags', data);
    return response.data;
  },

  /**
   * Update an existing tag.
   * Backend: PUT /api/v1/tags/{id}
   */
  updateTag: async (id: number, data: TagRequestDto): Promise<TagResponseDto> => {
    const response = await apiClient.put<TagResponseDto>(`/tags/${id}`, data);
    return response.data;
  },

  /**
   * Delete a tag.
   * Backend: DELETE /api/v1/tags/{id}
   */
  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },
};
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/services/tag.service.ts
git commit -m "feat: add tag service (CRUD for /api/v1/tags)"
```

---

## Task 4: Create useStrategies Hook

**Files:**
- Create: `src/hooks/useStrategies.ts`

**Step 1: Create the strategies hooks file**

Create `src/hooks/useStrategies.ts`:

```typescript
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { strategyService } from '@/services/strategy.service';
import type { StrategyRequestDto } from '@/types/dto';

const STRATEGIES_KEY = ['strategies'];

/**
 * Hook to fetch all strategies for the authenticated user.
 * Backend: GET /api/v1/strategies
 */
export const useStrategies = () => {
  return useQuery({
    queryKey: STRATEGIES_KEY,
    queryFn: () => strategyService.getStrategies(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

/**
 * Mutation hook to create a new strategy.
 * Invalidates the strategies list on success.
 */
export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StrategyRequestDto) => strategyService.createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
};

/**
 * Mutation hook to update an existing strategy.
 * Invalidates the strategies list on success.
 */
export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StrategyRequestDto }) =>
      strategyService.updateStrategy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
};

/**
 * Mutation hook to delete a strategy.
 * Invalidates the strategies list on success.
 */
export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => strategyService.deleteStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
};
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/hooks/useStrategies.ts
git commit -m "feat: add useStrategies React Query hooks (list, create, update, delete)"
```

---

## Task 5: Create useTags Hook

**Files:**
- Create: `src/hooks/useTags.ts`

**Step 1: Create the tags hooks file**

Create `src/hooks/useTags.ts`:

```typescript
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { tagService } from '@/services/tag.service';
import type { TagRequestDto } from '@/types/dto';

const TAGS_KEY = ['tags'];

/**
 * Hook to fetch all tags for the authenticated user.
 * Backend: GET /api/v1/tags
 */
export const useTags = () => {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: () => tagService.getTags(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });
};

/**
 * Mutation hook to create a new tag.
 * Invalidates the tags list on success.
 */
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagRequestDto) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
};

/**
 * Mutation hook to update an existing tag.
 * Invalidates the tags list on success.
 */
export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagRequestDto }) =>
      tagService.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
};

/**
 * Mutation hook to delete a tag.
 * Invalidates the tags list on success.
 */
export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
};
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/hooks/useTags.ts
git commit -m "feat: add useTags React Query hooks (list, create, update, delete)"
```

---

## Task 6: Create OpenPositionsPanel Component

**Files:**
- Create: `src/components/dashboard/OpenPositionsPanel.tsx`

**Step 1: Create the component**

Create `src/components/dashboard/OpenPositionsPanel.tsx`:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OpenPositionDto } from '@/types/dto';

interface OpenPositionsPanelProps {
  positions?: OpenPositionDto[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const OpenPositionsPanel: React.FC<OpenPositionsPanelProps> = ({ positions }) => {
  const { t } = useTranslation();

  if (!positions || positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('dashboard.openPositions', 'Open Positions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('dashboard.noOpenPositions', 'No open positions')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t('dashboard.openPositions', 'Open Positions')} ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{t('common.symbol', 'Symbol')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{t('common.direction', 'Direction')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('trades.entryPrice', 'Entry')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('trades.currentPrice', 'Current')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('trades.quantity', 'Qty')}</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">{t('dashboard.unrealizedPnL', 'Unrealized P&L')}</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.tradeId} className="border-b last:border-0">
                  <td className="py-2 px-3 text-sm font-medium">{pos.symbol}</td>
                  <td className="py-2 px-3">
                    <Badge variant={pos.direction === 'LONG' ? 'default' : 'secondary'} className="text-xs">
                      {pos.direction}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-sm text-right">{formatCurrency(pos.entryPrice)}</td>
                  <td className="py-2 px-3 text-sm text-right">{formatCurrency(pos.currentPrice)}</td>
                  <td className="py-2 px-3 text-sm text-right">{pos.quantity}</td>
                  <td className={cn(
                    "py-2 px-3 text-sm text-right font-medium",
                    pos.unrealizedPnL >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {formatCurrency(pos.unrealizedPnL)} ({pos.unrealizedPnLPercentage.toFixed(2)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenPositionsPanel;
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/dashboard/OpenPositionsPanel.tsx
git commit -m "feat: add OpenPositionsPanel component for dashboard"
```

---

## Task 7: Create DailyPerformanceChart Component

**Files:**
- Create: `src/components/dashboard/DailyPerformanceChart.tsx`

**Step 1: Check if recharts is available**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && cat package.json | grep recharts`
Expected: `"recharts": "..."` — if not found, use a simple bar chart with divs.

**Step 2: Create the component**

Create `src/components/dashboard/DailyPerformanceChart.tsx`:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DailyPerformanceDto } from '@/types/dto';

interface DailyPerformanceChartProps {
  data?: DailyPerformanceDto[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const DailyPerformanceChart: React.FC<DailyPerformanceChartProps> = ({ data }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('dashboard.recentPerformance', 'Recent Daily Performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('dashboard.noPerformanceData', 'No performance data available')}</p>
        </CardContent>
      </Card>
    );
  }

  // Take last 14 days max
  const recentData = data.slice(-14);
  const maxAbsValue = Math.max(...recentData.map(d => Math.abs(d.profitLoss)), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t('dashboard.recentPerformance', 'Recent Daily Performance')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {recentData.map((day) => {
            const heightPercent = Math.max((Math.abs(day.profitLoss) / maxAbsValue) * 100, 4);
            const isProfit = day.profitLoss >= 0;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-opacity",
                    isProfit ? "bg-green-500" : "bg-red-500"
                  )}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.date}: ${formatCurrency(day.profitLoss)} (${day.totalTrades} trades)`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {recentData[0]?.date?.slice(5)}
          </span>
          <span className="text-xs text-muted-foreground">
            {recentData[recentData.length - 1]?.date?.slice(5)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPerformanceChart;
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/dashboard/DailyPerformanceChart.tsx
git commit -m "feat: add DailyPerformanceChart component for dashboard"
```

---

## Task 8: Wire Dashboard with New Panels

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Add imports and data to Dashboard.tsx**

At the top of `src/pages/Dashboard.tsx`, add after existing imports:

```typescript
import { useDashboardSummary } from '@/hooks/useAdvancedMetrics';
import OpenPositionsPanel from '@/components/dashboard/OpenPositionsPanel';
import DailyPerformanceChart from '@/components/dashboard/DailyPerformanceChart';
```

**Step 2: Add useDashboardSummary hook call**

Inside the `Dashboard` component, after the existing `useTrades` call (around line 40-44), add:

```typescript
  const { data: dashboardSummary } = useDashboardSummary(
    dateRange.startDate, dateRange.endDate, apiAccountId
  );
```

**Step 3: Add the new panels to the JSX**

After the closing `</div>` of the existing grid (after the TradeTable + TradingCalendar section, around line 83), add:

```tsx
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyPerformanceChart data={dashboardSummary?.recentDailyPerformance} />
          <OpenPositionsPanel positions={dashboardSummary?.openPositions} />
        </div>
```

**Step 4: Verify types compile and app renders**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: add DailyPerformance + OpenPositions panels to Dashboard"
```

---

## Task 9: Wire Performance Page — Replace Mock Data

**Files:**
- Modify: `src/pages/Performance.tsx`

**Step 1: Replace the entire Performance page**

Rewrite `src/pages/Performance.tsx` to use real API data:

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePageFilter } from '@/contexts/page-filters-context';
import { useTradePerformance, useDashboardSummary } from '@/hooks/useAdvancedMetrics';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import DashboardDateFilter, { computeDateRange } from '@/components/dashboard/DashboardDateFilter';
import AccountSelector from '@/components/dashboard/AccountSelector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const Performance = () => {
  const { t } = useTranslation();

  // Filters (reuse same pattern as Dashboard)
  const [selectedAccountId, setSelectedAccountId] = usePageFilter('performance', 'accountId', 'all');
  const [datePreset, setDatePreset] = usePageFilter('performance', 'datePreset', '3m');
  const [customStart, setCustomStart] = usePageFilter<Date | null>('performance', 'customStart', null);
  const [customEnd, setCustomEnd] = usePageFilter<Date | null>('performance', 'customEnd', null);

  const apiAccountId = selectedAccountId === 'all' ? undefined : selectedAccountId;
  const dateRange = datePreset === 'custom'
    ? {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      }
    : computeDateRange(datePreset);

  // Fetch real data
  const { data: performance, isLoading: perfLoading } = useTradePerformance(
    dateRange.startDate, dateRange.endDate, apiAccountId
  );
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(
    dateRange.startDate, dateRange.endDate, apiAccountId
  );

  const isLoading = perfLoading || summaryLoading;

  // Derive symbol data from performanceByAssetType
  const symbolEntries = summary?.performanceByAssetType
    ? Object.entries(summary.performanceByAssetType).map(([symbol, pnl]) => ({
        symbol,
        total: pnl,
      }))
    : [];

  // Derive direction data from performanceByDirection
  const directionEntries = summary?.performanceByDirection
    ? Object.entries(summary.performanceByDirection).map(([direction, pnl]) => ({
        direction,
        total: pnl,
      }))
    : [];

  return (
    <DashboardLayout pageTitle={t('pages.performance')}>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <DashboardDateFilter
            preset={datePreset}
            onPresetChange={setDatePreset}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStartChange={setCustomStart}
            onCustomEndChange={setCustomEnd}
          />
          <AccountSelector
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Performance summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('performance.netPnl')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className={cn("text-2xl font-bold",
                    (performance?.totalProfitLoss ?? 0) >= 0 ? "text-profit" : "text-loss"
                  )}>
                    {formatCurrency(performance?.totalProfitLoss ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.totalTrades', { count: performance?.totalTrades ?? 0 })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('insights.winRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(performance?.winRate ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.winsOutOfTrades', {
                      wins: performance?.winningTrades ?? 0,
                      total: performance?.totalTrades ?? 0
                    })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('insights.profitFactor')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(performance?.profitFactor ?? 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('performance.grossProfitOverLoss')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance charts */}
        <PerformanceChart />

        {/* Performance breakdown tables */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('insights.performanceAnalysis')}</CardTitle>
                <CardDescription>{t('performance.detailedBreakdown')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {t('common.filter')}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  {t('common.export')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="symbols">
              <TabsList>
                <TabsTrigger value="symbols">{t('performance.symbols')}</TabsTrigger>
                <TabsTrigger value="direction">{t('performance.direction', 'Direction')}</TabsTrigger>
              </TabsList>

              <TabsContent value="symbols" className="mt-4">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : symbolEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData', 'No data available')}</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-sm">{t('performance.symbol')}</th>
                          <th className="text-right py-3 px-4 font-medium text-sm">{t('performance.netPnl')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {symbolEntries
                          .sort((a, b) => b.total - a.total)
                          .map((item) => (
                          <tr key={item.symbol} className="border-b">
                            <td className="py-3 px-4 text-sm">{item.symbol}</td>
                            <td className={cn("py-3 px-4 text-sm font-medium text-right",
                              item.total >= 0 ? "text-profit" : "text-loss")}>
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="direction" className="mt-4">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : directionEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData', 'No data available')}</p>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-sm">{t('common.direction', 'Direction')}</th>
                          <th className="text-right py-3 px-4 font-medium text-sm">{t('performance.netPnl')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directionEntries.map((item) => (
                          <tr key={item.direction} className="border-b">
                            <td className="py-3 px-4 text-sm">{item.direction}</td>
                            <td className={cn("py-3 px-4 text-sm font-medium text-right",
                              item.total >= 0 ? "text-profit" : "text-loss")}>
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Performance;
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/pages/Performance.tsx
git commit -m "feat: wire Performance page to real API data (remove hardcoded mocks)"
```

---

## Task 10: Create StrategyDialog Component

**Files:**
- Create: `src/components/settings/StrategyDialog.tsx`

**Step 1: Create the dialog component**

Create `src/components/settings/StrategyDialog.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { StrategyResponseDto, StrategyRequestDto } from '@/types/dto';

interface StrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategy?: StrategyResponseDto | null;
  onSave: (data: StrategyRequestDto) => Promise<void>;
  isSaving: boolean;
}

const StrategyDialog: React.FC<StrategyDialogProps> = ({
  open,
  onOpenChange,
  strategy,
  onSave,
  isSaving,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const isEditing = !!strategy;

  useEffect(() => {
    if (strategy) {
      setName(strategy.name);
      setDescription(strategy.description || '');
      setActive(strategy.active);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
  }, [strategy, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      active,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t('settings.editStrategy', 'Edit Strategy')
                : t('settings.createStrategy', 'Create Strategy')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t('settings.editStrategyDescription', 'Update your trading strategy details.')
                : t('settings.createStrategyDescription', 'Add a new trading strategy to organize your trades.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strategy-name">{t('settings.strategyName', 'Name')}</Label>
              <Input
                id="strategy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.strategyNamePlaceholder', 'Enter a name for your strategy')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy-description">{t('common.description', 'Description')}</Label>
              <Input
                id="strategy-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('settings.strategyDescriptionPlaceholder', 'Optional description')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="strategy-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="strategy-active">{t('common.active', 'Active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyDialog;
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/settings/StrategyDialog.tsx
git commit -m "feat: add StrategyDialog component for create/edit"
```

---

## Task 11: Create TagDialog Component

**Files:**
- Create: `src/components/settings/TagDialog.tsx`

**Step 1: Create the dialog component**

Create `src/components/settings/TagDialog.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { TagResponseDto, TagRequestDto } from '@/types/dto';

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: TagResponseDto | null;
  onSave: (data: TagRequestDto) => Promise<void>;
  isSaving: boolean;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#000000',
];

const TagDialog: React.FC<TagDialogProps> = ({
  open,
  onOpenChange,
  tag,
  onSave,
  isSaving,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const isEditing = !!tag;

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
    } else {
      setName('');
      setColor('#3B82F6');
    }
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t('settings.editTag', 'Edit Tag')
                : t('settings.createTag', 'Create Tag')}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t('settings.editTagDescription', 'Update your tag details.')
                : t('settings.createTagDescription', 'Add a new tag to categorize your trades.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">{t('common.name', 'Name')}</Label>
              <Input
                id="tag-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.tagNamePlaceholder', 'Enter tag name')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.tagColor', 'Color')}</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="tag-color-custom" className="text-xs text-muted-foreground">
                  {t('settings.customColor', 'Custom')}:
                </Label>
                <Input
                  id="tag-color-custom"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-8 p-0 border-0 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TagDialog;
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/settings/TagDialog.tsx
git commit -m "feat: add TagDialog component with color picker"
```

---

## Task 12: Create StrategiesSection Component

**Files:**
- Create: `src/components/settings/StrategiesSection.tsx`

**Step 1: Create the strategies management section**

Create `src/components/settings/StrategiesSection.tsx`:

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy } from '@/hooks/useStrategies';
import StrategyDialog from './StrategyDialog';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/services/apiClient';
import type { StrategyResponseDto, StrategyRequestDto } from '@/types/dto';

const StrategiesSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: strategies, isLoading } = useStrategies();
  const createMutation = useCreateStrategy();
  const updateMutation = useUpdateStrategy();
  const deleteMutation = useDeleteStrategy();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StrategyResponseDto | null>(null);

  const handleCreate = () => {
    setEditingStrategy(null);
    setDialogOpen(true);
  };

  const handleEdit = (strategy: StrategyResponseDto) => {
    setEditingStrategy(strategy);
    setDialogOpen(true);
  };

  const handleSave = async (data: StrategyRequestDto) => {
    try {
      if (editingStrategy) {
        await updateMutation.mutateAsync({ id: editingStrategy.id, data });
        toast({ title: t('settings.strategyUpdated', 'Strategy updated') });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: t('settings.strategyCreated', 'Strategy created') });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: getApiErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: t('settings.strategyDeleted', 'Strategy deleted') });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: getApiErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.strategies', 'Strategies')}</CardTitle>
              <CardDescription>
                {t('settings.strategiesDescription', 'View and manage your trading strategies')}
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('settings.addStrategy', 'Add Strategy')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !strategies || strategies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('settings.noStrategies', 'No strategies yet. Create one to get started.')}
            </p>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{strategy.name}</p>
                      {strategy.description && (
                        <p className="text-xs text-muted-foreground">{strategy.description}</p>
                      )}
                    </div>
                    <Badge variant={strategy.active ? 'default' : 'secondary'}>
                      {strategy.active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(strategy)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(strategy)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StrategyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        strategy={editingStrategy}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteStrategy', 'Delete Strategy')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteStrategyConfirm', 'Are you sure you want to delete "{{name}}"? This cannot be undone.', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StrategiesSection;
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/settings/StrategiesSection.tsx
git commit -m "feat: add StrategiesSection with CRUD for Settings page"
```

---

## Task 13: Create TagsSection Component

**Files:**
- Create: `src/components/settings/TagsSection.tsx`

**Step 1: Create the tags management section**

Create `src/components/settings/TagsSection.tsx`:

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags';
import TagDialog from './TagDialog';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/services/apiClient';
import type { TagResponseDto, TagRequestDto } from '@/types/dto';

const TagsSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: tags, isLoading } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagResponseDto | null>(null);

  const handleCreate = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const handleEdit = (tag: TagResponseDto) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleSave = async (data: TagRequestDto) => {
    try {
      if (editingTag) {
        await updateMutation.mutateAsync({ id: editingTag.id, data });
        toast({ title: t('settings.tagUpdated', 'Tag updated') });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: t('settings.tagCreated', 'Tag created') });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: getApiErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: t('settings.tagDeleted', 'Tag deleted') });
      setDeleteTarget(null);
    } catch (error) {
      toast({ title: getApiErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.tags', 'Tags')}</CardTitle>
              <CardDescription>
                {t('settings.tagsDescription', 'Create and manage tags to categorize your trades')}
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('settings.addTag', 'Add Tag')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !tags || tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('settings.noTags', 'No tags yet. Create one to categorize your trades.')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-2 px-3 rounded-lg border group"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(tag)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteTarget(tag)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteTag', 'Delete Tag')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteTagConfirm', 'Are you sure you want to delete "{{name}}"? This cannot be undone.', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TagsSection;
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/settings/TagsSection.tsx
git commit -m "feat: add TagsSection with CRUD for Settings page"
```

---

## Task 14: Wire Settings Page with Strategies + Tags Tabs

**Files:**
- Modify: `src/pages/Settings.tsx`

**Step 1: Add imports to Settings.tsx**

At the top of `src/pages/Settings.tsx`, add after existing imports:

```typescript
import StrategiesSection from '@/components/settings/StrategiesSection';
import TagsSection from '@/components/settings/TagsSection';
```

**Step 2: Add new TabsTriggers**

In `src/pages/Settings.tsx`, find the `TabsList` (around line 402-406) and add two new triggers after `security`:

```tsx
                        <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
                        <TabsTrigger value="strategies">{t('settings.strategies', 'Strategies')}</TabsTrigger>
                        <TabsTrigger value="tags">{t('settings.tags', 'Tags')}</TabsTrigger>
```

**Step 3: Add new TabsContent sections**

After the `</TabsContent>` for `security` (around line 821), add:

```tsx
                    <TabsContent value="strategies" className="space-y-6">
                        <StrategiesSection />
                    </TabsContent>

                    <TabsContent value="tags" className="space-y-6">
                        <TagsSection />
                    </TabsContent>
```

**Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add Strategies and Tags tabs to Settings page"
```

---

## Task 15: Add i18n Translation Keys

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/fr.json`

**Step 1: Add English translation keys**

Add the following keys to the appropriate sections in `src/i18n/locales/en.json`:

Under `"settings"`:
```json
    "strategies": "Strategies",
    "strategiesDescription": "View and manage your trading strategies",
    "addStrategy": "Add Strategy",
    "createStrategy": "Create Strategy",
    "createStrategyDescription": "Add a new trading strategy to organize your trades.",
    "editStrategy": "Edit Strategy",
    "editStrategyDescription": "Update your trading strategy details.",
    "deleteStrategy": "Delete Strategy",
    "deleteStrategyConfirm": "Are you sure you want to delete \"{{name}}\"? This cannot be undone.",
    "strategyCreated": "Strategy created",
    "strategyUpdated": "Strategy updated",
    "strategyDeleted": "Strategy deleted",
    "noStrategies": "No strategies yet. Create one to get started.",
    "strategyNamePlaceholder": "Enter a name for your strategy",
    "strategyDescriptionPlaceholder": "Optional description",
    "tags": "Tags",
    "tagsDescription": "Create and manage tags to categorize your trades",
    "addTag": "Add Tag",
    "createTag": "Create Tag",
    "createTagDescription": "Add a new tag to categorize your trades.",
    "editTag": "Edit Tag",
    "editTagDescription": "Update your tag details.",
    "deleteTag": "Delete Tag",
    "deleteTagConfirm": "Are you sure you want to delete \"{{name}}\"? This cannot be undone.",
    "tagCreated": "Tag created",
    "tagUpdated": "Tag updated",
    "tagDeleted": "Tag deleted",
    "noTags": "No tags yet. Create one to categorize your trades.",
    "tagNamePlaceholder": "Enter tag name",
    "tagColor": "Color",
    "customColor": "Custom"
```

Under `"dashboard"`:
```json
    "openPositions": "Open Positions",
    "noOpenPositions": "No open positions",
    "unrealizedPnL": "Unrealized P&L",
    "recentPerformance": "Recent Daily Performance",
    "noPerformanceData": "No performance data available"
```

Under `"performance"`:
```json
    "direction": "Direction",
    "totalTrades": "{{count}} trades"
```

Under `"common"`:
```json
    "active": "Active",
    "inactive": "Inactive",
    "noData": "No data available",
    "create": "Create",
    "name": "Name"
```

**Step 2: Add French translation keys**

Add equivalent French translations to `src/i18n/locales/fr.json` (same keys, French values).

**Step 3: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/fr.json
git commit -m "feat: add i18n keys for strategies, tags, dashboard panels"
```

---

## Task 16: Final Verification

**Step 1: Run type check**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx tsc --noEmit`
Expected: No type errors

**Step 2: Run dev server and smoke test**

Run: `npm run dev`
Expected: App starts without errors. Navigate to:
- `/dashboard` — should show new DailyPerformance + OpenPositions panels
- `/performance` — should show real API data (or loading states if backend isn't running)
- `/settings` — should show Strategies and Tags tabs

**Step 3: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: address any type or rendering issues from frontend sync"
```

---

## Summary

| Task | Description | Files |
|------|------------|-------|
| 1 | Add types to dto.ts + metrics.service.ts | 2 modified |
| 2 | Strategy service | 1 created |
| 3 | Tag service | 1 created |
| 4 | useStrategies hooks | 1 created |
| 5 | useTags hooks | 1 created |
| 6 | OpenPositionsPanel | 1 created |
| 7 | DailyPerformanceChart | 1 created |
| 8 | Wire Dashboard | 1 modified |
| 9 | Wire Performance page | 1 modified |
| 10 | StrategyDialog | 1 created |
| 11 | TagDialog | 1 created |
| 12 | StrategiesSection | 1 created |
| 13 | TagsSection | 1 created |
| 14 | Wire Settings page | 1 modified |
| 15 | i18n keys | 2 modified |
| 16 | Final verification | — |

**Total: 10 files created, 6 files modified, 16 tasks, ~16 commits**
