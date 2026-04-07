import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useDisclaimer } from '@/hooks/useDisclaimer';
import DisclaimerModal from '@/components/ai-coach/DisclaimerModal';
import AiCoachDisclaimer from '@/components/ai-coach/AiCoachDisclaimer';
import TiltGauge from '@/components/ai-coach/TiltGauge';
import BriefingCard from '@/components/ai-coach/BriefingCard';
import BehavioralAlertsList from '@/components/ai-coach/BehavioralAlertsList';
import SessionDebriefCard from '@/components/ai-coach/SessionDebriefCard';
import AccountSelector from '@/components/dashboard/AccountSelector';

const PageSkeleton: React.FC = () => (
  <DashboardLayout pageTitle="AI Coach">
    <div className="space-y-6 p-0">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  </DashboardLayout>
);

const AiCoach: React.FC = () => {
  const { data: disclaimerStatus, isLoading: disclaimerLoading } = useDisclaimer();
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  // Resolve accountId: 'all' means no filter (undefined), otherwise pass UUID
  const accountId = selectedAccount && selectedAccount !== 'all' && selectedAccount !== 'all-real' && selectedAccount !== 'all-demo'
    ? selectedAccount
    : undefined;

  if (disclaimerLoading) {
    return <PageSkeleton />;
  }

  if (!disclaimerStatus?.accepted) {
    return <DisclaimerModal />;
  }

  return (
    <DashboardLayout pageTitle="AI Coach">
      <div className="space-y-6">
        <AiCoachDisclaimer />

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Coach</h1>
          <div className="flex items-center gap-3">
            <AccountSelector
              value={selectedAccount}
              onChange={setSelectedAccount}
              className="w-[200px]"
            />
            <span className="text-sm text-muted-foreground">Tilt Score</span>
            <TiltGauge accountId={accountId} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BriefingCard accountId={accountId} />
          <BehavioralAlertsList accountId={accountId} />
        </div>

        <SessionDebriefCard accountId={accountId} />
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
