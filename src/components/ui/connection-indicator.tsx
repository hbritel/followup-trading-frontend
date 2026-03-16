import React from 'react';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/providers/WebSocketProvider';

interface ConnectionIndicatorProps {
  /** Additional classes applied to the wrapper span. */
  className?: string;
  /** When true, the "Live" / "Offline" label is hidden (dot only). */
  dotOnly?: boolean;
}

/**
 * Displays the WebSocket connection state as a coloured pulsing dot with
 * an optional text label.
 *
 * - Connected   → green pulsing dot + "Live"
 * - Connecting  → amber pulsing dot + "Connecting"
 * - Disconnected → gray static dot + "Offline"
 */
const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  className,
  dotOnly = false,
}) => {
  const { connectionState } = useWebSocket();

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const dotClass = cn(
    'inline-block w-2 h-2 rounded-full shrink-0',
    isConnected && 'bg-emerald-500 animate-pulse',
    isConnecting && 'bg-amber-400 animate-pulse',
    !isConnected && !isConnecting && 'bg-gray-400'
  );

  const label = isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Offline';

  const textClass = cn(
    'text-xs font-medium leading-none',
    isConnected && 'text-emerald-500',
    isConnecting && 'text-amber-400',
    !isConnected && !isConnecting && 'text-muted-foreground'
  );

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Connection status: ${label}`}
      title={`WebSocket: ${label}`}
    >
      <span className={dotClass} />
      {!dotOnly && <span className={textClass}>{label}</span>}
    </span>
  );
};

export default ConnectionIndicator;
