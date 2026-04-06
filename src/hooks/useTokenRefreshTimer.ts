import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/services/auth.service';
import { jwtDecode } from 'jwt-decode';

/**
 * Periodically refreshes the JWT access token in the background to prevent
 * it from expiring while the user is still within their inactivity timeout.
 *
 * The timer runs every `checkIntervalMs` (default 60s) and refreshes the
 * token if it will expire within `refreshMarginMs` (default 2 min).
 *
 * SECURITY: This timer is STOPPED externally when the idle timeout fires,
 * so an abandoned session will NOT keep refreshing tokens indefinitely.
 *
 * @param enabled - Set to false to pause the timer (e.g. when idle timeout fires)
 */
export function useTokenRefreshTimer(enabled: boolean = true) {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !enabled) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkAndRefresh = async () => {
      if (refreshingRef.current) return; // Avoid concurrent refreshes

      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) return;

      try {
        const decoded: { exp: number } = jwtDecode(accessToken);
        const expiresInSeconds = decoded.exp - Date.now() / 1000;

        // Refresh if token expires within 2 minutes
        if (expiresInSeconds < 120) {
          refreshingRef.current = true;
          try {
            const rs = await authService.refreshToken({ refreshToken });
            localStorage.setItem('accessToken', rs.accessToken);
            if (rs.refreshToken) {
              localStorage.setItem('refreshToken', rs.refreshToken);
            }
          } catch (err) {
            // Silently fail — the request interceptor will handle 401s
            console.debug('[TokenRefreshTimer] Background refresh failed:', err);
          } finally {
            refreshingRef.current = false;
          }
        }
      } catch {
        // Token decode failed — skip this cycle
      }
    };

    // Check every 60 seconds
    intervalRef.current = setInterval(checkAndRefresh, 60_000);

    // Also check immediately on mount
    checkAndRefresh();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, enabled]);
}
