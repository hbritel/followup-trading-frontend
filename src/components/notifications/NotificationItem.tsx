import React from 'react';
import {
  AlertTriangle,
  RefreshCcw,
  ArrowDownToDot,
  Unplug,
  Sparkles,
  Shield,
  BookText,
  Bell,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { NotificationDto } from '@/types/dto';

// ---------------------------------------------------------------------------
// Icon mapping by notification type
// ---------------------------------------------------------------------------

const TYPE_ICON_MAP: Record<string, { Icon: React.ElementType; color: string }> = {
  ALERT_TRIGGERED: { Icon: AlertTriangle, color: 'text-amber-400' },
  SYNC_COMPLETED: { Icon: RefreshCcw, color: 'text-emerald-400' },
  TRADE_IMPORTED: { Icon: ArrowDownToDot, color: 'text-emerald-400' },
  BROKER_DISCONNECTED: { Icon: Unplug, color: 'text-red-400' },
  WEEKLY_DIGEST: { Icon: Sparkles, color: 'text-primary' },
  NEW_LOGIN_DETECTED: { Icon: Shield, color: 'text-amber-400' },
  JOURNAL_REMINDER: { Icon: BookText, color: 'text-blue-400' },
};

const DEFAULT_ICON = { Icon: Bell, color: 'text-muted-foreground' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: NotificationDto;
  onRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead }) => {
  const { Icon, color } = TYPE_ICON_MAP[notification.type] ?? DEFAULT_ICON;

  const isUnread = !notification.read;
  const isHighPriority = notification.priority === 'HIGH';

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className={cn(
        'w-full text-left px-4 py-3 flex gap-3 transition-colors duration-150',
        'hover:bg-white/5 focus-visible:outline-none focus-visible:bg-white/5',
        isUnread && !isHighPriority && 'border-l-[3px] border-primary bg-primary/5',
        isUnread && isHighPriority && 'border-l-[3px] border-red-500 bg-red-500/5',
        !isUnread && 'border-l-[3px] border-transparent opacity-60',
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        <Icon className={cn('h-4 w-4', color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', isUnread ? 'font-semibold' : 'font-medium')}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground font-mono">{timeAgo}</p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div
          className={cn(
            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
            isHighPriority ? 'bg-red-500' : 'bg-primary',
          )}
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export default NotificationItem;
