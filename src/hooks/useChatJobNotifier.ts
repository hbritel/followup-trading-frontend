import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import { aiService } from '@/services/ai.service';

const POLL_INTERVAL_MS = 5000;

/**
 * Globally polls for any pending chat jobs and shows a toast notification
 * when a response becomes ready while the user is NOT on the AI Coach page.
 *
 * Mounted once at the app shell level (inside WebSocketProvider).
 */
export const useChatJobNotifier = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const knownJobsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const tick = async () => {
      try {
        const pending = await aiService.getPendingChatJobs();
        const pendingIds = new Set(pending.map((j) => j.jobId));

        // Jobs that were known as pending but are no longer pending → completed
        const newlyCompletedIds = Array.from(knownJobsRef.current).filter(
          (id) => !pendingIds.has(id),
        );

        if (newlyCompletedIds.length > 0) {
          // Verify they actually completed (not just expired)
          for (const jobId of newlyCompletedIds) {
            try {
              const job = await aiService.getChatJobStatus(jobId);
              if (job.status === 'COMPLETED') {
                // Only notify if user is NOT on the AI Coach page
                if (!location.pathname.startsWith('/ai-coach')) {
                  toast(t('ai.responseReady', 'Your AI Coach has a response ready'), {
                    action: {
                      label: t('common.view', 'View'),
                      onClick: () => navigate('/ai-coach'),
                    },
                    duration: 10000,
                  });
                }
              }
            } catch {
              // job lookup failed — skip silently
            }
          }
        }

        // Update known jobs set
        knownJobsRef.current = pendingIds;
      } catch {
        // network/auth errors — skip silently
      }

      timerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    };

    void tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, user?.id, location.pathname, t, navigate]);
};
