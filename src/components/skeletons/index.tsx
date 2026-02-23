import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// StatCardSkeleton - matches the TradingStats stat card layout
// ---------------------------------------------------------------------------
export function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-2" />
        <Skeleton className="h-1.5 w-full mt-4 rounded-full" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// StatsRowSkeleton - row of 4 stat cards (matches TradingStats layout)
// ---------------------------------------------------------------------------
export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChartCardSkeleton - matches PerformanceChart / equity curve cards
// ---------------------------------------------------------------------------
export function ChartCardSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 mt-1" />
      </CardHeader>
      <CardContent className="p-6">
        <Skeleton className="w-full rounded-md" style={{ height }} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TableRowSkeleton - a single skeleton row for a data table
// ---------------------------------------------------------------------------
export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// TradeTableSkeleton - matches the TradeTable / TradesTableWrapper layout
// ---------------------------------------------------------------------------
export function TradeTableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-48 mt-1" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="py-3 px-4">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AccountSummarySkeleton - matches the AccountSummary layout (metrics + risk)
// ---------------------------------------------------------------------------
export function AccountSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56 mt-1" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mt-3" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 border rounded-xl">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20 mt-2" />
              <Skeleton className="h-2 w-full mt-4" />
            </div>
            <div className="p-4 border rounded-xl">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-24 mt-2" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12 mt-1" />
                </div>
                <div>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-14 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200/50 dark:border-white/5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-44 mt-1" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
            <div className="pt-4 border-t flex justify-between">
              <div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-14 mt-1" />
              </div>
              <div className="text-right">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-14 mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalendarSkeleton - matches TradingCalendar layout
// ---------------------------------------------------------------------------
export function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-48 mt-1" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`h-${i}`} className="h-4 w-full" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={`d-${i}`} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AccountCardSkeleton - matches the Accounts page account list items
// ---------------------------------------------------------------------------
export function AccountCardSkeleton() {
  return (
    <div className="mb-4 last:mb-0 border rounded-lg overflow-hidden">
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between border-b">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24 mt-2" />
        </div>
        <div className="mt-2 md:mt-0 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="bg-muted/40 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AccountsListSkeleton - matches the Accounts page list of account cards
// ---------------------------------------------------------------------------
export function AccountsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// DashboardSkeleton - full dashboard page skeleton matching all sections
// ---------------------------------------------------------------------------
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Stats row (4 cards) */}
      <StatsRowSkeleton count={4} />

      {/* Performance charts (2-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton height={300} />
        <ChartCardSkeleton height={300} />
      </div>

      {/* Account summary */}
      <AccountSummarySkeleton />

      {/* Trade table + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <TradeTableSkeleton rows={5} columns={5} />
        <CalendarSkeleton />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SummaryCardSkeleton - small summary card (used in Accounts page header)
// ---------------------------------------------------------------------------
export function SummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-3 w-28 mt-2" />
      </CardContent>
    </Card>
  );
}
