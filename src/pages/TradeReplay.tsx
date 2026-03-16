
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import TradingViewChart from '@/components/tradereplay/TradingViewChart';
import TradeSelector from '@/components/tradereplay/TradeSelector';
import ReplayControls from '@/components/tradereplay/ReplayControls';
import { useTradeReplay } from '@/hooks/useTradeReplay';

const TradeReplay = () => {
  const { t } = useTranslation();
  const [selectedTradeId, setSelectedTradeId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: replayData, isLoading, isError } = useTradeReplay(selectedTradeId);

  const handleTradeSelected = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    setCurrentIndex(0);
  };

  return (
    <DashboardLayout pageTitle={t('pages.tradeReplay')}>
      <PageTransition className="max-w-screen-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gradient animate-fade-in">{t('pages.tradeReplay')}</h1>

        <div className="grid grid-cols-1 gap-6">
          <div className="glass-card rounded-2xl p-4">
            <TradeSelector
              selectedTradeId={selectedTradeId}
              onSelectTrade={handleTradeSelected}
              isLoading={isLoading}
              isError={isError}
            />
          </div>

          <div className="glass-card rounded-2xl p-6 min-h-[400px] h-[500px]">
            <TradingViewChart replayData={replayData} isLoading={isLoading} />
          </div>

          <div className="glass-card rounded-2xl p-4 bg-black/40">
            <ReplayControls
              replayData={replayData}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
            />
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default TradeReplay;
