
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import BacktestSessionList from '@/components/backtesting/BacktestSessionList';
import BacktestSessionView from '@/components/backtesting/BacktestSessionView';
import NewSessionDialog from '@/components/backtesting/NewSessionDialog';
import EditSessionDialog from '@/components/backtesting/EditSessionDialog';

import { useBacktests, useRunBacktest, useUpdateBacktest, useDeleteBacktest } from '@/hooks/useBacktests';
import { useStrategies } from '@/hooks/useStrategies';
import type { BacktestResponseDto } from '@/types/dto';

const Backtesting = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useBacktests();
  const { data: strategies = [] } = useStrategies();
  const runBacktest = useRunBacktest();
  const updateBacktest = useUpdateBacktest();
  const deleteBacktest = useDeleteBacktest();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<BacktestResponseDto | null>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

  const handleCreateSession = (data: {
    name: string;
    symbol: string;
    strategyId: string | null;
    timeframe: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    icon: string;
  }) => {
    setShowNewSessionDialog(false);
    runBacktest.mutate(
      {
        name: data.name,
        strategyDefinition: JSON.stringify({ symbols: [data.symbol], direction: 'ALL' }),
        startDate: data.startDate,
        endDate: data.endDate,
        strategyId: data.strategyId,
        symbol: data.symbol,
        timeframe: data.timeframe,
        initialCapital: data.initialCapital,
        icon: data.icon || null,
      },
      {
        onSuccess: (created) => {
          setSelectedSessionId(created.id);
          toast({ title: t('backtesting.sessionCreated'), description: t('backtesting.sessionCreatedDescription', { name: data.name }) });
        },
        onError: () => {
          toast({ title: t('common.error'), description: t('backtesting.sessionCreateFailed'), variant: 'destructive' });
        },
      }
    );
  };

  const handleEditSession = (data: { name: string; symbol: string; timeframe: string; startDate: string; endDate: string }) => {
    if (!editingSession) return;
    setEditingSession(null);
    updateBacktest.mutate(
      { id: editingSession.id, data },
      {
        onSuccess: () => {
          toast({ title: t('backtesting.sessionUpdated'), description: t('backtesting.sessionUpdatedDescription') });
        },
        onError: () => {
          toast({ title: t('common.error'), description: t('backtesting.sessionUpdateFailed'), variant: 'destructive' });
        },
      }
    );
  };

  const handleDeleteSession = (id: string) => {
    if (selectedSessionId === id) setSelectedSessionId(null);
    deleteBacktest.mutate(id, {
      onSuccess: () => {
        toast({ title: t('backtesting.sessionDeleted'), description: t('backtesting.sessionDeletedDescription') });
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout pageTitle={t('pages.backtesting')}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={t('pages.backtesting')}>
      <PageTransition className="space-y-6">
        {selectedSession ? (
          <BacktestSessionView
            session={selectedSession}
            onBack={() => setSelectedSessionId(null)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gradient">{t('backtesting.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('backtesting.subtitle')}</p>
              </div>
            </div>

            <BacktestSessionList
              sessions={sessions}
              strategies={strategies}
              onSelectSession={setSelectedSessionId}
              onCreateSession={() => setShowNewSessionDialog(true)}
              onEditSession={setEditingSession}
              onDeleteSession={handleDeleteSession}
            />
          </>
        )}
      </PageTransition>

      <NewSessionDialog
        open={showNewSessionDialog}
        onOpenChange={setShowNewSessionDialog}
        strategies={strategies}
        onSubmit={handleCreateSession}
        isPending={runBacktest.isPending}
      />

      <EditSessionDialog
        open={!!editingSession}
        onOpenChange={(open) => { if (!open) setEditingSession(null); }}
        session={editingSession}
        onSubmit={handleEditSession}
        isPending={updateBacktest.isPending}
      />
    </DashboardLayout>
  );
};

export default Backtesting;
