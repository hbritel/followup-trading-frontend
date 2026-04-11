import React from 'react';
import { useBrokerConnections } from '@/hooks/useBrokers';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  const { data: connections, isLoading } = useBrokerConnections();

  // Only show accounts that are currently connected (including suspended ones so users can see them as disabled)
  const connectedAccounts = React.useMemo(
    () => connections?.filter(c => c.status === 'CONNECTED') || [],
    [connections],
  );

  // Suspended accounts are shown as disabled items in the dropdown
  const suspendedAccounts = React.useMemo(
    () => connections?.filter(c => c.suspendedByPlan) || [],
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

            {suspendedAccounts.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-amber-400 text-xs">
                    <Lock className="h-3 w-3" />
                    {t('accounts.suspendedAccounts', 'Suspended accounts')}
                  </SelectLabel>
                  {suspendedAccounts.map(account => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      disabled
                      className="pl-8 opacity-50 cursor-not-allowed"
                    >
                      {buildLabel(account)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
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
