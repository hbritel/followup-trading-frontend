import { useMemo } from 'react';
import { useBrokerConnections } from '@/hooks/useBrokers';

/**
 * Resolves the AccountSelector value into a list of account IDs
 * that the backend can understand (UUIDs only).
 *
 * - "all"      → array of all connected account IDs
 * - "all-real" → array of all real account IDs
 * - "all-demo" → array of all demo account IDs
 * - UUID       → that single UUID
 *
 * Returns:
 * - `accountIds`: string[] | undefined  — pass to backend
 * - `accountId`:  string | undefined    — single ID for endpoints that take one
 */
export const useAccountFilter = (selectorValue: string) => {
  const { data: connections } = useBrokerConnections();

  const connected = useMemo(
    () => connections?.filter(c => c.status === 'CONNECTED') || [],
    [connections],
  );

  const result = useMemo(() => {
    if (selectorValue === 'all' || !selectorValue) {
      // Resolve to all connected account IDs instead of undefined,
      // so the backend only returns data for active accounts
      // (not orphaned trades from deleted accounts).
      const ids = connected.map(a => a.id);
      return { accountIds: ids.length > 0 ? ids : undefined, accountId: undefined };
    }

    if (selectorValue === 'all-real') {
      const ids = connected
        .filter(a => a.accountType !== 'DEMO')
        .map(a => a.id);
      return {
        accountIds: ids.length > 0 ? ids : undefined,
        accountId: undefined,
      };
    }

    if (selectorValue === 'all-demo') {
      const ids = connected
        .filter(a => a.accountType === 'DEMO')
        .map(a => a.id);
      return {
        accountIds: ids.length > 0 ? ids : undefined,
        accountId: undefined,
      };
    }

    // Single account UUID
    return {
      accountIds: [selectorValue],
      accountId: selectorValue,
    };
  }, [selectorValue, connected]);

  return result;
};
