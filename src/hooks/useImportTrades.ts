// src/hooks/useImportTrades.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { importService, TradeImportResult } from '@/services/import.service';
import { useTranslation } from 'react-i18next';

export const useImportTrades = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<TradeImportResult, Error, { file: File; format: string }>({
    mutationFn: ({ file, format }) => importService.importTrades(file, format),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success(t('import.success', 'Trades imported successfully'), {
        description: `${result.imported} ${t('import.imported', 'imported')}, ${result.skippedDuplicates} ${t('import.skipped', 'skipped')}`,
      });
    },
    onError: (error) => {
      toast.error(t('common.error', 'Error'), {
        description: error.message || t('import.importError', 'Failed to import trades. Please try again.'),
      });
    },
  });
};
