
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import BacktestForm from '@/components/backtesting/BacktestForm';
import BacktestResults from '@/components/backtesting/BacktestResults';
import BacktestHistory from '@/components/backtesting/BacktestHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Backtesting = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout pageTitle={t('pages.backtesting')}>
      <PageTransition className="max-w-screen-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gradient animate-fade-in">{t('pages.backtesting')}</h1>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="new">{t('backtesting.newBacktest')}</TabsTrigger>
            <TabsTrigger value="results">{t('backtesting.results')}</TabsTrigger>
            <TabsTrigger value="history">{t('backtesting.history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <BacktestForm />
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <BacktestResults />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <BacktestHistory />
          </TabsContent>
        </Tabs>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Backtesting;
