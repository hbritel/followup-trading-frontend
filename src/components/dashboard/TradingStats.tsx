import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  PercentIcon, 
  TrendingUp 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  progressValue?: number;
  progressColor?: string;
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue,
  className,
  progressValue,
  progressColor = 'bg-primary'
}: StatCardProps) => {
  return (
    <Card className={cn(
      "overflow-hidden animate-fade-in group hover:border-primary/30 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] transition-all duration-300 hover:-translate-y-1", 
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
        </div>
        {icon && (
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-primary shadow-sm dark:shadow-[0_0_10px_rgba(var(--primary),0.2)] group-hover:text-primary-foreground group-hover:bg-primary/90 dark:group-hover:bg-primary/20 dark:group-hover:text-white dark:group-hover:border-primary/20 transition-all duration-300">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-1">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold font-mono tracking-tight text-foreground text-glow">{value}</div>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm border",
              trend === 'up' && "text-profit bg-profit/10 border-profit/20",
              trend === 'down' && "text-loss bg-loss/10 border-loss/20",
              trend === 'neutral' && "text-muted-foreground bg-muted/10 border-muted/20"
            )}>
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trendValue}
            </div>
          )}
        </div>
        
        {description && (
          <CardDescription className="text-xs font-medium mt-2 text-muted-foreground">
            {description}
          </CardDescription>
        )}
        
        {progressValue !== undefined && (
          <div className="mt-4 relative h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
             <div 
               className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out", progressColor)} 
               style={{ width: `${progressValue}%`, boxShadow: `0 0 10px var(--${progressColor.replace('bg-', '')})` }}
             />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TradingStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Win Rate"
        value="71.43%"
        description="Last 30 days"
        icon={<PercentIcon className="h-4 w-4" />}
        trend="up"
        trendValue="5.2%"
        progressValue={71}
        progressColor="bg-primary"
      />
      
      <StatCard
        title="Avg Profit"
        value="$62.11"
        description="Per trade"
        icon={<DollarSign className="h-4 w-4" />}
        trend="up"
        trendValue="$3.40"
        progressValue={62}
        progressColor="bg-profit"
      />
      
      <StatCard
        title="Profit Factor"
        value="2.76"
        description="Gross profit / gross loss"
        icon={<TrendingUp className="h-4 w-4" />}
        trend="up"
        trendValue="0.21"
        progressValue={68}
        progressColor="bg-primary"
      />
      
      <StatCard
        title="Total P&L"
        value="$1,739"
        description="Realized profit & loss"
        icon={<DollarSign className="h-4 w-4" />}
        trend="up"
        trendValue="$231.15"
        progressValue={85}
        progressColor="bg-profit"
      />
    </div>
  );
};

export default TradingStats;
