import React from 'react';
import { useBrokerConnections } from '@/hooks/useBrokers';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const realAccounts = React.useMemo(
    () => connectedAccounts.filter(a => a.accountType !== 'DEMO'),
    [connectedAccounts],
  );

  const demoAccounts = React.useMemo(
    () => connectedAccounts.filter(a => a.accountType === 'DEMO'),
    [connectedAccounts],
  );

  const hasAccounts = connectedAccounts.length > 0;

  const buildLabel = (account: typeof connectedAccounts[number]) => {
    const broker = account.brokerDisplayName || account.brokerCode || account.id;
    const acctId = account.accountIdentifier && account.accountIdentifier !== 'default'
      ? account.accountIdentifier
      : null;
    const custom = account.displayName;
    return custom
      ? `${broker} - ${custom}`
      : acctId
        ? `${broker} - ${acctId}`
        : broker;
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={
            isLoading
              ? t('common.loading', 'Loading...')
              : hasAccounts
                ? t('accounts.allAccounts', 'All Accounts')
                : t('settings.noAccountsConnected', 'No accounts connected')
          }
        />
      </SelectTrigger>
      <SelectContent>
        {hasAccounts ? (
          <>
            <SelectItem value="all">
              {t('accounts.allAccounts', 'All Accounts')}
            </SelectItem>

            <SelectSeparator />

            {realAccounts.length > 0 && (
              <SelectGroup>
                <SelectItem value="all-real" className="font-semibold">
                  {t('accounts.allRealAccounts', 'All Real Accounts')}
                </SelectItem>
                {realAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id} className="pl-8">
                    {buildLabel(account)}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

            {realAccounts.length > 0 && demoAccounts.length > 0 && (
              <SelectSeparator />
            )}

            {demoAccounts.length > 0 && (
              <SelectGroup>
                <SelectItem value="all-demo" className="font-semibold">
                  {t('accounts.allDemoAccounts', 'All Demo Accounts')}
                </SelectItem>
                {demoAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id} className="pl-8">
                    {buildLabel(account)}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
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
