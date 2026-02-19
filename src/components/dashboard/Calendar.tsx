
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
    
    if (!tradeInfo) return null;
    
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
    <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Trading Calendar</CardTitle>
            <CardDescription className="text-muted-foreground">Your trading activity for March 2022</CardDescription>
          </div>
          <div className="text-xs font-medium flex gap-2">
            <Badge variant="outline" className="bg-profit/10 border-profit/30 text-profit">
              Win
            </Badge>
            <Badge variant="outline" className="bg-loss/10 border-loss/30 text-loss">
              Loss
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 pb-6 pt-2">
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4"
              components={{
                DayContent: renderDay
              }}
              disabled={{ after: new Date('2022-03-23') }}
              month={new Date('2022-03-01')}
            />
          </div>
          
          <div className="lg:w-72 mt-6 lg:mt-0 lg:ml-6 lg:border-l border-slate-200/50 dark:border-white/10 lg:pl-6 px-6 lg:px-0">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Selected: {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            
            {selectedDateTrade ? (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Result</span>
                    <Badge variant={selectedDateTrade.result === 'win' ? 'default' : 'destructive'} className={cn(
                      "capitalize shadow-[0_0_10px_rgba(0,0,0,0.2)]",
                      selectedDateTrade.result === 'win' ? "bg-profit hover:bg-profit/90 text-black font-bold" : "bg-loss hover:bg-loss/90 text-white font-bold"
                    )}>
                      {selectedDateTrade.result}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-medium text-white">P&L</span>
                    <span className={cn(
                      "text-xl font-bold font-mono tracking-tight",
                      selectedDateTrade.amount > 0 ? "text-profit text-glow" : "text-loss"
                    )}>
                      {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                    <span className="text-sm font-medium text-muted-foreground">Trades</span>
                    <span className="text-sm font-medium text-white">3</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Trade Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-bold">AAPL</span>
                      <span className={cn("font-mono font-medium", selectedDateTrade.amount > 0 ? "text-profit" : "text-loss")}>
                        {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount / 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-bold">MSFT</span>
                      <span className={cn("font-mono font-medium", selectedDateTrade.amount > 0 ? "text-profit" : "text-loss")}>
                        {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount / 3).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-bold">NVDA</span>
                      <span className={cn("font-mono font-medium", selectedDateTrade.amount > 0 ? "text-profit" : "text-loss")}>
                        {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount / 6).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
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
