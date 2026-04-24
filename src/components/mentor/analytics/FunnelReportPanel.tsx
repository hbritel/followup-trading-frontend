import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FunnelChart from './FunnelChart';
import { useFunnelReport } from '@/hooks/useMentorRevenue';

type Preset = '7d' | '30d' | '90d' | 'custom';

const PRESETS: { key: Preset; label: string; days: number }[] = [
  { key: '7d', label: '7d', days: 7 },
  { key: '30d', label: '30d', days: 30 },
  { key: '90d', label: '90d', days: 90 },
];

const toApiDate = (d: Date) => format(d, 'yyyy-MM-dd');

const FunnelReportPanel: React.FC = () => {
  const { t } = useTranslation();

  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState(() =>
    toApiDate(subDays(new Date(), 30))
  );
  const [customTo, setCustomTo] = useState(() => toApiDate(new Date()));

  const { from, to } = (() => {
    if (preset !== 'custom') {
      const days = PRESETS.find((p) => p.key === preset)?.days ?? 30;
      return {
        from: toApiDate(subDays(new Date(), days)),
        to: toApiDate(new Date()),
      };
    }
    return { from: customFrom, to: customTo };
  })();

  const { data, isLoading, error } = useFunnelReport(from, to);

  return (
    <section
      aria-labelledby="funnel-heading"
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="funnel-heading" className="text-base font-semibold">
            {t('mentor.analytics.title', 'Funnel analytics')}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              variant={preset === p.key ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
          <Button
            variant={preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setPreset('custom')}
          >
            <Calendar className="w-3.5 h-3.5" />
            {t('mentor.analytics.custom', 'Custom')}
          </Button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="funnel-from" className="text-xs">
              {t('mentor.analytics.from', 'From')}
            </Label>
            <Input
              id="funnel-from"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="funnel-to" className="text-xs">
              {t('mentor.analytics.to', 'To')}
            </Label>
            <Input
              id="funnel-to"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t('mentor.analytics.loading', 'Loading…')}</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {t('mentor.analytics.error', 'Failed to load funnel data. Try again.')}
        </div>
      )}

      {data && !isLoading && <FunnelChart data={data} />}
    </section>
  );
};

export default FunnelReportPanel;
