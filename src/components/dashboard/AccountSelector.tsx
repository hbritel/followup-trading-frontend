import React from 'react';
import { useBrokerConnections } from '@/hooks/useBrokers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  const { data: connections, isLoading } = useBrokerConnections();

  // Only show accounts that are currently connected
  const connectedAccounts = React.useMemo(
    () => connections?.filter(c => c.status === 'CONNECTED') || [],
    [connections],
  );

  const hasAccounts = connectedAccounts.length > 0;

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={
            isLoading
              ? t('common.loading', 'Loading...')
              : hasAccounts
                ? t('trades.accountFilter', 'All Accounts')
                : t('settings.noAccountsConnected', 'No accounts connected')
          }
        />
      </SelectTrigger>
      <SelectContent>
        {hasAccounts ? (
          <>
            <SelectItem value="all">
              {t('trades.allAccounts', 'All Accounts')}
            </SelectItem>
            {connectedAccounts.map(account => {
              const label = account.brokerDisplayName
                ? account.displayName
                  ? `${account.brokerDisplayName} - ${account.displayName}`
                  : account.brokerDisplayName
                : account.displayName || account.id;

              return (
                <SelectItem key={account.id} value={account.id}>
                  {label}
                </SelectItem>
              );
            })}
          </>
        ) : (
          <SelectItem value="all" disabled={false}>
            {isLoading
              ? t('common.loading', 'Loading...')
              : t('settings.noAccountsConnected', 'No accounts connected')}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default AccountSelector;
