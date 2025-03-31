
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RiskMetricsBoard from '@/components/risk/RiskMetricsBoard';

const RiskMetrics = () => {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout pageTitle={t('pages.riskMetrics', 'Métriques de Risque')}>
      <RiskMetricsBoard />
    </DashboardLayout>
  );
};

export default RiskMetrics;
