
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

const events = [
  { id: 1, date: new Date(2023, 5, 12), title: 'AAPL Trade Entry', type: 'trade', description: 'Long position entry' },
  { id: 2, date: new Date(2023, 5, 14), title: 'MSFT Earnings', type: 'earnings', description: 'Quarterly earnings report' },
  { id: 3, date: new Date(2023, 5, 15), title: 'CPI Report', type: 'economic', description: 'Consumer Price Index release' },
  { id: 4, date: new Date(2023, 5, 16), title: 'JNJ Dividend', type: 'dividend', description: 'Ex-dividend date' },
  { id: 5, date: new Date(2023, 5, 18), title: 'AMZN Trade Exit', type: 'trade', description: 'Close position' },
  { id: 6, date: new Date(2023, 5, 20), title: 'FOMC Meeting', type: 'economic', description: 'Federal Reserve announcement' },
  { id: 7, date: new Date(2023, 5, 22), title: 'Review Trading Strategy', type: 'reminder', description: 'Monthly review' },
];

const eventFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  type: z.string().min(1, { message: "Event type is required" }),
  date: z.date({ required_error: "Date is required" }),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const eventTypes = {
    trade: { label: t('calendar.eventTypes.trade', 'Trade'), color: 'bg-blue-500' },
    earnings: { label: t('calendar.eventTypes.earnings', 'Earnings'), color: 'bg-amber-500' },
    economic: { label: t('calendar.eventTypes.economic', 'Economic'), color: 'bg-green-500' },
    dividend: { label: t('calendar.eventTypes.dividend', 'Dividend'), color: 'bg-purple-500' },
    reminder: { label: t('calendar.eventTypes.reminder', 'Reminder'), color: 'bg-rose-500' },
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      type: "",
      date: selectedDate || new Date(),
      description: "",
    },
  });

  const handleSelect = (day: Date | undefined) => {
    setDate(day);
    if (day) setSelectedDate(day);
  };

  const onSubmit = (data: EventFormValues) => {
    console.log('New event:', data);
    toast({
      title: "Event added",
      description: `${data.title} has been added to your calendar`,
    });
    setIsAddEventOpen(false);
    form.reset();
  };

  // Get events for the selected date
  const selectedEvents = selectedDate 
    ? events.filter(event => 
        event.date.getDate() === selectedDate.getDate() &&
        event.date.getMonth() === selectedDate.getMonth() &&
        event.date.getFullYear() === selectedDate.getFullYear()
      )
    : [];

  return (
    <DashboardLayout pageTitle="Calendar">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>{t('calendar.tradingCalendar', 'Trading Calendar')}</CardTitle>
              <CardDescription>{t('calendar.description', 'Plan and track your trading activities')}</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsAddEventOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('calendar.addEvent', 'Add Event')}
            </Button>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleSelect}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                {selectedEvents.length > 0 && <Badge>{selectedEvents.length} events</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${eventTypes[event.type as keyof typeof eventTypes].color}`}></div>
                        <span className="text-sm font-medium">{eventTypes[event.type as keyof typeof eventTypes].label}</span>
                      </div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {t('calendar.noEvents', 'No events scheduled for this day')}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('calendar.upcomingEvents', 'Upcoming Events')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 3)
                  .map((event) => (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${eventTypes[event.type as keyof typeof eventTypes].color}`}></div>
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>{t('calendar.eventTypesTitle', 'Event Types')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(eventTypes).map(([key, { label, color }]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('calendar.addNewEvent', 'Add New Event')}</DialogTitle>
            <DialogDescription>
              {t('calendar.addNewEventDescription', 'Create a new event for your trading calendar.')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.title', 'Title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('calendar.eventTitlePlaceholder', 'Event title')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.eventType', 'Event Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('calendar.selectEventType', 'Select event type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(eventTypes).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.date')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={e => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('common.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('calendar.eventDetailsPlaceholder', 'Event details')} 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">{t('calendar.addEvent', 'Add Event')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CalendarPage;
