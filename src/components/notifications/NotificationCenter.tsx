import React, { useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useLiveNotifications,
} from '@/hooks/useNotifications';
import { usePreferences } from '@/contexts/preferences-context';
import NotificationItem from './NotificationItem';

// ---------------------------------------------------------------------------
// Unread badge
// ---------------------------------------------------------------------------

interface UnreadBadgeProps {
  count: number;
}

const formatBadgeCount = (count: number): string => {
  if (count > 99) return '99+';
  return String(count);
};

const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count }) => {
  if (count <= 0) return null;
  const label = formatBadgeCount(count);
  const isWide = label.length > 2;
  return (
    <span
      aria-label={`${count} unread notifications`}
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none z-10',
        isWide ? 'h-5 min-w-5 px-1' : 'h-5 w-5',
      )}
    >
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Notification panel content (shared between popover and sheet)
// ---------------------------------------------------------------------------

interface PanelContentProps {
  onClose: () => void;
}

const NotificationPanelContent: React.FC<PanelContentProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(20);
  const { data, isLoading } = useNotifications(0, pageSize);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.content ?? [];
  const hasUnread = notifications.some((n) => !n.read);
  const hasMore = data ? notifications.length < data.totalElements : false;

  const handleRead = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      markAsRead.mutate(id);
    }
    if (notification?.link) {
      onClose();
      navigate(notification.link);
    }
  };

  const handleMarkAll = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-semibold">{t('notifications.title', 'Notifications')}</h2>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={markAllAsRead.isPending}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            {t('notifications.markAllRead', 'Mark all as read')}
          </Button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              {t('notifications.noNotifications', 'No notifications yet')}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {t(
                'notifications.noNotificationsDescription',
                "You'll see alerts, sync updates, and more here.",
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer — load more */}
      {hasMore && (
        <div className="border-t border-border/50 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setPageSize((s) => s + 20)}
          >
            {t('notifications.loadMore', 'Load more')}
          </Button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main NotificationCenter component
// ---------------------------------------------------------------------------

const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { data: unreadData } = useUnreadCount();
  const { preferences } = usePreferences();
  const unreadCount = unreadData?.count ?? 0;
  const showBadge = preferences?.showNotificationBadge !== false; // default true

  // Subscribe to live WebSocket notifications
  useLiveNotifications();

  const bellButton = (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('navbar.notifications', 'Notifications')}
      className="relative"
    >
      <Bell className="h-5 w-5" />
      {showBadge && <UnreadBadge count={unreadCount} />}
    </Button>
  );

  // Mobile: full-width sheet from bottom
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{bellButton}</SheetTrigger>
        <SheetContent side="bottom" className="glass-panel rounded-t-2xl p-0 h-[85vh] flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('notifications.title', 'Notifications')}</SheetTitle>
          </SheetHeader>
          <NotificationPanelContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: popover near the bell icon
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{bellButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          'glass-panel w-96 rounded-2xl p-0 overflow-hidden',
          'border border-border/50',
          'shadow-2xl dark:shadow-none',
        )}
      >
        <NotificationPanelContent onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
