
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
import { cn } from '@/lib/utils';

const WATCHLIST_EMOJIS = [
  '📈', '📉', '💰', '💎', '🏦', '🪙', '💵', '💹',
  '🔥', '⭐', '🎯', '🛡️', '⚡', '🌍', '🏆', '🔔',
  '📊', '💡', '🚀', '👀',
];

export interface WatchlistFormValues {
  name: string;
  description: string;
  icon: string;
}

interface WatchlistFormProps {
  defaultValues?: WatchlistFormValues;
  onSubmit: (data: WatchlistFormValues) => void;
}

const WatchlistForm: React.FC<WatchlistFormProps> = ({ defaultValues = { name: '', description: '', icon: '' }, onSubmit }) => {
  const { t } = useTranslation();
  const form = useForm<WatchlistFormValues>({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.icon')}</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-1.5">
                  {WATCHLIST_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={cn(
                        'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                        field.value === emoji
                          ? 'bg-primary/15 ring-2 ring-primary scale-110'
                          : 'bg-muted/50 hover:bg-muted hover:scale-105'
                      )}
                      onClick={() => field.onChange(field.value === emoji ? '' : emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormDescription>{t('watchlists.iconDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          rules={{ required: t('watchlists.nameRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.watchlistName')}</FormLabel>
              <FormControl>
                <Input placeholder={t('watchlists.watchlistNamePlaceholder')} {...field} />
              </FormControl>
              <FormDescription>{t('watchlists.watchlistNameHint')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('watchlists.watchlistDescription')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('watchlists.watchlistDescriptionPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">{t('common.save')}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default WatchlistForm;
