import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, BarChart3, Trash2, Edit2, Play, Clock, CheckCircle2, XCircle, DollarSign, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BacktestResponseDto, StrategyResponseDto } from '@/types/dto';

interface BacktestSessionListProps {
  sessions: BacktestResponseDto[];
  strategies?: StrategyResponseDto[];
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onEditSession: (session: BacktestResponseDto) => void;
  onDeleteSession: (id: string) => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  NOT_STARTED: { icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-amber-500/10 text-amber-500', label: 'Not Started' },
  ONGOING: { icon: <Play className="h-3.5 w-3.5" />, color: 'bg-blue-500/10 text-blue-500', label: 'Ongoing' },
  FINISHED: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-green-500/10 text-green-500', label: 'Finished' },
  FAILED: { icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-red-500/10 text-red-500', label: 'Failed' },
};

const BacktestSessionList: React.FC<BacktestSessionListProps> = ({
  sessions, strategies = [], onSelectSession, onCreateSession, onEditSession, onDeleteSession,
}) => {
  const { t } = useTranslation();

  const getStrategyName = (id: string | null) => {
    if (!id) return null;
    return strategies.find(s => s.id === id)?.name ?? null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create new session card */}
      <Card
        className="glass-card rounded-2xl border-dashed border-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        onClick={onCreateSession}
      >
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PlusCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">{t('backtesting.newSession')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('backtesting.newSessionHint')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Session cards */}
      {sessions.map((session, i) => {
        const status = statusConfig[session.status] ?? statusConfig.NOT_STARTED;
        const strategyName = getStrategyName(session.strategyId);
        let stats: { trades: number; winRate: number; pnl: number; balance: number } | null = null;

        if (session.sessionState) {
          try {
            const state = JSON.parse(session.sessionState);
            const trades = state.trades ?? [];
            const closed = trades.filter((t: { status: string }) => t.status !== 'OPEN');
            const totalPnl = closed.reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl ?? 0), 0);
            const wins = closed.filter((t: { pnl?: number }) => (t.pnl ?? 0) > 0).length;
            if (trades.length > 0) {
              stats = {
                trades: trades.length,
                winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
                pnl: totalPnl,
                balance: (session.initialCapital ?? 10000) + totalPnl,
              };
            }
          } catch { /* ignore */ }
        }

        return (
          <Card
            key={session.id}
            className="glass-card rounded-2xl cursor-pointer hover:border-primary/30 transition-all group animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => onSelectSession(session.id)}
          >
            <CardContent className="p-5">
              {/* Row 1: Icon/Name + Actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    {session.icon ? (
                      <span className="text-xl leading-none">{session.icon}</span>
                    ) : (
                      <BarChart3 className="h-5 w-5 text-indigo-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate max-w-[200px]">{session.name}</p>
                    {session.symbol && (
                      <p className="text-xs font-mono text-muted-foreground">{session.symbol}</p>
                    )}
                  </div>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  {session.status === 'NOT_STARTED' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEditSession(session); }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Row 2: Status + Timeframe + Strategy */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <Badge variant="secondary" className={cn('text-[10px]', status.color)}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
                {session.timeframe && (
                  <Badge variant="outline" className="text-[10px] font-mono">{session.timeframe}</Badge>
                )}
                {strategyName && (
                  <Badge variant="outline" className="text-[10px]">
                    <Target className="h-2.5 w-2.5 mr-0.5" />
                    {strategyName}
                  </Badge>
                )}
              </div>

              {/* Row 3: Dates | Capital — visually separated */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                <span>{session.startDate} → {session.endDate}</span>
                {session.initialCapital && (
                  <>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-0.5 font-mono">
                      <DollarSign className="h-3 w-3" />
                      {session.initialCapital.toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Row 4: Stats (if any trades taken) */}
              {stats && (
                <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t('backtesting.trades')}</p>
                    <p className="font-medium font-mono">{stats.trades}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('backtesting.winRate')}</p>
                    <p className="font-medium font-mono">{stats.winRate.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('backtesting.pnl')}</p>
                    <p className={cn('font-medium font-mono', stats.pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                      ${stats.pnl.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('backtesting.balance')}</p>
                    <p className={cn('font-medium font-mono', stats.pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                      ${stats.balance.toFixed(0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BacktestSessionList;
