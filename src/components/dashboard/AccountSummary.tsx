
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
    <div className="flex flex-col p-4 bg-background border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
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
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-base font-semibold mt-1">{value}</span>
      {previousValue && (
        <span className="text-xs mt-1 text-muted-foreground">
          Previous: {previousValue}
        </span>
      )}
      {changePercentage && (
        <span className={cn(
          "text-xs font-medium mt-0.5",
          trend === 'up' && "text-profit",
          trend === 'down' && "text-loss",
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 animate-slide-up">
        <CardHeader className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
              <CardDescription>Overview of your trading account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
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
          
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Risk Assessment</h3>
                  <p className="text-lg font-bold mt-1">Low Risk</p>
                </div>
                <ShieldAlert className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Portfolio Risk Level</span>
                  <span className="text-xs font-medium">15%</span>
                </div>
                <Progress value={15} className="h-1.5 bg-accent" />
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-background">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Performance Metrics</h3>
                  <p className="text-lg font-bold mt-1">Above Average</p>
                </div>
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
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
      
      <Card className="lg:row-span-1 animate-slide-up">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-lg font-semibold">Trade Statistics</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Winning Trades</span>
                <span className="text-sm font-medium text-profit">70%</span>
              </div>
              <Progress value={70} className="h-1.5 mt-2 bg-accent" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Win/Loss Ratio</span>
                <span className="text-sm font-medium text-profit">2.3:1</span>
              </div>
              <Progress value={70} className="h-1.5 mt-2 bg-accent" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk/Reward Ratio</span>
                <span className="text-sm font-medium text-profit">1:2.5</span>
              </div>
              <Progress value={72} className="h-1.5 mt-2 bg-accent" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Hold Time</span>
                <span className="text-sm font-medium">34 min</span>
              </div>
              <Progress value={34} className="h-1.5 mt-2 bg-accent" />
            </div>
            
            <div className="pt-2 flex justify-between">
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
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummary;
