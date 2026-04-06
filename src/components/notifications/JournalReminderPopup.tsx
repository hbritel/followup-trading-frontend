import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, BookText, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JournalReminderPopupProps {
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

const SNOOZE_OPTIONS = [5, 15, 30] as const;
const AUTO_DISMISS_MS = 60_000;

const JournalReminderPopup: React.FC<JournalReminderPopupProps> = ({ onDismiss, onSnooze }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(), 300);
  }, [onDismiss]);

  useEffect(() => {
    // Animate in on next frame so the CSS transition fires
    const rafId = requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 60 s with no interaction
    const autoDismissTimer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(autoDismissTimer);
    };
  }, [dismiss]);

  const handleOpenJournal = () => {
    dismiss();
    navigate('/daily-journal');
  };

  const handleSnooze = (minutes: number) => {
    setExiting(true);
    setTimeout(() => onSnooze(minutes), 300);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-label={t('journal.reminderTitle', 'Time to journal!')}
      className={cn(
        'fixed top-20 right-4 z-50 w-80 transition-all duration-300 ease-out',
        visible && !exiting
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
      )}
    >
      <div className="glass-card rounded-2xl p-5 border border-blue-500/20 shadow-2xl shadow-blue-500/10 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <BookText className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {t('journal.reminderTitle', 'Time to journal!')}
              </p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                {t('journal.reminderSubtitle', 'Daily trading reflection')}
              </p>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('common.cancel', 'Dismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body message */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(
            'journal.reminderMessage',
            "Take a moment to record your trades and reflect on today's performance.",
          )}
        </p>

        {/* Primary CTA */}
        <Button onClick={handleOpenJournal} size="sm" className="w-full">
          {t('journal.openJournal', 'Open Journal')}
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>

        {/* Snooze row */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            {t('journal.snooze', 'Snooze')}:
          </span>
          <div className="flex gap-1.5">
            {SNOOZE_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => handleSnooze(min)}
                className="text-xs px-2 py-1 rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${t('journal.snooze', 'Snooze')} ${min} ${t('journal.minutes', 'min')}`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalReminderPopup;
