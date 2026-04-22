import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CalendarDays, ExternalLink, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PayoffDiagram from './PayoffDiagram';
import { computeDte } from '@/lib/options/dte';
import type { OptionSpreadDto, SpreadStatus } from '@/types/dto';

interface SpreadDetailDialogProps {
  readonly spread: OptionSpreadDto | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly showGreeks?: boolean;
}

const STATUS_STYLES: Record<SpreadStatus, string> = {
  OPEN: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CLOSED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  EXPIRED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const LEG_TYPE_STYLES: Record<string, string> = {
  LONG_CALL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  SHORT_CALL: 'bg-red-500/15 text-red-400 border-red-500/25',
  LONG_PUT: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  SHORT_PUT: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  STOCK: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

function formatSpreadType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(value: number | null): string {
  if (value == null) return '--';
  return value >= 0 ? `$${value.toFixed(2)}` : `-$${Math.abs(value).toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString();
}

const SpreadDetailDialog: React.FC<SpreadDetailDialogProps> = ({
  spread,
  open,
  onOpenChange,
  showGreeks = false,
}) => {
  const { t } = useTranslation();

  if (!spread) return null;

  const sortedLegs = [...spread.legs].sort((a, b) => a.sortOrder - b.sortOrder);
  const dte = computeDte(spread.expirationDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="text-xl font-bold">
              {spread.underlying}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {formatSpreadType(spread.spreadType)}
              </span>
            </DialogTitle>
            <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[spread.status]}`}>
              {spread.status}
            </Badge>
            {dte.days != null && spread.status === 'OPEN' && (
              <Badge
                variant="outline"
                className={
                  dte.isExpiringSoon
                    ? 'text-[10px] bg-red-500/10 text-red-400 border-red-500/30'
                    : 'text-[10px] bg-white/5 text-muted-foreground border-white/10'
                }
              >
                {dte.days}d
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Payoff diagram */}
          <section>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-2">
              {t('options.payoffTitle', 'Payoff at expiration')}
            </h4>
            <PayoffDiagram legs={sortedLegs} />
          </section>

          {/* Key metrics */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label={t('options.netPremium')} value={formatCurrency(spread.netPremium)} />
            <Metric
              label={t('options.maxProfit')}
              value={formatCurrency(spread.maxProfit)}
              color="text-emerald-400"
            />
            <Metric
              label={t('options.maxLoss')}
              value={formatCurrency(spread.maxLoss)}
              color="text-red-400"
            />
            <Metric
              label={t('options.realizedPnl')}
              value={formatCurrency(spread.realizedPnl)}
              color={
                spread.realizedPnl != null && spread.realizedPnl >= 0
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }
            />
          </section>

          {/* Breakevens + expiry */}
          <section className="flex flex-wrap gap-4 text-sm">
            <InfoRow
              icon={<Target className="w-3.5 h-3.5" />}
              label={t('options.breakeven')}
              value={
                spread.breakevenLow == null && spread.breakevenHigh == null
                  ? '--'
                  : [
                      spread.breakevenLow != null ? `$${spread.breakevenLow.toFixed(2)}` : null,
                      spread.breakevenHigh != null ? `$${spread.breakevenHigh.toFixed(2)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' — ')
              }
            />
            <InfoRow
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              label={t('options.expiry')}
              value={formatDate(spread.expirationDate)}
            />
            <InfoRow
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              label={t('options.detectedAt', 'Detected')}
              value={formatDate(spread.detectedAt)}
            />
          </section>

          {/* Legs table */}
          <section>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-2">
              {t('options.legs')}
            </h4>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  <tr>
                    <th className="px-3 py-2 text-left">{t('options.legType', 'Type')}</th>
                    <th className="px-3 py-2 text-right">{t('options.strike', 'Strike')}</th>
                    <th className="px-3 py-2 text-right">{t('options.quantity', 'Qty')}</th>
                    <th className="px-3 py-2 text-right">{t('options.premium', 'Premium')}</th>
                    <th className="px-3 py-2 text-right">{t('options.source', 'Source')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLegs.map((leg) => (
                    <tr key={leg.id} className="border-t border-white/5">
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${LEG_TYPE_STYLES[leg.legType] ?? LEG_TYPE_STYLES.STOCK}`}
                        >
                          {leg.legType.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        ${leg.strike.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {leg.quantity}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {leg.premium == null ? '--' : `$${leg.premium.toFixed(2)}`}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          to={`/trades/${leg.tradeId}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                        >
                          {t('options.viewTrade', 'Trade')}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Greeks table — ELITE only */}
          {showGreeks && sortedLegs.some((l) => l.delta != null || l.theta != null) && (
            <section>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-2">
                {t('options.greeks', 'Greeks at entry')}
              </h4>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    <tr>
                      <th className="px-3 py-2 text-left">{t('options.legType', 'Type')}</th>
                      <th className="px-3 py-2 text-right">Δ {t('options.delta', 'Delta')}</th>
                      <th className="px-3 py-2 text-right">Γ {t('options.gamma', 'Gamma')}</th>
                      <th className="px-3 py-2 text-right">Θ {t('options.theta', 'Theta')}</th>
                      <th className="px-3 py-2 text-right">V {t('options.vega', 'Vega')}</th>
                      <th className="px-3 py-2 text-right">IV</th>
                      <th className="px-3 py-2 text-right">
                        {t('options.spotAtEntry', 'Spot')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLegs.map((leg) => (
                      <tr key={`g-${leg.id}`} className="border-t border-white/5">
                        <td className="px-3 py-2 font-mono text-xs">
                          {leg.legType.replace('_', ' ')}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {leg.delta == null ? '--' : leg.delta.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {leg.gamma == null ? '--' : leg.gamma.toFixed(4)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {leg.theta == null ? '--' : leg.theta.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {leg.vega == null ? '--' : leg.vega.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {leg.impliedVol == null ? '--' : `${(leg.impliedVol * 100).toFixed(1)}%`}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">
                          {leg.spotAtEntry == null ? '--' : `$${leg.spotAtEntry.toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                {t(
                  'options.greeksDisclaimer',
                  'Black-Scholes snapshot at entry. Theta per day, vega per 1 vol point. Short positions display sign-flipped Greeks.',
                )}
              </p>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Metric: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</p>
    <p className={`text-sm font-semibold mt-0.5 ${color ?? 'text-white'}`}>{value}</p>
  </div>
);

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className="text-muted-foreground/60">{icon}</span>
    <span className="text-xs text-muted-foreground/70">{label}:</span>
    <span className="text-sm font-medium text-white">{value}</span>
  </div>
);

export default SpreadDetailDialog;
