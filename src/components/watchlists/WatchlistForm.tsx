
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

export interface WatchlistFormValues {
  name: string;
  description: string;
}

interface WatchlistFormProps {
  defaultValues?: WatchlistFormValues;
  onSubmit: (data: WatchlistFormValues) => void;
}

const WatchlistForm: React.FC<WatchlistFormProps> = ({ defaultValues = { name: '', description: '' }, onSubmit }) => {
  const form = useForm<WatchlistFormValues>({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Watchlist" {...field} />
              </FormControl>
              <FormDescription>A short name for your watchlist</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe this watchlist" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default WatchlistForm;
