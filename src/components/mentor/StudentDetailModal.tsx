import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldAlert, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useStudentMetrics,
  useStudentTrades,
  useStudentPsychology,
} from '@/hooks/useMentor';

interface StudentDetailModalProps {
  studentUserId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Shown when the student has not shared a particular category */
const NotSharedBanner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <ShieldAlert className="w-6 h-6 text-amber-400" />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('mentor.notShared', 'Student has not shared this data')}
      </p>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/* ── Metrics Tab ──────────────────────────────────────────── */
const MetricsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: metrics, isLoading, isError } = useStudentMetrics(userId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !metrics) return <NotSharedBanner />;

  const items: { label: string; value: string | number }[] = [
    { label: 'Total Trades', value: metrics.totalTrades ?? 'N/A' },
    { label: 'Win Rate', value: metrics.winRate != null ? `${(metrics.winRate * 100).toFixed(1)}%` : 'N/A' },
    { label: 'Profit Factor', value: metrics.profitFactor?.toFixed(2) ?? 'N/A' },
    { label: 'Total P&L', value: metrics.totalPnl != null ? `$${metrics.totalPnl.toFixed(2)}` : 'N/A' },
    { label: 'Avg Win', value: metrics.avgWin != null ? `$${metrics.avgWin.toFixed(2)}` : 'N/A' },
    { label: 'Avg Loss', value: metrics.avgLoss != null ? `$${metrics.avgLoss.toFixed(2)}` : 'N/A' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-muted/30 border border-border/30 p-4"
        >
          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
          <p className="text-lg font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

/* ── Trades Tab ───────────────────────────────────────────── */
const TradesTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: trades, isLoading, isError } = useStudentTrades(userId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !trades) return <NotSharedBanner />;
  if (Array.isArray(trades) && trades.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground text-sm">
        No trades to display.
      </p>
    );
  }

  const tradeList = Array.isArray(trades) ? trades : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-muted-foreground text-left">
            <th className="py-2 px-2 font-medium">Symbol</th>
            <th className="py-2 px-2 font-medium">Direction</th>
            <th className="py-2 px-2 font-medium text-right">P&L</th>
            <th className="py-2 px-2 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {tradeList.slice(0, 50).map((trade: Record<string, unknown>, idx: number) => {
            const pnl = Number(trade.pnl ?? trade.profit ?? 0);
            const direction = String(trade.direction ?? trade.type ?? '');
            return (
              <tr
                key={String(trade.id ?? idx)}
                className="border-b border-border/30"
              >
                <td className="py-2 px-2 font-medium">
                  {String(trade.symbol ?? '')}
                </td>
                <td className="py-2 px-2">
                  <span className="flex items-center gap-1">
                    {direction.toUpperCase() === 'BUY' || direction.toUpperCase() === 'LONG' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    )}
                    {direction}
                  </span>
                </td>
                <td
                  className={[
                    'py-2 px-2 text-right font-medium',
                    pnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                  ].join(' ')}
                >
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </td>
                <td className="py-2 px-2 text-muted-foreground">
                  {trade.openTime
                    ? new Date(String(trade.openTime)).toLocaleDateString()
                    : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ── Psychology Tab ───────────────────────────────────────── */
const PsychologyTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: psychology, isLoading, isError } = useStudentPsychology(userId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !psychology) return <NotSharedBanner />;

  const entries = Array.isArray(psychology) ? psychology : [];

  if (entries.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground text-sm">
        No psychology entries to display.
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {entries.map((entry: Record<string, unknown>, idx: number) => (
        <div
          key={String(entry.id ?? idx)}
          className="rounded-xl bg-muted/30 border border-border/30 p-4 space-y-1"
        >
          {entry.emotion && (
            <span className="text-lg">{String(entry.emotion)}</span>
          )}
          {entry.note && (
            <p className="text-sm text-muted-foreground">
              {String(entry.note)}
            </p>
          )}
          {entry.date && (
            <p className="text-xs text-muted-foreground/60">
              {new Date(String(entry.date)).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main Modal ───────────────────────────────────────────── */
const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentUserId,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t('mentor.studentDetail', 'Student Detail')}
          </DialogTitle>
        </DialogHeader>

        {studentUserId && (
          <Tabs defaultValue="metrics" className="mt-2">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="metrics" className="rounded-lg py-2 text-sm">
                {t('mentor.metrics', 'Metrics')}
              </TabsTrigger>
              <TabsTrigger value="trades" className="rounded-lg py-2 text-sm">
                {t('mentor.trades', 'Trades')}
              </TabsTrigger>
              <TabsTrigger value="psychology" className="rounded-lg py-2 text-sm">
                {t('mentor.psychology', 'Psychology')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-4">
              <MetricsTab userId={studentUserId} />
            </TabsContent>
            <TabsContent value="trades" className="mt-4">
              <TradesTab userId={studentUserId} />
            </TabsContent>
            <TabsContent value="psychology" className="mt-4">
              <PsychologyTab userId={studentUserId} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
