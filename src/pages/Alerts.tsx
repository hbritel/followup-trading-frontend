
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AlertManager from '@/components/alerts/AlertManager';

const Alerts = () => {
  return (
    <DashboardLayout pageTitle="Alertes">
      <AlertManager />
    </DashboardLayout>
  );
};

export default Alerts;
