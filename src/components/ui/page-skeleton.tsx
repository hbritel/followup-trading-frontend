import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface PageSkeletonProps {
  /** Optional heading shown above the skeleton (e.g. page title) */
  title?: string;
  /** Number of skeleton cards to render — used by 'cards' variant */
  cardCount?: number;
  /** Layout variant */
  variant?: 'cards' | 'table' | 'detail';
}

// ---------------------------------------------------------------------------
// Cards variant — N skeleton cards in a responsive grid
// ---------------------------------------------------------------------------
function CardsVariant({ cardCount = 4 }: { cardCount: number }) {
  return (
    <div className="space-y-6">
      {/* Filter / header bar placeholder */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stat cards grid */}
      <div
        className={`grid gap-4 ${
          cardCount <= 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : cardCount === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i} className="glass-card rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary content placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card rounded-2xl">
          <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48 mt-1" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="w-full rounded-md" style={{ height: 240 }} />
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48 mt-1" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="w-full rounded-md" style={{ height: 240 }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table variant — skeleton header row + data rows
// ---------------------------------------------------------------------------
function TableVariant() {
  return (
    <div className="space-y-4">
      {/* Toolbar row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <Card className="glass-card rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48 mt-1" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <Skeleton className="h-3 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, row) => (
                  <tr key={row} className="border-b">
                    {Array.from({ length: 7 }).map((__, col) => (
                      <td key={col} className="py-3 px-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail variant — skeleton for a detail / settings page layout
// ---------------------------------------------------------------------------
function DetailVariant() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Summary cards strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-9 w-9 rounded-lg mb-2" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content panel */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-52 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-20 mt-1.5" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageSkeleton — main export, dispatches to variant
// ---------------------------------------------------------------------------
const PageSkeleton: React.FC<PageSkeletonProps> = ({
  title,
  cardCount = 4,
  variant = 'cards',
}) => {
  return (
    <div className="flex flex-col gap-6">
      {title && (
        <div>
          <Skeleton className="h-7 w-48" />
        </div>
      )}
      {variant === 'cards' && <CardsVariant cardCount={cardCount} />}
      {variant === 'table' && <TableVariant />}
      {variant === 'detail' && <DetailVariant />}
    </div>
  );
};

export default PageSkeleton;
