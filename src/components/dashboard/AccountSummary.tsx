import React from 'react';
import { 
  Calculator, 
  CreditCard, 
  DollarSign, 
  LineChart, 
  Percent, 
  ShieldAlert
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const accountMetrics = [
  {
    title: 'Total R-Value',
    value: 0,
    icon: <Calculator />,
    description: 'Based on risk tolerance',
  },
  {
    title: 'Deposit Return %',
    value: 'N/A',
    icon: <Percent />,
    description: 'Return on deposits',
  },
  {
    title: 'Account Value',
    value: '$1,739.02',
    icon: <DollarSign />,
    description: 'Current account value',
  },
  {
    title: 'Deposits',
    value: '$0.00',
    icon: <CreditCard />,
    description: 'Total deposits',
  }
];

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string, 
  value: string | number, 
  icon: React.ReactNode, 
  description: string 
}) => {
  return (
    <div className="flex flex-col p-5 bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors group shadow-sm dark:shadow-none">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.1)] group-hover:shadow-md dark:group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] group-hover:text-primary-foreground group-hover:bg-primary dark:group-hover:text-white dark:group-hover:bg-primary/30 transition-all duration-300">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground dark:text-glow">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

interface StatItemProps {
  label: string;
  value: string | number;
  previousValue?: string | number;
  changePercentage?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatItem = ({ 
  label, 
  value, 
  previousValue, 
  changePercentage, 
  trend, 
  className 
}: StatItemProps) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold mt-1 font-mono tracking-tight text-foreground dark:text-white">{value}</span>
      {previousValue && (
        <span className="text-xs mt-1 text-muted-foreground">
          Prev: {previousValue}
        </span>
      )}
      {changePercentage && (
        <span className={cn(
          "text-xs font-bold mt-1 px-1.5 py-0.5 rounded w-fit backdrop-blur-sm",
          trend === 'up' && "text-profit bg-profit/10 border border-profit/20",
          trend === 'down' && "text-loss bg-loss/10 border border-loss/20",
          !trend && "text-muted-foreground"
        )}>
          {trend === 'up' && '+'}
          {changePercentage}%
        </span>
      )}
    </div>
  );
};

const AccountSummary = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 glass-card animate-slide-up">
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Account Summary</CardTitle>
              <CardDescription className="text-muted-foreground">Overview of your trading account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {accountMetrics.map((metric, index) => (
              <MetricCard 
                key={index}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                description={metric.description}
              />
            ))}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200/50 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Risk Assessment</h3>
                  <p className="text-xl font-bold mt-1 text-foreground dark:text-white">Low Risk</p>
                </div>
                <ShieldAlert className="h-5 w-5 text-primary animate-pulse-glow" />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Portfolio Risk Level</span>
                  <span className="text-xs font-bold text-primary">15%</span>
                </div>
                <Progress value={15} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-primary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>
            </div>
            
            <div className="p-5 border border-slate-200/50 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Performance Metrics</h3>
                  <p className="text-xl font-bold mt-1 text-foreground dark:text-white">Above Average</p>
                </div>
                <LineChart className="h-5 w-5 text-profit" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <StatItem 
                  label="Sharpe Ratio" 
                  value="1.87" 
                  previousValue="1.43" 
                  changePercentage="30.8" 
                  trend="up" 
                />
                <StatItem 
                  label="Max Drawdown" 
                  value="-8.2%" 
                  previousValue="-12.6%" 
                  changePercentage="34.9" 
                  trend="up" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:row-span-1 glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="px-6 py-5 border-b border-slate-200/50 dark:border-white/5">
          <CardTitle className="text-lg font-semibold tracking-tight">Trade Statistics</CardTitle>
          <CardDescription className="text-muted-foreground">Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6 pb-8">
          <div className="space-y-6">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Winning Trades</span>
                <span className="text-sm font-bold text-profit dark:text-glow">70%</span>
              </div>
              <Progress value={70} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-profit/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--profit),0.5)]" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Win/Loss Ratio</span>
                <span className="text-sm font-bold text-foreground dark:text-white">2.3:1</span>
              </div>
              <Progress value={70} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-primary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Risk/Reward Ratio</span>
                <span className="text-sm font-bold text-foreground dark:text-white">1:2.5</span>
              </div>
              <Progress value={72} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-secondary/80 shadow-sm dark:shadow-[0_0_10px_rgba(var(--secondary),0.5)]" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Avg Hold Time</span>
                <span className="text-sm font-bold text-foreground dark:text-white">34 min</span>
              </div>
              <Progress value={34} className="h-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/5" indicatorClassName="bg-slate-400/50 dark:bg-white/50" />
            </div>
            
            <div className="pt-4 flex justify-between border-t border-slate-200/50 dark:border-white/10 mt-2">
              <StatItem 
                label="Best Trade" 
                value="$125.00" 
                changePercentage="7.2" 
                trend="up"
              />
              <StatItem 
                label="Worst Trade" 
                value="-$67.00" 
                changePercentage="3.9" 
                trend="down" 
                className="items-end text-right"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummary;
