# Per-Page Filter Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remember filter selections (account, status, search, etc.) per page across navigation, scoped to the browser session.

**Architecture:** A `PageFiltersContext` holds a `Map<string, Record<string, any>>` in memory. Each page calls `usePageFilters(pageKey)` to read/write its own filter bag. State lives as long as the React app is mounted (session-scoped, no localStorage/API).

**Tech Stack:** React Context API, TypeScript

**Frontend codebase:** `/Users/hicham/Developer/workspaces/followup_trading/front-end-lovable`

---

### Task 1: Create PageFiltersContext and usePageFilters hook

**Files:**
- Create: `src/contexts/page-filters-context.tsx`

**Step 1: Create the context, provider, and hook**

```tsx
// src/contexts/page-filters-context.tsx
import React, { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type FilterMap = Record<string, unknown>;

interface PageFiltersContextType {
  getFilter: <T>(pageKey: string, filterKey: string, defaultValue: T) => T;
  setFilter: <T>(pageKey: string, filterKey: string, value: T) => void;
  resetPage: (pageKey: string) => void;
}

const PageFiltersContext = createContext<PageFiltersContextType | undefined>(undefined);

export const PageFiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use ref for storage to avoid re-rendering every consumer on any filter change.
  // Individual pages trigger their own re-renders via local state.
  const store = useRef<Record<string, FilterMap>>({});

  const getFilter = useCallback(<T,>(pageKey: string, filterKey: string, defaultValue: T): T => {
    const pageFilters = store.current[pageKey];
    if (!pageFilters || !(filterKey in pageFilters)) return defaultValue;
    return pageFilters[filterKey] as T;
  }, []);

  const setFilter = useCallback(<T,>(pageKey: string, filterKey: string, value: T): void => {
    if (!store.current[pageKey]) {
      store.current[pageKey] = {};
    }
    store.current[pageKey][filterKey] = value;
  }, []);

  const resetPage = useCallback((pageKey: string): void => {
    delete store.current[pageKey];
  }, []);

  return (
    <PageFiltersContext.Provider value={{ getFilter, setFilter, resetPage }}>
      {children}
    </PageFiltersContext.Provider>
  );
};

/**
 * Hook for pages to persist filters across navigation.
 *
 * Usage:
 *   const [account, setAccount] = usePageFilter('trades', 'accountId', 'all');
 */
export function usePageFilter<T>(pageKey: string, filterKey: string, defaultValue: T): [T, (v: T) => void] {
  const ctx = useContext(PageFiltersContext);
  if (!ctx) throw new Error('usePageFilter must be used within PageFiltersProvider');

  // Initialize from stored value (survives remount) or use default
  const [value, setValue] = useState<T>(() => ctx.getFilter(pageKey, filterKey, defaultValue));

  const set = useCallback((v: T) => {
    ctx.setFilter(pageKey, filterKey, v);
    setValue(v);
  }, [ctx, pageKey, filterKey]);

  return [value, set];
}

export function useResetPageFilters() {
  const ctx = useContext(PageFiltersContext);
  if (!ctx) throw new Error('useResetPageFilters must be used within PageFiltersProvider');
  return ctx.resetPage;
}
```

**Step 2: Verify no syntax errors**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx tsc --noEmit src/contexts/page-filters-context.tsx 2>&1 | head -20`

If tsc standalone doesn't resolve path aliases, just run the full build check in Task 2 after wiring it up.

**Step 3: Commit**

```bash
git add src/contexts/page-filters-context.tsx
git commit -m "feat: add PageFiltersContext for per-page filter persistence"
```

---

### Task 2: Wire PageFiltersProvider into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add the provider wrapping all routes**

Add import at the top of `src/App.tsx`:
```tsx
import { PageFiltersProvider } from '@/contexts/page-filters-context';
```

Wrap routes inside the existing provider stack. Place it inside `PreferencesProvider` (it has no dependencies on other providers):

Change:
```tsx
<PreferencesProvider>
  <Routes>
```
To:
```tsx
<PreferencesProvider>
  <PageFiltersProvider>
    <Routes>
```

And the matching closing tag — change:
```tsx
  </Routes>
