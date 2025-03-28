
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Define the form schema with Zod
const formSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  type: z.enum(['buy', 'sell']),
  price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Price must be a positive number',
  }),
  quantity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Quantity must be a positive number',
  }),
  date: z.string().min(1, 'Date is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTradeDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const NewTradeDialog: React.FC<NewTradeDialogProps> = ({ 
  children, 
  trigger, 
  open, 
  onOpenChange 
}) => {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: '',
      type: 'buy',
      price: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0], // Today's date
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    // This would normally call an API to save the trade
    console.log('New trade:', data);
    
    // Show a success toast
    toast.success('Trade created successfully');
    
    // Close the dialog
    setIsOpen(false);
    
    // Reset the form
    form.reset();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : children ? (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      ) : null}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('trades.newTrade')}</DialogTitle>
          <DialogDescription>
            {t('trades.newTradeDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <FormField
              control={form.control}
              name="type"
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
                      <SelectItem value="buy">{t('trades.buy')}</SelectItem>
                      <SelectItem value="sell">{t('trades.sell')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('trades.price')}</FormLabel>
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
                      <Input type="number" min="1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('trades.date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit">{t('common.create')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewTradeDialog;
