import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Circle,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useMentorActivity,
  useLoadMoreActivity,
} from '@/hooks/useMentor';
import type {
  MentorActivityEventDto,
  MentorActivityEventType,
} from '@/types/dto';

interface ActivityFeedProps {
  onSelectStudent: (studentUserId: string) => void;
}

const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
};

const pickString = (
  payload: Record<string, unknown> | null,
  key: string
): string | undefined => {
  if (!payload) return undefined;
  const v = payload[key];
  return typeof v === 'string' ? v : undefined;
};

const pickNumber = (
  payload: Record<string, unknown> | null,
  key: string
): number | undefined => {
  if (!payload) return undefined;
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};

const formatPnl = (n: number): string => {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}`;
};

const EVENT_ICON: Record<
  MentorActivityEventType,
  { Icon: React.ComponentType<{ className?: string }>; tint: string }
> = {
  STUDENT_JOINED: {
    Icon: UserPlus,
    tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  STUDENT_LEFT: {
    Icon: UserMinus,
    tint: 'bg-muted/60 text-muted-foreground',
  },
  TRADE_CLOSED: {
    Icon: TrendingUp, // overridden per pnl sign
    tint: 'bg-primary/10 text-primary',
  },
  TRADE_OPENED: {
    Icon: Circle,
    tint: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  PSYCH_LOGGED: {
    Icon: Brain,
    tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
};

interface EventRowProps {
  event: MentorActivityEventDto;
  onSelect: (studentUserId: string) => void;
}

const EventRow: React.FC<EventRowProps> = ({ event, onSelect }) => {
  const { t } = useTranslation();

  const base = EVENT_ICON[event.eventType];
  let Icon = base.Icon;
  let tint = base.tint;

  let message: React.ReactNode = null;

  switch (event.eventType) {
    case 'STUDENT_JOINED':
      message = t('mentor.activity.joined', '{{u}} joined your space', {
        u: event.username,
      });
      break;
    case 'STUDENT_LEFT':
      message = t('mentor.activity.left', '{{u}} left', {
        u: event.username,
      });
      break;
    case 'TRADE_CLOSED': {
      const pnl = pickNumber(event.payload, 'pnl');
      const symbol = pickString(event.payload, 'symbol') ?? '?';
      if (pnl != null && pnl >= 0) {
        Icon = TrendingUp;
        tint = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      } else if (pnl != null && pnl < 0) {
        Icon = TrendingDown;
        tint = 'bg-destructive/10 text-destructive';
      }
      message = t(
        'mentor.activity.tradeClosed',
        '{{u}} closed {{sym}} {{pnl}}',
        {
          u: event.username,
          sym: symbol,
          pnl: pnl != null ? formatPnl(pnl) : '',
        }
      );
      break;
    }
    case 'TRADE_OPENED': {
      const symbol = pickString(event.payload, 'symbol') ?? '?';
      const direction =
        pickString(event.payload, 'direction') ??
        pickString(event.payload, 'type') ??
        '';
      message = t(
        'mentor.activity.tradeOpened',
        '{{u}} opened {{sym}} {{dir}}',
        { u: event.username, sym: symbol, dir: direction }
      );
      break;
    }
    case 'PSYCH_LOGGED': {
      const emotion = pickString(event.payload, 'emotion') ?? '';
      message = t('mentor.activity.psychLogged', '{{u}} logged {{emotion}}', {
        u: event.username,
        emotion,
      });
      break;
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(event.studentUserId)}
        className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <span
          className={[
            'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
            tint,
          ].join(' ')}
          aria-hidden="true"
        >
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug truncate">{message}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {formatRelative(event.occurredAt)}
          </p>
        </div>
      </button>
    </li>
  );
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onSelectStudent }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useMentorActivity({ limit: 50 });
  const loadMore = useLoadMoreActivity();

  const events = useMemo(() => data ?? [], [data]);

  const oldest = events.length > 0 ? events[events.length - 1].occurredAt : null;

  return (
    <section
      aria-labelledby="activity-heading"
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
        <h2 id="activity-heading" className="text-base font-semibold">
          {t('mentor.activity.title', 'Recent activity')}
        </h2>
        {events.length > 0 && (
          <span className="text-xs text-muted-foreground">({events.length})</span>
        )}
      </div>

      {isLoading ? (
        <div
          className="h-40 rounded-xl bg-muted/20 animate-pulse"
          aria-busy="true"
        />
      ) : events.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium">
            {t('mentor.activity.emptyTitle', 'No activity yet')}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {t(
              'mentor.activity.emptyDesc',
              "When students join or trade, you'll see it here."
            )}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border/40 rounded-xl border border-border/40 overflow-hidden">
            {events.map((e) => (
              <EventRow key={e.id} event={e} onSelect={onSelectStudent} />
            ))}
          </ul>
          {oldest && (
            <div className="flex justify-center mt-3">
              <Button
                size="sm"
                variant="outline"
                disabled={loadMore.isPending}
                onClick={() => loadMore.mutate(oldest)}
              >
                {loadMore.isPending
                  ? t('common.loading', 'Loading...')
                  : t('mentor.activity.loadMore', 'Load more')}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ActivityFeed;
