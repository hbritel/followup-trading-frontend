import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import VerifiedStatsPanel from '@/components/mentor/trust/VerifiedStatsPanel';
import { usePublicMentorStats, useSetPublicStatsOptIn, useMentorInstance } from '@/hooks/useMentor';

const PublicStatsToggle: React.FC = () => {
  const { t } = useTranslation();
  const { data: instance, isLoading: instanceLoading } = useMentorInstance();
  const setOptIn = useSetPublicStatsOptIn();

  const slug = instance?.slug ?? undefined;
  const isEnabled = (instance as { showStatsPublicly?: boolean })?.showStatsPublicly ?? false;

  const { data: stats, isLoading: statsLoading } = usePublicMentorStats(
    isEnabled ? slug : undefined
  );

  if (instanceLoading) {
    return <Skeleton className="h-16 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="public-stats-toggle" className="text-sm font-semibold cursor-pointer">
            {t('mentor.settings.publicStats.toggleLabel', 'Show trading stats publicly')}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              'mentor.settings.publicStats.toggleDesc',
              'Display your verified trading performance on your public profile.'
            )}
          </p>
        </div>
        <Switch
          id="public-stats-toggle"
          checked={isEnabled}
          onCheckedChange={(v) => setOptIn.mutate(v)}
          disabled={setOptIn.isPending}
        />
      </div>

      {isEnabled && (
        <div className="pl-1">
          {statsLoading ? (
            <Skeleton className="h-32 w-full rounded-2xl" />
          ) : stats ? (
            <VerifiedStatsPanel stats={stats} />
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {t(
                'mentor.settings.publicStats.noStats',
                "No stats available yet. Close some trades and they'll appear here."
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicStatsToggle;
