import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Maximize2,
  Minimize2,
  Timer,
  Target,
  TrendingUp,
  Undo2,
  Trash2,
  Info,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PlaybookSuggestionDto } from '@/types/dto';

const TYPE_ICONS: Record<PlaybookSuggestionDto['type'], LucideIcon> = {
  PREMATURE_EXIT: Clock,
  STOP_TOO_WIDE: Maximize2,
  STOP_TOO_TIGHT: Minimize2,
  BEST_TIME_FILTER: Timer,
  SYMBOL_FOCUS: Target,
};

const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
} as const;

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH' as const;
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM' as const;
  return 'LOW' as const;
};

const CONFIDENCE_STYLES: Record<string, string> = {
  HIGH: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  MEDIUM: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  LOW: 'bg-red-500/15 text-red-400 ring-red-500/20',
};

const CONFIDENCE_I18N_KEYS: Record<string, string> = {
  HIGH: 'playbook.confidenceHigh',
  MEDIUM: 'playbook.confidenceMedium',
  LOW: 'playbook.confidenceLow',
};

interface PlaybookSuggestionCardProps {
  readonly suggestion: PlaybookSuggestionDto;
  readonly onApply: (id: string) => void;
  readonly onDismiss: (id: string) => void;
  readonly onUnapply?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly canApply: boolean;
  readonly isPending: boolean;
  readonly accountLabelMap?: ReadonlyMap<string, string>;
}

const PlaybookSuggestionCard: React.FC<PlaybookSuggestionCardProps> = ({
  suggestion,
  onApply,
  onDismiss,
  onUnapply,
  onDelete,
  canApply,
  isPending,
  accountLabelMap,
}) => {
  const { t } = useTranslation();
  const Icon = TYPE_ICONS[suggestion.type];
  const confidenceLevel = getConfidenceLevel(suggestion.confidence);

  const accountScopeLabel = React.useMemo(() => {
    const ids = suggestion.accountIds;
    if (!ids || ids.length === 0) return t('accounts.allAccounts', 'All Accounts');
    if (!accountLabelMap) return ids.length === 1 ? ids[0] : `${ids.length} accounts`;
    const names = ids.map((id) => accountLabelMap.get(id) ?? id);
    return names.join(', ');
  }, [suggestion.accountIds, accountLabelMap, t]);

  const isActionable = suggestion.status === 'PENDING';
  const improvement = suggestion.expectedImprovement ?? 0;
  const improvementFormatted =
    improvement >= 0
      ? `+$${improvement.toFixed(2)}`
      : `-$${Math.abs(improvement).toFixed(2)}`;

  return (
    <div
      className={cn(
        'glass-card rounded-2xl border p-5 transition-all duration-200',
        isActionable
          ? 'border-white/[0.08] hover:border-primary/20 hover:shadow-[0_0_24px_hsl(var(--primary)/0.06)]'
          : 'border-white/[0.04] opacity-70',
      )}
    >
      {/* Header: icon + title + confidence badge */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold leading-tight truncate">
              {suggestion.title}
            </h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset cursor-help',
                      CONFIDENCE_STYLES[confidenceLevel],
                    )}
                  >
                    {confidenceLevel}
                    <Info className="h-2.5 w-2.5 opacity-60" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{t(CONFIDENCE_I18N_KEYS[confidenceLevel])}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Current behavior */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
        {suggestion.currentBehavior}
      </p>

      {/* Suggested action */}
      <p className="text-sm font-medium leading-snug mb-3">
        {suggestion.suggestedAction}
      </p>

      {/* Metrics row */}
      <div className="flex items-center gap-4 mb-3">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          {improvementFormatted}
          <span className="text-[10px] font-normal text-muted-foreground">
            {t('playbook.perTrade')}
          </span>
        </span>

        <span className="text-[11px] text-muted-foreground">
          {t('playbook.basedOn', { count: suggestion.sampleSize })}
        </span>
      </div>

      {/* Account scope */}
      <div className="flex items-center gap-1.5 mb-4">
        <Wallet className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        <span className="text-[11px] text-muted-foreground truncate" title={accountScopeLabel}>
          {accountScopeLabel}
        </span>
      </div>

      {/* Actions */}
      {isActionable && (
        <div className="flex items-center gap-2">
          {canApply ? (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={isPending}
              onClick={() => onApply(suggestion.id)}
            >
              {t('playbook.apply')}
            </Button>
          ) : (
            <span className="text-xs text-amber-400 font-medium">
              {t('playbook.upgradeToApply')}
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            disabled={isPending}
            onClick={() => onDismiss(suggestion.id)}
          >
            {t('playbook.dismiss')}
          </Button>
        </div>
      )}

      {/* Undo + Delete for applied cards */}
      {suggestion.status === 'APPLIED' && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground gap-1.5"
            disabled={isPending}
            onClick={() => onUnapply?.(suggestion.id)}
          >
            <Undo2 className="h-3.5 w-3.5" />
            {t('playbook.undo', 'Undo')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive/70 hover:text-destructive gap-1.5"
            disabled={isPending}
            onClick={() => onDelete?.(suggestion.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      )}

      {/* Delete for dismissed cards */}
      {suggestion.status === 'DISMISSED' && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive/70 hover:text-destructive gap-1.5"
            disabled={isPending}
            onClick={() => onDelete?.(suggestion.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlaybookSuggestionCard;
