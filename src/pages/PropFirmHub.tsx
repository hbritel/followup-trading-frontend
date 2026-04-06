import React, { useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Plus, Target, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

import { usePropFirms, useEvaluations } from '@/hooks/usePropFirm';
import PlanBadge from '@/components/subscription/PlanBadge';
import PlanGatedSection from '@/components/subscription/PlanGatedSection';
import PropFirmCard from '@/components/propfirm/PropFirmCard';
import EvaluationCard from '@/components/propfirm/EvaluationCard';
import StartEvaluationDialog from '@/components/propfirm/StartEvaluationDialog';
import type { PropFirmEvaluation, PropFirmProfile } from '@/types/propfirm';

// Prop Firm Tracker requires PRO plan or above
const REQUIRED_PLAN = 'PRO' as const;

type EvaluationFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED_EXPIRED';

const FILTER_LABELS: Record<EvaluationFilter, string> = {
  ALL: 'All',
  ACTIVE: 'Active',
  COMPLETED: 'Passed / Funded',
  FAILED_EXPIRED: 'Failed / Expired',
};

const matchesFilter = (ev: PropFirmEvaluation, filter: EvaluationFilter): boolean => {
  if (filter === 'ALL') return true;
  if (filter === 'ACTIVE') return ev.status === 'ACTIVE';
  if (filter === 'COMPLETED') return ev.status === 'PASSED' || ev.status === 'FUNDED';
  if (filter === 'FAILED_EXPIRED') return ev.status === 'FAILED' || ev.status === 'EXPIRED';
  return true;
};

const PropFirmHubSkeleton = () => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-9 w-36" />
    </div>
    <div>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
    <div>
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  </div>
);

const PropFirmHub = () => {
  const { data: firms = [], isLoading: firmsLoading } = usePropFirms();
  const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [preselectedFirm, setPreselectedFirm] = useState<PropFirmProfile | null>(null);
  const [evalFilter, setEvalFilter] = useState<EvaluationFilter>('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');

  const catalogRef = useRef<HTMLElement | null>(null);

  const isLoading = firmsLoading || evaluationsLoading;

  // Counts per filter bucket
  const activeCount = evaluations.filter((e) => e.status === 'ACTIVE').length;
  const passedCount = evaluations.filter(
    (e) => e.status === 'PASSED' || e.status === 'FUNDED',
  ).length;
  const failedCount = evaluations.filter(
    (e) => e.status === 'FAILED' || e.status === 'EXPIRED',
  ).length;

  // Filtered evaluations
  const filteredEvaluations = evaluations.filter((e) => matchesFilter(e, evalFilter));

  // Filtered firm catalog
  const filteredFirms = catalogSearch.trim()
    ? firms.filter((f) =>
        f.firmName.toLowerCase().includes(catalogSearch.trim().toLowerCase()),
      )
    : firms;

  const handleStartFromCard = (firm: PropFirmProfile) => {
    setPreselectedFirm(firm);
    setDialogOpen(true);
  };

  const handleStartNew = () => {
    setPreselectedFirm(null);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setPreselectedFirm(null);
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Prop Firm Tracker">
        <PropFirmHubSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Prop Firm Tracker">
      <PageTransition className="space-y-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gradient">Prop Firm Tracker</h1>
              <PlanBadge plan={REQUIRED_PLAN} size="sm" />
              {activeCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  {activeCount} active
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Track your prop firm challenges, monitor compliance rules, and manage your funded
              account journey.
            </p>
          </div>
          <Button onClick={handleStartNew} className="shrink-0 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Start Evaluation
          </Button>
        </div>

        <PlanGatedSection
          requiredPlan={REQUIRED_PLAN}
          feature="Prop Firm Tracker requires a Pro plan or above."
          showBlurredPreview={true}
        >
          {/* My Evaluations */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">My Evaluations</h2>
              </div>

              {/* Filter button group — only shown when there are evaluations */}
              {evaluations.length > 0 && (
                <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-0.5">
                  {(Object.keys(FILTER_LABELS) as EvaluationFilter[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEvalFilter(key)}
                      className={cn(
                        'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                        evalFilter === key
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {FILTER_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary strip */}
            {evaluations.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                  {activeCount} active
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                  {passedCount} passed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                  {failedCount} failed
                </span>
              </div>
            )}

            {evaluations.length === 0 ? (
              /* Nicer empty state with illustration + CTA */
              <div className="glass-card rounded-2xl border-dashed border-2 p-12 flex flex-col items-center justify-center text-center gap-5">
                {/* Simple SVG illustration */}
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="opacity-80"
                >
                  <circle cx="40" cy="40" r="40" className="fill-primary/8" />
                  <circle cx="40" cy="40" r="28" className="fill-primary/12" />
                  {/* Trophy cup body */}
                  <path
                    d="M28 26h24v16c0 8.837-5.373 16-12 16s-12-7.163-12-16V26z"
                    className="fill-primary/30"
                  />
                  {/* Trophy handles */}
                  <path
                    d="M28 30h-4a4 4 0 0 0 0 8h4M52 30h4a4 4 0 0 1 0 8h-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="stroke-primary/50"
                  />
                  {/* Trophy stem */}
                  <rect x="36" y="58" width="8" height="6" rx="1" className="fill-primary/30" />
                  {/* Trophy base */}
                  <rect x="30" y="64" width="20" height="3" rx="1.5" className="fill-primary/40" />
                  {/* Star in trophy */}
                  <path
                    d="M40 33l1.5 4.5h4.5l-3.75 2.75 1.5 4.5L40 42l-3.75 2.75 1.5-4.5L34 37.5h4.5L40 33z"
                    className="fill-primary/60"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-base">No evaluations yet</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Start your first prop firm challenge and track your progress toward a funded
                    account.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleStartNew} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Start your first evaluation
                  </Button>
                  <Button variant="ghost" size="sm" onClick={scrollToCatalog}>
                    Browse catalog
                  </Button>
                </div>
              </div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                <Target className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No evaluations match the selected filter.
                </p>
                <button
                  type="button"
                  onClick={() => setEvalFilter('ALL')}
                  className="text-xs text-primary hover:underline"
                >
                  Show all evaluations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvaluations.map((evaluation) => (
                  <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                ))}
              </div>
            )}
          </section>

          {/* Prop Firm Catalog */}
          <section
            className="space-y-4"
            ref={(el) => {
              catalogRef.current = el;
            }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">Prop Firm Catalog</h2>
                <span className="text-xs text-muted-foreground ml-1">
                  {filteredFirms.length === firms.length
                    ? `${firms.length} ${firms.length === 1 ? 'firm' : 'firms'}`
                    : `${filteredFirms.length} of ${firms.length}`}
                </span>
              </div>

              {/* Search input */}
              {firms.length > 3 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    className="h-8 pl-8 w-44 text-xs"
                    placeholder="Search firms..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>
              )}
            </div>

            {firms.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3">
                <Trophy className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No prop firms in the catalog yet.</p>
              </div>
            ) : filteredFirms.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No firms match &ldquo;{catalogSearch}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="text-xs text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFirms.map((firm) => (
                  <PropFirmCard
                    key={firm.id}
                    firm={firm}
                    onStartEvaluation={handleStartFromCard}
                  />
                ))}
              </div>
            )}
          </section>
        </PlanGatedSection>
      </PageTransition>

      <StartEvaluationDialog
        firms={firms}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        defaultFirmCode={preselectedFirm?.firmCode}
      />
    </DashboardLayout>
  );
};

export default PropFirmHub;
