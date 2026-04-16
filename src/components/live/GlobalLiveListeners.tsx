import { useLiveTrades } from '@/hooks/useLiveTrades';
import { useLivePortfolio } from '@/hooks/useLivePortfolio';
import { useChatJobNotifier } from '@/hooks/useChatJobNotifier';

/**
 * Mounts global WebSocket listeners for real-time data updates.
 *
 * Placed inside WebSocketProvider (App.tsx) so the subscriptions
 * are active on ALL authenticated pages, not just Dashboard.
 *
 * - useLiveTrades: invalidates ['trades'] + dashboard data on SYNC_COMPLETE
 * - useLivePortfolio: invalidates portfolio data on position updates
 * - useChatJobNotifier: toasts when an async AI chat response is ready
 */
export default function GlobalLiveListeners() {
  useLiveTrades();
  useLivePortfolio();
  useChatJobNotifier();
  return null;
}
