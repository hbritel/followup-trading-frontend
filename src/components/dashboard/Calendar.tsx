
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { DayContentProps } from "react-day-picker";

// Calendar data with trade dates and results
const tradeData = {
  '2022-03-01': { result: 'win', amount: 152 },
  '2022-03-02': { result: 'loss', amount: -23 },
  '2022-03-03': { result: 'win', amount: 47 },
  '2022-03-04': { result: 'win', amount: 125 },
  '2022-03-07': { result: 'loss', amount: -67 },
  '2022-03-08': { result: 'win', amount: 89 },
  '2022-03-09': { result: 'win', amount: 132 },
  '2022-03-10': { result: 'loss', amount: -45 },
  '2022-03-11': { result: 'win', amount: 76 },
  '2022-03-14': { result: 'win', amount: 44 },
  '2022-03-15': { result: 'loss', amount: -12 },
  '2022-03-16': { result: 'win', amount: 37 },
  '2022-03-17': { result: 'win', amount: 91 },
  '2022-03-18': { result: 'win', amount: 23 },
  '2022-03-21': { result: 'loss', amount: -19 },
  '2022-03-22': { result: 'win', amount: 62 },
  '2022-03-23': { result: 'win', amount: 27 },
};

const TradingCalendar = () => {
  const [date, setDate] = React.useState<Date>(new Date('2022-03-23'));

  const renderDay = (props: DayContentProps) => {
    const dateStr = props.date.toISOString().split('T')[0];
    const tradeInfo = tradeData[dateStr as keyof typeof tradeData];
    
    if (!tradeInfo || !props.inMonth) return null;
    
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className={cn(
            "absolute top-0 right-0 h-2 w-2 rounded-full mt-1 mr-1",
            tradeInfo.result === 'win' ? 'bg-profit' : 'bg-loss'
          )}
        />
      </div>
    );
  };

  // Get selected date's trade info
  const selectedDateStr = date.toISOString().split('T')[0];
  const selectedDateTrade = tradeData[selectedDateStr as keyof typeof tradeData];

  return (
    <Card className="animate-slide-up">
      <CardHeader className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Trading Calendar</CardTitle>
            <CardDescription>Your trading activity for March 2022</CardDescription>
          </div>
          <div className="text-sm font-medium">
            <Badge variant="outline" className="bg-profit/10 border-profit text-profit">
              Win
            </Badge>
            <Badge variant="outline" className="bg-loss/10 border-loss text-loss ml-2">
              Loss
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 pb-5">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-md"
              components={{
                DayContent: renderDay
              }}
              disabled={{ after: new Date('2022-03-23') }}
              month={new Date('2022-03-01')}
            />
          </div>
          
          <div className="lg:w-72 mt-6 lg:mt-0 lg:ml-6 lg:border-l lg:pl-6 px-6 lg:px-0">
            <h3 className="text-sm font-medium mb-2">
              Selected Date: {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            
            {selectedDateTrade ? (
              <div className="space-y-4">
                <div className="p-3 bg-accent/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Result</span>
                    <Badge variant={selectedDateTrade.result === 'win' ? 'default' : 'destructive'} className="capitalize">
                      {selectedDateTrade.result}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">P&L</span>
                    <span className={cn(
                      "text-sm font-medium",
                      selectedDateTrade.amount > 0 ? "text-profit" : "text-loss"
                    )}>
                      {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium">Trades</span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Trade Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>AAPL</span>
                      <span className={selectedDateTrade.amount > 0 ? "text-profit" : "text-loss"}>
                        {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount / 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>MSFT</span>
                      <span className={selectedDateTrade.amount > 0 ? "text-profit" : "text-loss"}>
                        {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount / 3).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>NVDA</span>
                      <span className={selectedDateTrade.amount > 0 ? "text-profit" : "text-loss"}>
                        {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount / 6).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm">No trades on this date</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingCalendar;
