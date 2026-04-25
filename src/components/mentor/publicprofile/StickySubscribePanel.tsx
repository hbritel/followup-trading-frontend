import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MentorPublicProfileDto } from '@/types/dto';

interface Props {
  profile: MentorPublicProfileDto;
  priceLabel: string;
  onSubscribe: () => void;
}

const STORAGE_KEY_PREFIX = 'mentor.stickySub.dismissed.';
const SCROLL_TRIGGER_RATIO = 0.35;

const StickySubscribePanel: React.FC<Props> = ({ profile, priceLabel, onSubscribe }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const accent = profile.primaryColor || undefined;

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${profile.slug}`;
    try {
      if (sessionStorage.getItem(storageKey) === '1') {
        setDismissed(true);
        return;
      }
    } catch {
      /* sessionStorage unavailable */
    }

    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = window.scrollY + window.innerHeight;
      const total = doc.scrollHeight;
      if (total <= window.innerHeight + 100) return;
      const ratio = window.scrollY / (total - window.innerHeight);
      setVisible(ratio >= SCROLL_TRIGGER_RATIO);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [profile.slug]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${profile.slug}`, '1');
    } catch {
      /* noop */
    }
  };

  if (dismissed) return null;

  return (
    <div
      aria-hidden={!visible}
      className={[
        'fixed z-40 pointer-events-none transition-all duration-500 ease-out',
        'bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      <div
        className="glass-card rounded-2xl border border-border/60 shadow-xl shadow-primary/10 overflow-hidden backdrop-blur-xl"
        style={accent ? { boxShadow: `0 12px 36px -12px ${accent}33, inset 3px 0 0 0 ${accent}` } : undefined}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('common.dismiss', 'Dismiss')}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="p-4 pr-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground leading-none">
              {t('mentor.legal.profile.subscribeCta.ready', 'Ready to join?')}
            </p>
            <p className="text-sm font-semibold truncate">
              {profile.brandName}
              <span className="ml-1 text-muted-foreground font-normal">
                · {priceLabel}
                <span className="text-xs">/{t('mentor.monetization.month', 'month')}</span>
              </span>
            </p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Button
            size="sm"
            className="w-full font-semibold relative overflow-hidden group"
            onClick={onSubscribe}
          >
            <span className="relative z-10">
              {t('mentor.legal.profile.subscribeCta.subscribeNow', 'Subscribe now')}
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700"
            />
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t('mentor.legal.profile.subscribeCta.cancelAnytime', 'Cancel anytime. No commitment.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StickySubscribePanel;
