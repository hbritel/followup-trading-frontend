
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BacktestHeader, 
  StatisticsCards, 
  EquityCurveChart, 
  MonthlyReturnsChart, 
  PerformanceStatistics 
} from './components';
import { equityCurve, monthlyReturns } from './mockData';

const BacktestResults = () => {
  const { t } = useTranslation();
  
  // Mock statistics data
  const statistics = [
    { name: t('backtesting.netProfit'), value: '$4,200', highlight: true },
    { name: t('backtesting.profitFactor'), value: '2.3', highlight: true },
    { name: t('backtesting.sharpeRatio'), value: '1.8', highlight: true },
    { name: t('backtesting.maxDrawdown'), value: '-8.5%', highlight: true },
    { name: t('backtesting.totalTrades'), value: '42', highlight: false },
    { name: t('backtesting.winRate'), value: '58%', highlight: false },
    { name: t('backtesting.averageWin'), value: '$320', highlight: false },
    { name: t('backtesting.averageLoss'), value: '-$180', highlight: false },
    { name: t('backtesting.largestWin'), value: '$850', highlight: false },
    { name: t('backtesting.largestLoss'), value: '-$430', highlight: false },
  ];
  
  return (
    <div className="space-y-6">
      <BacktestHeader 
        title="Moving Average Crossover Backtest" 
        subtitle="AAPL | Daily | Jan 1, 2023 - Jun 1, 2023" 
      />
      
      <StatisticsCards statistics={statistics} />
      
      <EquityCurveChart data={equityCurve} />
      
      <MonthlyReturnsChart data={monthlyReturns} />
      
      <PerformanceStatistics statistics={statistics} />
    </div>
  );
};

export default BacktestResults;
