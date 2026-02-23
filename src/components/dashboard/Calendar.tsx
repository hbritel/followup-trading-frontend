
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { DayContentProps } from "react-day-picker";
import { AnalyticsDashboard } from '@/services/trade.service';
import { useTrades } from '@/hooks/useTrades';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Format a Date as YYYY-MM-DD using local timezone (not UTC) */
const toLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TRADES_PER_PAGE = 10;

interface TradingCalendarProps {
  analytics?: AnalyticsDashboard;
  accountId?: string;
}

const TradingCalendar = ({ analytics, accountId }: TradingCalendarProps) => {
  const [date, setDate] = React.useState<Date>(new Date());
  const [month, setMonth] = React.useState<Date>(new Date());
  const [tradePage, setTradePage] = React.useState(0);

  const tradeData = React.useMemo(() => {
    const data: Record<string, { result: 'win' | 'loss', amount: number, tradesCount: number }> = {};

    if (analytics?.equityCurve) {
      analytics.equityCurve.forEach(point => {
        data[point.date] = {
          result: point.dailyProfit >= 0 ? 'win' : 'loss',
          amount: point.dailyProfit,
          tradesCount: point.dailyVolume || 0,
        };
      });
    }

    return data;
  }, [analytics]);

  const selectedDateStr = toLocalDateStr(date);
  const selectedDateTrade = tradeData[selectedDateStr];

  // Fetch actual trades for the selected date (only when there's trade data for that day)
  const { data: dayTradesResponse, isFetching: dayTradesFetching } = useTrades(
    {
      page: tradePage,
      size: TRADES_PER_PAGE,
      accountIds: accountId,
      entryDateFrom: `${selectedDateStr}T00:00:00+0000`,
      entryDateTo: `${selectedDateStr}T23:59:59+0000`,
    },
    { enabled: !!selectedDateTrade }
  );

  const dayTrades = dayTradesResponse?.content || [];
  const dayTotalTrades = dayTradesResponse?.totalElements || 0;
  const dayTotalPages = Math.max(1, Math.ceil(dayTotalTrades / TRADES_PER_PAGE));

  // Reset trade page when date changes
  React.useEffect(() => {
    setTradePage(0);
  }, [selectedDateStr]);

  const renderDay = (props: DayContentProps) => {
    const dateStr = toLocalDateStr(props.date);
    const tradeInfo = tradeData[dateStr];

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{props.date.getDate()}</span>
        {tradeInfo && (
          <div
            className={cn(
              "absolute top-0 right-0 h-2 w-2 rounded-full",
              tradeInfo.result === 'win' ? 'bg-profit' : 'bg-loss'
            )}
          />
        )}
      </div>
    );
  };

  const selectedDateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Card className="glass-card animate-slide-up flex flex-col" style={{ animationDelay: '0.3s' }}>
      <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Trading Calendar</CardTitle>
            <CardDescription className="text-muted-foreground">Your trading activity for {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
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
      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        {/* Calendar + Day summary side by side */}
        <div className="flex flex-col lg:flex-row px-1 pt-2 pb-4 flex-shrink-0">
          <div className="flex-1">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              month={month}
              onMonthChange={setMonth}
              className="rounded-xl border border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 p-4 w-full"
              components={{
                DayContent: renderDay
              }}
              disabled={{ after: new Date() }}
            />
          </div>

          <div className="lg:w-72 mt-6 lg:mt-0 lg:ml-6 lg:border-l border-slate-200/50 dark:border-white/10 lg:pl-6 px-6 lg:px-0">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Selected: {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>

            {selectedDateTrade ? (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground dark:text-white">Result</span>
                  <Badge variant={selectedDateTrade.result === 'win' ? 'default' : 'destructive'} className={cn(
                    "capitalize shadow-[0_0_10px_rgba(0,0,0,0.2)]",
                    selectedDateTrade.result === 'win' ? "bg-profit hover:bg-profit/90 text-black font-bold" : "bg-loss hover:bg-loss/90 text-white font-bold"
                  )}>
                    {selectedDateTrade.result}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm font-medium text-foreground dark:text-white">P&L</span>
                  <span className={cn(
                    "text-xl font-bold font-mono tracking-tight",
                    selectedDateTrade.amount > 0 ? "text-profit" : "text-loss"
                  )}>
                    {selectedDateTrade.amount > 0 ? "+" : ""}${Math.abs(selectedDateTrade.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50 dark:border-white/10">
                  <span className="text-sm font-medium text-muted-foreground">Trades</span>
                  <span className="text-sm font-medium text-foreground dark:text-white">{selectedDateTrade.tradesCount}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm">No trades on this date</p>
              </div>
            )}
          </div>
        </div>

        {/* Trades table — fills remaining space with scroll */}
        <div className="border-t border-slate-200/50 dark:border-white/5 flex flex-col flex-1 min-h-0">
          {selectedDateTrade ? (
            <>
              <div className="px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground dark:text-white">
                    Trades for {selectedDateLabel}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dayTotalTrades} trade{dayTotalTrades !== 1 ? 's' : ''} executed
                  </p>
                </div>
              </div>

              {dayTradesFetching && dayTrades.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : dayTrades.length > 0 ? (
                <>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <Table>
                      <TableHeader className="bg-slate-100 dark:bg-white/5 sticky top-0 z-10">
                        <TableRow className="border-slate-200/50 dark:border-white/5 hover:bg-transparent">
                          <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Symbol</TableHead>
                          <TableHead className="hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground">Time</TableHead>
                          <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Position</TableHead>
                          <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayTrades.map((trade) => (
                          <TableRow key={trade.id} className="hover:bg-slate-100 dark:hover:bg-white/5 border-slate-200/50 dark:border-white/5 transition-colors group">
                            <TableCell className="font-bold text-foreground dark:text-white group-hover:text-primary transition-colors font-mono text-sm py-2">
                              {trade.symbol}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs py-2">
                              {trade.entryDate ? new Date(trade.entryDate).toLocaleString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : '-'}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "capitalize font-mono text-xs border backdrop-blur-sm",
                                  trade.direction === 'long' || trade.direction === 'buy'
                                    ? "border-primary/30 text-primary bg-primary/10"
                                    : "border-accent/30 text-foreground dark:text-white bg-accent/20"
                                )}
                              >
                                {trade.direction === 'buy' ? 'long' : trade.direction === 'sell' ? 'short' : trade.direction}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn(
                              "text-right font-bold font-mono tracking-tight text-sm py-2",
                              (trade.profit ?? 0) > 0 ? "text-profit" : (trade.profit ?? 0) < 0 ? "text-loss" : "text-muted-foreground"
                            )}>
                              {trade.profit !== undefined ? `${trade.profit > 0 ? "+" : ""}$${trade.profit.toFixed(2)}` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination footer — matches Trade History style */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50 dark:border-white/5 flex-shrink-0">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground dark:text-white">{tradePage * TRADES_PER_PAGE + 1}</span> to{' '}
                      <span className="font-medium text-foreground dark:text-white">{Math.min((tradePage + 1) * TRADES_PER_PAGE, dayTotalTrades)}</span> of{' '}
                      <span className="font-medium text-foreground dark:text-white">{dayTotalTrades}</span> trades
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" disabled={tradePage === 0} onClick={() => setTradePage(0)}>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" disabled={tradePage === 0} onClick={() => setTradePage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-xs font-medium px-2">
                        Page {tradePage + 1} / {dayTotalPages}
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" disabled={tradePage >= dayTotalPages - 1} onClick={() => setTradePage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground" disabled={tradePage >= dayTotalPages - 1} onClick={() => setTradePage(dayTotalPages - 1)}>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
                  No trade details available
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm py-6">
              Select a date with trades to view details
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingCalendar;
