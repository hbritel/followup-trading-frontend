import React from 'react';
import { useTranslation } from 'react-i18next';
import { Video, Users, Clock, Ticket, Loader2, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBuyWebinarTicket } from '@/hooks/useMentorRevenue';
import { useAuth } from '@/contexts/auth-context';
import type { WebinarDto } from '@/types/dto';

interface Props {
  webinar: WebinarDto;
  slug: string;
}

const WebinarCard: React.FC<Props> = ({ webinar, slug }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const buyTicket = useBuyWebinarTicket();

  const fmtDate = new Date(webinar.startsAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fmtPrice = (cents: number, currency: string) => {
    if (cents === 0) return t('mentor.webinars.free', 'Free');
    const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${sym}${(cents / 100).toFixed(2)}`;
  };

  const isUpcoming = new Date(webinar.startsAt) > new Date();

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigate(`/auth/signup?returnTo=/m/${slug}`);
      return;
    }
    buyTicket.mutate(
      { slug, webinarId: webinar.id },
      {
        onSuccess: (data) => {
          window.location.href = data.checkoutUrl;
        },
      }
    );
  };

  return (
    <article className="glass-card rounded-2xl p-5 border border-border/50 space-y-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Video className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-tight">{webinar.title}</h3>
          {webinar.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {webinar.description}
            </p>
          )}
        </div>
        <span className="text-lg font-bold tabular-nums shrink-0">
          {fmtPrice(webinar.ticketPriceCents, webinar.currency)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {fmtDate}
        </span>
        <span className="inline-flex items-center gap-1">
          <Video className="w-3.5 h-3.5" aria-hidden="true" />
          {webinar.durationMinutes} {t('mentor.sessions.min', 'min')}
        </span>
        {webinar.maxAttendees && (
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            {t('mentor.webinars.seats', '{{n}} seats', { n: webinar.maxAttendees })}
          </span>
        )}
      </div>

      {isUpcoming && (
        <Button
          className="w-full gap-2"
          onClick={handleBuy}
          disabled={buyTicket.isPending}
        >
          {buyTicket.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : !isAuthenticated ? (
            <LogIn className="w-4 h-4" />
          ) : (
            <Ticket className="w-4 h-4" />
          )}
          {!isAuthenticated
            ? t('mentor.webinars.loginToBook', 'Log in to buy ticket')
            : webinar.ticketPriceCents === 0
            ? t('mentor.webinars.registerFree', 'Register free')
            : t('mentor.webinars.buyTicket', 'Buy ticket')}
        </Button>
      )}

      {!isUpcoming && (
        <p className="text-xs text-muted-foreground text-center">
          {t('mentor.webinars.ended', 'This webinar has ended.')}
        </p>
      )}
    </article>
  );
};

export default WebinarCard;
