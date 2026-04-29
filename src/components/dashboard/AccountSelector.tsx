import React from 'react';
import { useBrokerConnections } from '@/hooks/useBrokers';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

type Status = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING' | string;

const statusDot = (status: Status): string => {
  switch (status) {
    case 'CONNECTED':
      return 'bg-emerald-500';
    case 'DISCONNECTED':
      return 'bg-muted-foreground/40';
    case 'ERROR':
      return 'bg-red-500';
    case 'PENDING':
      return 'bg-amber-500';
    default:
      return 'bg-muted-foreground/40';
  }
};

const AccountSelector: React.FC<AccountSelectorProps> = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  const { data: connections, isLoading } = useBrokerConnections();

  // Show every account the user owns regardless of broker connectivity:
  // historical trade data is in our DB, so the dashboard must remain
  // filterable even when MetaAPI / the broker layer is temporarily down.
  // Only suspended-by-plan accounts are gated separately.
  const availableAccounts = React.useMemo(
    () => connections?.filter((c) => !c.suspendedByPlan) || [],
    [connections],
  );

  const suspendedAccounts = React.useMemo(
    () => connections?.filter((c) => c.suspendedByPlan) || [],
    [connections],
  );

  const realAccounts = React.useMemo(
    () => availableAccounts.filter((a) => a.accountType !== 'DEMO'),
    [availableAccounts],
  );

  const demoAccounts = React.useMemo(
    () => availableAccounts.filter((a) => a.accountType === 'DEMO'),
    [availableAccounts],
  );

  const hasAccounts = availableAccounts.length > 0;

  const buildLabel = (account: typeof availableAccounts[number]) => {
    const broker = account.brokerDisplayName || account.brokerCode || account.id;
    const acctId =
      account.accountIdentifier && account.accountIdentifier !== 'default'
        ? account.accountIdentifier
        : null;
    const custom = account.displayName;
    return custom ? `${broker} - ${custom}` : acctId ? `${broker} - ${acctId}` : broker;
  };

  const renderAccountRow = (account: typeof availableAccounts[number]) => {
    const isOffline = account.status !== 'CONNECTED';
    const tooltip = isOffline
      ? t('accounts.accountOfflineHint', 'Offline — historical data still available')
      : t('accounts.statusConnected', 'Connected');
    return (
      <SelectItem key={account.id} value={account.id} className="pl-8">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            title={tooltip}
            className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', statusDot(account.status))}
          />
          <span className={cn('truncate', isOffline && 'text-muted-foreground')}>{buildLabel(account)}</span>
        </span>
      </SelectItem>
    );
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
                : t('accounts.noAccountsConnected', 'No accounts connected')
          }
        />
      </SelectTrigger>
      <SelectContent>
        {hasAccounts ? (
          <>
            <SelectItem value="all">{t('accounts.allAccounts', 'All Accounts')}</SelectItem>

            <SelectSeparator />

            {realAccounts.length > 0 && (
              <SelectGroup>
                <SelectItem value="all-real" className="font-semibold">
                  {t('accounts.allRealAccounts', 'All Real Accounts')}
                </SelectItem>
                {realAccounts.map(renderAccountRow)}
              </SelectGroup>
            )}

            {realAccounts.length > 0 && demoAccounts.length > 0 && <SelectSeparator />}

            {demoAccounts.length > 0 && (
              <SelectGroup>
                <SelectItem value="all-demo" className="font-semibold">
                  {t('accounts.allDemoAccounts', 'All Demo Accounts')}
                </SelectItem>
                {demoAccounts.map(renderAccountRow)}
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
                  {suspendedAccounts.map((account) => (
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
              : t('accounts.noAccountsConnected', 'No accounts connected')}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default AccountSelector;
