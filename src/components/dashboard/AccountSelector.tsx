import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { brokerService } from '@/services/broker.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ value, onChange, className }) => {
  const { t } = useTranslation();
  
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['broker-connections'],
    queryFn: brokerService.getConnections,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={t('trades.accountFilter', 'All Accounts')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('trades.allAccounts', 'All Accounts')}</SelectItem>
        {accounts?.filter(a => a.status === 'CONNECTED').map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.displayName || account.brokerDisplayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AccountSelector;
