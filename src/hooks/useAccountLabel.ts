import { useMemo } from 'react';
import { useBrokerConnections } from '@/hooks/useBrokers';

/**
 * Build a lookup map from connectionId to a human-readable account label.
 * Label format: displayName (if set) or "brokerCode #accountIdentifier".
 * Returns `undefined` for unknown connectionIds.
 */
export const useAccountLabel = () => {
  const { data: connections } = useBrokerConnections();

  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!connections) return map;

    for (const conn of connections) {
      const label =
        conn.displayName ??
        [conn.brokerCode ?? conn.brokerType, conn.accountIdentifier ? `#${conn.accountIdentifier}` : '']
          .filter(Boolean)
          .join(' ');
      map.set(conn.id, label);
    }
    return map;
  }, [connections]);

  return (connectionId: string | undefined | null): string | undefined => {
    if (!connectionId) return undefined;
    return labelMap.get(connectionId);
  };
};
