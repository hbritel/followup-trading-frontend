import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import type { NotificationPreferenceDto } from '@/types/dto';

const PREFS_KEY = ['notifications', 'preferences'] as const;

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: PREFS_KEY,
    queryFn: () => notificationService.getPreferences(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateNotificationPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventType,
      inAppEnabled,
      emailEnabled,
      scheduledTime,
    }: {
      eventType: string;
      inAppEnabled: boolean;
      emailEnabled: boolean;
      scheduledTime?: string | null;
    }) => notificationService.updatePreference(eventType, inAppEnabled, emailEnabled, scheduledTime),

    // Optimistic update — toggle immediately without waiting for server
    onMutate: async ({ eventType, inAppEnabled, emailEnabled, scheduledTime }) => {
      await queryClient.cancelQueries({ queryKey: PREFS_KEY });

      const previousPrefs = queryClient.getQueryData<NotificationPreferenceDto[]>(PREFS_KEY);

      queryClient.setQueryData<NotificationPreferenceDto[]>(PREFS_KEY, (old) => {
        if (!old) return old;
        return old.map((pref) =>
          pref.eventType === eventType
            ? {
                ...pref,
                inAppEnabled,
                emailEnabled,
                ...(scheduledTime !== undefined ? { scheduledTime } : {}),
              }
            : pref,
        );
      });

      return { previousPrefs };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousPrefs) {
        queryClient.setQueryData(PREFS_KEY, context.previousPrefs);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PREFS_KEY });
    },
  });
};
