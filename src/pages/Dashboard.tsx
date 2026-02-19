
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TradingStats from '@/components/dashboard/TradingStats';
import TradeTable from '@/components/dashboard/TradeTable';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AccountSummary from '@/components/dashboard/AccountSummary';
import TradingCalendar from '@/components/dashboard/Calendar';

const Dashboard = () => {
  return (
    <DashboardLayout pageTitle="Dashboard">
      <TradingStats />
      
      <div className="grid grid-cols-1 gap-6">
        <PerformanceChart />
        <AccountSummary />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TradeTable />
          <TradingCalendar />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
