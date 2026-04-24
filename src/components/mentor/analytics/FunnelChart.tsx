import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FunnelReportDto } from '@/types/dto';

interface Props {
  data: FunnelReportDto;
}

const STAGE_KEYS: (keyof FunnelReportDto)[] = [
  'impressions',
  'cardClicks',
  'profileViews',
  'checkoutStarted',
  'checkoutCompleted',
  'joins',
];

const STAGE_COLORS = [
  'hsl(var(--primary))',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#10b981',
  '#059669',
];

interface ConversionRate {
  fromKey: keyof FunnelReportDto;
  toKey: keyof FunnelReportDto;
  labelKey: string;
}

const CONVERSIONS: ConversionRate[] = [
  { fromKey: 'impressions', toKey: 'cardClicks', labelKey: 'mentor.analytics.ctr' },
  { fromKey: 'cardClicks', toKey: 'profileViews', labelKey: 'mentor.analytics.viewRate' },
  { fromKey: 'profileViews', toKey: 'checkoutStarted', labelKey: 'mentor.analytics.intentRate' },
  { fromKey: 'checkoutStarted', toKey: 'checkoutCompleted', labelKey: 'mentor.analytics.paymentRate' },
  { fromKey: 'checkoutCompleted', toKey: 'joins', labelKey: 'mentor.analytics.joinRate' },
];

const pct = (num: number, denom: number): string => {
  if (!denom) return '—';
  return `${((num / denom) * 100).toFixed(1)}%`;
};

const FunnelChart: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = STAGE_KEYS.map((key, i) => ({
    name: t(`mentor.analytics.stages.${key}`, key),
    value: data[key],
    color: STAGE_COLORS[i],
  }));

  const STAGE_LABELS: Record<keyof FunnelReportDto, string> = {
    impressions: t('mentor.analytics.stages.impressions', 'Impressions'),
    cardClicks: t('mentor.analytics.stages.cardClicks', 'Card clicks'),
    profileViews: t('mentor.analytics.stages.profileViews', 'Profile views'),
    checkoutStarted: t('mentor.analytics.stages.checkoutStarted', 'Checkout started'),
    checkoutCompleted: t('mentor.analytics.stages.checkoutCompleted', 'Checkout done'),
    joins: t('mentor.analytics.stages.joins', 'Joins'),
  };

  const CONVERSION_LABELS: Record<string, string> = {
    'mentor.analytics.ctr': t('mentor.analytics.ctr', 'CTR'),
    'mentor.analytics.viewRate': t('mentor.analytics.viewRate', 'View rate'),
    'mentor.analytics.intentRate': t('mentor.analytics.intentRate', 'Intent rate'),
    'mentor.analytics.paymentRate': t('mentor.analytics.paymentRate', 'Payment rate'),
    'mentor.analytics.joinRate': t('mentor.analytics.joinRate', 'Join rate'),
  };

  return (
    <div className="space-y-5">
      {/* Bar chart */}
      <div className="h-56" role="img" aria-label={t('mentor.analytics.funnelChartAriaLabel', 'Mentor funnel chart')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 4, left: -10 }}
            barCategoryGap="25%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name,
              ]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion rate rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {CONVERSIONS.map((conv) => (
          <div
            key={conv.labelKey}
            className="flex items-center justify-between gap-2 rounded-xl bg-muted/20 px-3 py-2.5 border border-border/40"
          >
            <span className="text-xs text-muted-foreground truncate">
              {CONVERSION_LABELS[conv.labelKey]}
              {' '}
              <span className="text-foreground/50 text-[10px]">
                {STAGE_LABELS[conv.fromKey]} → {STAGE_LABELS[conv.toKey]}
              </span>
            </span>
            <span className="text-sm font-semibold tabular-nums shrink-0">
              {pct(data[conv.toKey], data[conv.fromKey])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FunnelChart;
