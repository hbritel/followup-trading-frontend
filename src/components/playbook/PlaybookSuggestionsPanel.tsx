import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  usePlaybookSuggestions,
  useGeneratePlaybook,
  useApplySuggestion,
  useDismissSuggestion,
} from '@/hooks/usePlaybook';
import { useSubscription } from '@/hooks/useSubscription';
import PlaybookSuggestionCard from './PlaybookSuggestionCard';
import type { PlaybookSuggestionDto } from '@/types/dto';

const PAID_PLANS = new Set(['STARTER', 'PRO', 'ELITE']);

const groupByStatus = (suggestions: ReadonlyArray<PlaybookSuggestionDto>) => {
  const pending: PlaybookSuggestionDto[] = [];
  const applied: PlaybookSuggestionDto[] = [];
  const dismissed: PlaybookSuggestionDto[] = [];

  for (const s of suggestions) {
    if (s.status === 'PENDING') pending.push(s);
    else if (s.status === 'APPLIED') applied.push(s);
    else dismissed.push(s);
  }

  return { pending, applied, dismissed } as const;
};

const SuggestionSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl border border-white/[0.04] p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

interface CollapsibleSectionProps {
  readonly label: string;
  readonly count: number;
  readonly children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  label,
  count,
  children,
}) => {
  const [open, setOpen] = React.useState(false);

  if (count === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              open ? 'rotate-0' : '-rotate-90'
            }`}
          />
          <span className="font-medium">{label}</span>
          <span className="ml-auto text-xs tabular-nums opacity-60">
            {count}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
};

const PlaybookSuggestionsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { data: suggestions, isLoading } = usePlaybookSuggestions();
  const { data: subscription } = useSubscription();
  const generateMutation = useGeneratePlaybook();
  const applyMutation = useApplySuggestion();
  const dismissMutation = useDismissSuggestion();

  const currentPlan = subscription?.plan ?? 'FREE';
  const canApply = PAID_PLANS.has(currentPlan);
  const isMutating = applyMutation.isPending || dismissMutation.isPending;

  const { pending, applied, dismissed } = groupByStatus(suggestions ?? []);

  const renderCards = (
    items: ReadonlyArray<PlaybookSuggestionDto>,
  ) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <PlaybookSuggestionCard
          key={s.id}
          suggestion={s}
          onApply={(id) => applyMutation.mutate(id)}
          onDismiss={(id) => dismissMutation.mutate(id)}
          canApply={canApply}
          isPending={isMutating}
        />
      ))}
    </div>
  );

  return (
    <section aria-labelledby="ai-suggestions-heading" className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-primary" />
          <h2
            id="ai-suggestions-heading"
            className="text-base font-semibold tracking-tight"
          >
            {t('playbook.aiSuggestions')}
          </h2>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`}
          />
          {t('playbook.generate')}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SuggestionSkeleton />
          <SuggestionSkeleton />
          <SuggestionSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (suggestions ?? []).length === 0 && (
        <div className="glass-card rounded-2xl border border-dashed border-white/[0.08] p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t('playbook.empty')}
          </p>
        </div>
      )}

      {/* Pending suggestions (main focus) */}
      {!isLoading && pending.length > 0 && renderCards(pending)}

      {/* Applied section */}
      {!isLoading && applied.length > 0 && (
        <CollapsibleSection
          label={t('playbook.applied')}
          count={applied.length}
        >
          {renderCards(applied)}
        </CollapsibleSection>
      )}

      {/* Dismissed section */}
      {!isLoading && dismissed.length > 0 && (
        <CollapsibleSection
          label={t('playbook.dismissed')}
          count={dismissed.length}
        >
          {renderCards(dismissed)}
        </CollapsibleSection>
      )}
    </section>
  );
};

export default PlaybookSuggestionsPanel;
