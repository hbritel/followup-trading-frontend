
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateTrade } from '@/hooks/useCreateTrade';
import type { CreateTradeRequest } from '@/services/trade.service';

// Define the form schema with Zod -- matches TradeDto.Request on the backend
const formSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(50, 'Symbol cannot exceed 50 characters'),
  direction: z.enum(['LONG', 'SHORT']),
  entryPrice: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Entry price must be a positive number',
  }),
  exitPrice: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), {
    message: 'Exit price must be a positive number',
  }),
  quantity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  entryDate: z.string().min(1, 'Entry date is required'),
  exitDate: z.string().optional(),
  stopLoss: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'Stop loss must be a non-negative number',
  }),
  takeProfit: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'Take profit must be a non-negative number',
  }),
  fees: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'Fees must be a non-negative number',
  }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTradeDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Converts a local date string (YYYY-MM-DD) or datetime-local string
 * to an ISO 8601 string with timezone offset for the backend.
 */
const toBackendDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  // If the user only provided a date (no time), append midnight
  const hasTime = dateStr.includes('T');
  const fullStr = hasTime ? dateStr : `${dateStr}T00:00:00`;
  const d = new Date(fullStr);
  // Format with timezone offset
  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const tzHours = pad(Math.floor(absOffset / 60));
  const tzMinutes = pad(absOffset % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${tzHours}${tzMinutes}`;
};

const NewTradeDialog: React.FC<NewTradeDialogProps> = ({
  children,
  trigger,
  open,
  onOpenChange
}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const createTrade = useCreateTrade();

  // Use external state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: '',
      direction: 'LONG',
      entryPrice: '',
      exitPrice: '',
      quantity: '',
      entryDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      stopLoss: '',
      takeProfit: '',
      fees: '',
      notes: '',
    },
  });

  // Handle form submission -- calls POST /api/v1/trades
  const onSubmit = (data: FormValues) => {
    const request: CreateTradeRequest = {
      symbol: data.symbol.toUpperCase().trim(),
      direction: data.direction,
      entryPrice: Number(data.entryPrice),
      quantity: Number(data.quantity),
      entryDate: toBackendDateTime(data.entryDate),
      exitDate: data.exitDate ? toBackendDateTime(data.exitDate) : null,
      exitPrice: data.exitPrice ? Number(data.exitPrice) : null,
      stopLoss: data.stopLoss ? Number(data.stopLoss) : null,
      takeProfit: data.takeProfit ? Number(data.takeProfit) : null,
      fees: data.fees ? Number(data.fees) : null,
      notes: data.notes?.trim() || null,
      status: data.exitDate && data.exitPrice ? 'CLOSED' : 'OPEN',
    };

    createTrade.mutate(request, {
      onSuccess: () => {
        toast.success(t('trades.tradeCreatedSuccess', 'Trade created successfully'));
        setIsOpen(false);
        form.reset();
      },
      onError: (error: Error) => {
        const message = error.message || t('trades.tradeCreatedError', 'Failed to create trade. Please try again.');
        toast.error(message);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => {
      // Prevent closing during pending mutation
      if (createTrade.isPending && !nextOpen) return;
      setIsOpen(nextOpen);
    }}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : children ? (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('trades.newTrade')}</DialogTitle>
          <DialogDescription>
            {t('trades.newTradeDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Symbol */}
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('trades.symbol')}</FormLabel>
                  <FormControl>
                    <Input placeholder="AAPL" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('trades.symbolDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Direction */}
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('trades.type')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('trades.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LONG">{t('trades.long', 'Long')}</SelectItem>
                      <SelectItem value="SHORT">{t('trades.short', 'Short')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entry Price + Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.entryPrice', 'Entry Price')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.quantity')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Exit Price + Fees */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.exitPrice', 'Exit Price')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.fees', 'Fees')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Entry Date + Exit Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.entryDate', 'Entry Date')}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.exitDate', 'Exit Date')}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stop Loss + Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stopLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.stopLoss', 'Stop Loss')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="takeProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.takeProfit', 'Take Profit')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('trades.notes', 'Notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('trades.notesPlaceholder', 'Add notes about this trade...')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createTrade.isPending}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={createTrade.isPending}>
                {createTrade.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createTrade.isPending
                  ? t('common.creating', 'Creating...')
                  : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTradeDialog;
