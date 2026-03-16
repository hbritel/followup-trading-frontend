
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';

interface TradeSelectorProps {
  selectedTradeId: string;
  onSelectTrade: (tradeId: string) => void;
  isLoading: boolean;
  isError: boolean;
}

const TradeSelector: React.FC<TradeSelectorProps> = ({
  selectedTradeId,
  onSelectTrade,
  isLoading,
  isError,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSelectTrade(inputValue.trim());
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="tradeId">{t('tradeReplay.enterTradeId')}</Label>
          <Input
            id="tradeId"
            placeholder={t('tradeReplay.tradeIdPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!inputValue.trim() || isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {t('tradeReplay.loadReplay')}
        </Button>
      </form>

      {selectedTradeId && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('tradeReplay.enterTradeId')}:</span>
          <Badge variant="outline">{selectedTradeId}</Badge>
          {isLoading && (
            <span className="text-muted-foreground">{t('tradeReplay.loadingReplay')}</span>
          )}
          {isError && (
            <span className="text-red-500">{t('tradeReplay.replayError')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeSelector;
