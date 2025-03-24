
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
    <Card className={cn("overflow-hidden animate-fade-in", className)}>
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <div>
          <CardTitle className="text-base font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {icon && (
          <div className="p-1.5 rounded-lg bg-accent/50">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend === 'up' && "text-profit",
              trend === 'down' && "text-loss",
              trend === 'neutral' && "text-muted-foreground"
            )}>
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trendValue}
            </div>
          )}
        </div>
        
        {description && (
          <CardDescription className="text-xs font-medium mt-1">
            {description}
          </CardDescription>
        )}
        
        {progressValue !== undefined && (
          <div className="mt-3">
            <Progress 
              value={progressValue} 
              className={cn("h-1", progressColor)} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TradingStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Win Rate"
        value="71.43%"
        description="Last 30 days"
        icon={<PercentIcon className="h-4 w-4 text-primary" />}
        trend="up"
        trendValue="5.2%"
        progressValue={71}
        progressColor="bg-primary"
      />
      
      <StatCard
        title="Average Profit"
        value="$62.11"
        description="Per trade"
        icon={<DollarSign className="h-4 w-4 text-profit" />}
        trend="up"
        trendValue="$3.40"
        progressValue={62}
        progressColor="bg-profit"
      />
      
      <StatCard
        title="Profit Factor"
        value="2.768"
        description="Gross profit / gross loss"
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
        trend="up"
        trendValue="0.21"
        progressValue={68}
        progressColor="bg-primary"
      />
      
      <StatCard
        title="Total P&L"
        value="$1,739.02"
        description="Realized profit & loss"
        icon={<DollarSign className="h-4 w-4 text-profit" />}
        trend="up"
        trendValue="$231.15"
        progressValue={85}
        progressColor="bg-profit"
      />
    </div>
  );
};

export default TradingStats;
