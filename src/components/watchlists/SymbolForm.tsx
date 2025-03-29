
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
import { DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';

export interface SymbolFormValues {
  symbol: string;
  name: string;
}

interface SymbolFormProps {
  onSubmit: (data: SymbolFormValues) => void;
}

const SymbolForm: React.FC<SymbolFormProps> = ({ onSubmit }) => {
  const form = useForm<SymbolFormValues>({
    defaultValues: {
      symbol: '',
      name: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input placeholder="AAPL" {...field} />
              </FormControl>
              <FormDescription>Stock ticker symbol (e.g., AAPL, MSFT)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Apple Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">Add Symbol</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default SymbolForm;
