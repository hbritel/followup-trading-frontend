
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import StrategyList from '@/components/playbook/StrategyList';
import StrategyForm from '@/components/playbook/StrategyForm';
import PlaybookSuggestionsPanel from '@/components/playbook/PlaybookSuggestionsPanel';
import { useStrategyStats, useDeleteStrategy } from '@/hooks/useStrategies';
import { useToast } from '@/hooks/use-toast';
import type { StrategyStatsDto, StrategyResponseDto } from '@/types/dto';
import { useFeatureFlags } from '@/contexts/feature-flags-context';
import UsageLimitIndicator from '@/components/subscription/UsageLimitIndicator';

/** Convert stats DTO to the response shape expected by StrategyForm */
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
  const navigate = useNavigate();
  const { currentPlan } = useFeatureFlags();

  const [formOpen, setFormOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyResponseDto | null>(null);

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
    const dto =
      'strategyId' in strategy
        ? toResponseDto(strategy as StrategyStatsDto)
        : (strategy as StrategyResponseDto);
    setEditingStrategy(dto);
    setFormOpen(true);
  };

  const handleView = (strategy: StrategyStatsDto) => {
    navigate(`/playbook/${strategy.strategyId}`);
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

  const count = strategies?.length ?? 0;
  const maxStrategies = STRATEGY_LIMITS[currentPlan] ?? 2;
  const atStrategyLimit = count >= maxStrategies;

  return (
    <DashboardLayout pageTitle={t('pages.playbook')}>
      <PageTransition className="space-y-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('pages.playbookTitle', 'Playbook')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('pages.playbookDescription', 'Codify your trading strategies with clear entry, risk and exit rules, then track how each one performs against your live trades.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
        <PlaybookSuggestionsPanel />

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
      </PageTransition>

      {/* Form sheet — create / edit */}
      <StrategyForm
        open={formOpen}
        editingStrategy={editingStrategy}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </DashboardLayout>
  );
};

export default Playbook;
