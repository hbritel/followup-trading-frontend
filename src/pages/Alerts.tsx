
import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlertManager from '@/components/alerts/AlertManager';

const Alerts = () => {
  const { t } = useTranslation();
  return (
    <DashboardLayout pageTitle={t('sidebar.alerts')}>
      <AlertManager />
    </DashboardLayout>
  );
};

export default Alerts;
