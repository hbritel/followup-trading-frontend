import React, { useCallback, useRef } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from '@/hooks/useNotificationPreferences';
import type { NotificationPreferenceDto } from '@/types/dto';

// ---------------------------------------------------------------------------
// Event type ordering
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  'ALERT_TRIGGERED',
  'SYNC_COMPLETED',
  'TRADE_IMPORTED',
  'BROKER_DISCONNECTED',
  'WEEKLY_DIGEST',
  'NEW_LOGIN_DETECTED',
  'JOURNAL_REMINDER',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NotificationPreferences: React.FC = () => {
  const { t } = useTranslation();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePref = useUpdateNotificationPreference();

  const handleToggle = (
    eventType: string,
    field: 'inAppEnabled' | 'emailEnabled',
    currentPref: { inAppEnabled: boolean; emailEnabled: boolean } | undefined,
  ) => {
    if (!currentPref) return;
    updatePref.mutate({
      eventType,
      inAppEnabled: field === 'inAppEnabled' ? !currentPref.inAppEnabled : currentPref.inAppEnabled,
      emailEnabled: field === 'emailEnabled' ? !currentPref.emailEnabled : currentPref.emailEnabled,
    });
  };

  const getPref = (eventType: string) =>
    prefs?.find((p) => p.eventType === eventType);

  // Debounce time changes — user may scroll through values quickly
  const timeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTimeChange = useCallback(
    (eventType: string, time: string, pref: NotificationPreferenceDto | undefined) => {
      if (!pref) return;
      if (timeDebounceRef.current) clearTimeout(timeDebounceRef.current);
      timeDebounceRef.current = setTimeout(() => {
        updatePref.mutate({
          eventType,
          inAppEnabled: pref.inAppEnabled,
          emailEnabled: pref.emailEnabled,
          scheduledTime: time,
        });
      }, 600);
    },
    [updatePref],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        <p className="label-caps text-muted-foreground flex-1">
          {t('notifications.preferences', 'Notification Preferences')}
        </p>
        <p className="label-caps text-muted-foreground w-16 text-center">
          {t('notifications.inApp', 'In-App')}
        </p>
        <p className="label-caps text-muted-foreground w-16 text-center">
          {t('notifications.email', 'Email')}
        </p>
      </div>

      {/* Preference rows */}
      {EVENT_TYPES.map((eventType, index) => {
        const pref = getPref(eventType);
        const label = t(`notifications.eventTypes.${eventType}`, eventType.replace(/_/g, ' '));

        return (
          <div
            key={eventType}
            className={cn(
              'flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors',
              index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent',
            )}
          >
            {/* Event label (with optional time picker for JOURNAL_REMINDER) */}
            <div className="flex-1 min-w-0">
              <span className="text-sm">{label}</span>
              {eventType === 'JOURNAL_REMINDER' &&
                (pref?.inAppEnabled || pref?.emailEnabled) && (
                  <div className="flex items-center gap-2 mt-1.5 ml-0.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {t('notifications.remindAt', 'Remind me at')}
                    </span>
                    <input
                      type="time"
                      defaultValue={pref?.scheduledTime ?? '18:00'}
                      onChange={(e) => handleTimeChange(eventType, e.target.value, pref)}
                      className="bg-transparent border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label="Journal reminder time"
                    />
                  </div>
                )}
            </div>

            {/* In-App toggle */}
            <div className="w-16 flex justify-center">
              <Switch
                id={`${eventType}-inApp`}
                checked={pref?.inAppEnabled ?? true}
                onCheckedChange={() =>
                  handleToggle(eventType, 'inAppEnabled', pref)
                }
                disabled={!pref || updatePref.isPending}
                aria-label={`${label} in-app notifications`}
              />
            </div>

            {/* Email toggle */}
            <div className="w-16 flex justify-center">
              <Switch
                id={`${eventType}-email`}
                checked={pref?.emailEnabled ?? false}
                onCheckedChange={() =>
                  handleToggle(eventType, 'emailEnabled', pref)
                }
                disabled={!pref || updatePref.isPending}
                aria-label={`${label} email notifications`}
              />
            </div>
          </div>
        );
      })}

      {/* Empty state when no prefs from backend yet */}
      {prefs && prefs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('common.noDataAvailable', 'No data available.')}
        </p>
      )}
    </div>
  );
};

export default NotificationPreferences;
