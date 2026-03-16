
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export interface SymbolFormValues {
  symbol: string;
  notes: string;
  alertPrice: string;
}

interface SymbolFormProps {
  onSubmit: (data: SymbolFormValues) => void;
}

const SymbolForm: React.FC<SymbolFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const form = useForm<SymbolFormValues>({
    defaultValues: {
      symbol: '',
      notes: '',
      alertPrice: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="symbol"
          rules={{ required: t('watchlists.symbolRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.symbol')}</FormLabel>
              <FormControl>
                <Input placeholder="AAPL" {...field} />
              </FormControl>
              <FormDescription>{t('watchlists.symbolDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.notes')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('watchlists.notesPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="alertPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.alertPrice')}</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="150.00" {...field} />
              </FormControl>
              <FormDescription>{t('watchlists.alertPriceDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">{t('watchlists.addSymbol')}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default SymbolForm;
