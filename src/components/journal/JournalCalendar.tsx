
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { DayClickEventHandler } from 'react-day-picker';

const JournalCalendar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Mock data for journal entries
  const journalEntries = [
    { date: new Date(2023, 10, 5), title: "Bullish breakout" },
    { date: new Date(2023, 10, 8), title: "Market reversal" },
    { date: new Date(2023, 10, 12), title: "Earnings analysis" },
    { date: new Date(2023, 10, 15), title: "Weekly review" }
  ];
  
  const hasJournalEntry = (day: Date) => {
    return journalEntries.some(entry => 
      entry.date.getDate() === day.getDate() && 
      entry.date.getMonth() === day.getMonth() && 
      entry.date.getFullYear() === day.getFullYear()
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('journal.calendar')}</CardTitle>
        <CardDescription>{t('journal.calendarDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="max-w-sm mx-auto">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          components={{
            DayContent: ({ date: day, ...props }) => {
              const hasEntry = hasJournalEntry(day);
              
              return (
                <div className="relative flex h-9 w-9 items-center justify-center">
                  <div>{day.getDate()}</div>
                  {hasEntry && (
                    <Badge 
                      className="absolute bottom-0 right-0 w-2 h-2 p-0" 
                      variant="default"
                    />
                  )}
                </div>
              );
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default JournalCalendar;