</PreferencesProvider>
```
To:
```tsx
    </Routes>
  </PageFiltersProvider>
</PreferencesProvider>
```

**Step 2: Verify the app compiles**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx vite build 2>&1 | tail -10`

Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire PageFiltersProvider into App component tree"
```

---

### Task 3: Migrate Dashboard.tsx to usePageFilter

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Replace useState with usePageFilter**

Replace this import:
```tsx
import React, { useState } from 'react';
```
With:
```tsx
import React from 'react';
import { usePageFilter } from '@/contexts/page-filters-context';
```

Replace this line:
```tsx
const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
```
With:
```tsx
const [selectedAccountId, setSelectedAccountId] = usePageFilter('dashboard', 'accountId', 'all');
```

No other changes needed — the rest of the component already uses `selectedAccountId` and `setSelectedAccountId`.

**Step 2: Verify the app compiles**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx vite build 2>&1 | tail -10`

Expected: Build succeeds.

**Step 3: Manual smoke test**

1. Run `npm run dev`
2. Go to Dashboard, select a specific account
3. Navigate to Trades page
4. Navigate back to Dashboard
5. Verify the account filter is still set to the previously selected account

**Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: persist Dashboard account filter across navigation"
```

---

### Task 4: Migrate Trades.tsx to usePageFilter

**Files:**
- Modify: `src/pages/Trades.tsx`

This page has many filters to persist: `accountFilter`, `currentPage`, `itemsPerPage`, `searchQuery`, `statusFilter`, `typeFilter`, `startDate`, `endDate`.

**Step 1: Add import**

Replace:
```tsx
import React, { useState, useEffect } from 'react';
```
With:
```tsx
import React, { useState, useEffect } from 'react';
import { usePageFilter } from '@/contexts/page-filters-context';
```

**Step 2: Replace filter useState calls with usePageFilter**

Replace these lines (around lines 25-27):
```tsx
  const [accountFilter, setAccountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
```
With:
```tsx
  const [accountFilter, setAccountFilter] = usePageFilter('trades', 'accountId', 'all');
  const [currentPage, setCurrentPage] = usePageFilter('trades', 'currentPage', 1);
  const [itemsPerPage, setItemsPerPage] = usePageFilter('trades', 'itemsPerPage', 10);
```

Replace these lines (around lines 90-96):
```tsx
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
```
With:
```tsx
  const [searchQuery, setSearchQuery] = usePageFilter<string>('trades', 'searchQuery', '');
  const [statusFilter, setStatusFilter] = usePageFilter('trades', 'statusFilter', 'all');
  const [typeFilter, setTypeFilter] = usePageFilter('trades', 'typeFilter', 'all');
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = usePageFilter<Date | null>('trades', 'startDate', null);
  const [endDate, setEndDate] = usePageFilter<Date | null>('trades', 'endDate', null);
```

Note: `showColumnFilter` and `showDateFilter` stay as `useState` — these are transient UI toggles, not user-facing filters worth persisting.

**Step 3: Verify the app compiles**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx vite build 2>&1 | tail -10`

Expected: Build succeeds.

**Step 4: Manual smoke test**

1. Run `npm run dev`
2. Go to Trades, select account "XM", set status to "closed", type some search text
3. Navigate to Dashboard
4. Navigate back to Trades
5. Verify: account=XM, status=closed, search text preserved, page number preserved

**Step 5: Commit**

```bash
git add src/pages/Trades.tsx
git commit -m "feat: persist Trades page filters across navigation"
```

---

### Task 5: Final verification

**Step 1: Full build check**

Run: `cd /Users/hicham/Developer/workspaces/followup_trading/front-end-lovable && npx vite build 2>&1 | tail -10`

Expected: Build succeeds, no TypeScript errors.

**Step 2: Cross-page independence test**

1. Go to Dashboard, select Account A
2. Go to Trades, select Account B, set status=open
3. Go back to Dashboard — should still show Account A
4. Go back to Trades — should still show Account B + status=open
5. Refresh the browser — all filters should reset to defaults (session-only)

**Step 3: Commit (if any fixes were needed)**
