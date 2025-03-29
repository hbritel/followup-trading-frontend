
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BacktestHistoryTable from './components/BacktestHistoryTable';
import BacktestHistoryPagination from './components/BacktestHistoryPagination';
import { backtestHistoryData } from './mockBacktestData';

const BacktestHistory = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(backtestHistoryData.length / itemsPerPage);
  
  // Calculate the current page's data
  const currentBacktests = backtestHistoryData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('backtesting.backtestHistory')}</CardTitle>
        <CardDescription>{t('backtesting.backtestHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <BacktestHistoryTable backtests={currentBacktests} />
        {totalPages > 1 && (
          <BacktestHistoryPagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BacktestHistory;
