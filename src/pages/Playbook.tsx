
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, BookOpen, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import DashboardLayout from '@/components/layout/DashboardLayout';
import StrategyList from '@/components/playbook/StrategyList';
import StrategyForm from '@/components/playbook/StrategyForm';
import StrategyDetail from '@/components/playbook/StrategyDetail';
import PlaybookSuggestionsPanel from '@/components/playbook/PlaybookSuggestionsPanel';
import { useStrategyStats, useDeleteStrategy } from '@/hooks/useStrategies';
import { useToast } from '@/hooks/use-toast';
import type { StrategyStatsDto, StrategyResponseDto } from '@/types/dto';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';

/** Convert stats DTO to the response shape expected by StrategyForm / StrategyDetail */
const toResponseDto = (s: StrategyStatsDto): StrategyResponseDto => ({
  id: s.strategyId,
  name: s.strategyName,
  description: s.description ?? '',
  icon: s.icon ?? null,
  active: s.active,
  isDefault: s.isDefault ?? false,
  createdAt: '',
  updatedAt: '',
  rules: s.rules ?? [],
});

const STRATEGY_LIMITS: Record<string, number> = { FREE: 2, STARTER: 5, PRO: 20, ELITE: 2147483647 };

const Playbook = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentPlan } = useFeatureFlags();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyResponseDto | null>(null);
  const [viewingStrategy, setViewingStrategy] = useState<StrategyResponseDto | null>(null);

  const { data: strategies, isLoading } = useStrategyStats();
  const deleteMutation = useDeleteStrategy();

  useEffect(() => {
    document.title = 'Playbook | Followup Trading';
  }, []);

  const handleNew = () => {
    setEditingStrategy(null);
    setFormOpen(true);
  };

  const handleEdit = (strategy: StrategyStatsDto | StrategyResponseDto) => {
    const dto = 'strategyId' in strategy ? toResponseDto(strategy as StrategyStatsDto) : strategy as StrategyResponseDto;
    setEditingStrategy(dto);
    setDetailOpen(false);
    setFormOpen(true);
  };

  const handleView = (strategy: StrategyStatsDto) => {
    setViewingStrategy(toResponseDto(strategy));
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t('playbook.strategyDeleted') });
    } catch {
      toast({
        title: t('common.error'),
        description: t('playbook.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingStrategy(null);
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    setEditingStrategy(null);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
  };

  const count = strategies?.length ?? 0;
  const maxStrategies = STRATEGY_LIMITS[currentPlan] ?? 2;
  const atStrategyLimit = count >= maxStrategies;

  return (
    <DashboardLayout pageTitle={t('pages.playbook')}>
      <div className="max-w-screen-2xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('pages.playbook')}</h1>
              {!isLoading && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {count === 0
                    ? t('playbook.noStrategiesShort', 'No strategies yet')
                    : t('playbook.strategyCount', { count, defaultValue: `${count} ${count === 1 ? 'strategy' : 'strategies'}` })}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {!isLoading && (
              <UsageLimitIndicator
                used={count}
                max={maxStrategies}
                label={t('playbook.strategiesUsed', 'Strategies')}
                showBar
              />
            )}
            <Button onClick={handleNew} className="gap-2" disabled={atStrategyLimit}>
              <Plus className="h-4 w-4" />
              {t('playbook.newStrategy')}
            </Button>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-1.5">
            <h2 className="sr-only">{t('playbook.aiSuggestions')}</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>{t('playbook.aiSuggestionsInfo')}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm text-xs leading-relaxed">
                  <p>{t('playbook.aiSuggestionsTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <PlaybookSuggestionsPanel />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <StrategyList
            strategies={strategies ?? []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>

      {/* Form sheet — create / edit */}
      <StrategyForm
        open={formOpen}
        editingStrategy={editingStrategy}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />

      {/* Detail sheet — view */}
      <StrategyDetail
        strategy={viewingStrategy}
        open={detailOpen}
        onClose={handleDetailClose}
        onEdit={handleEdit}
      />
    </DashboardLayout>
  );
};

export default Playbook;
