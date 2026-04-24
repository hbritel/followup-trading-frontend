import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useInvalidateSubscription } from '@/hooks/useSubscription';

type PaymentType = 'session' | 'webinar' | 'subscription' | 'unknown';

function detectPaymentType(params: URLSearchParams): PaymentType {
  const type = params.get('type');
  if (type === 'session' || params.get('bookingId')) return 'session';
  if (type === 'webinar' || params.get('ticketId')) return 'webinar';
  return 'subscription';
}

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateSubscription();

  const paymentType = detectPaymentType(searchParams);

  useEffect(() => {
    if (paymentType === 'session') {
      queryClient.invalidateQueries({ queryKey: ['mentor', 'my-bookings'] });
    } else if (paymentType === 'webinar') {
      queryClient.invalidateQueries({ queryKey: ['mentor', 'my-tickets'] });
    } else {
      // Invalidate cached subscription so the app reflects the new plan immediately
      invalidate();
    }

    const destination =
      paymentType === 'session' || paymentType === 'webinar'
        ? '/my-mentor'
        : '/dashboard';

    const timer = setTimeout(() => {
      navigate(destination, { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icon =
    paymentType === 'session' ? (
      <CalendarCheck className="h-10 w-10 text-emerald-400" />
    ) : paymentType === 'webinar' ? (
      <Ticket className="h-10 w-10 text-emerald-400" />
    ) : (
      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
    );

  const titleKey =
    paymentType === 'session'
      ? 'mentor.sessions.paymentSuccess'
      : paymentType === 'webinar'
      ? 'mentor.webinars.paymentSuccess'
      : 'subscription.paymentSuccess';

  const descKey =
    paymentType === 'session'
      ? 'mentor.sessions.paymentSuccessDesc'
      : paymentType === 'webinar'
      ? 'mentor.webinars.paymentSuccessDesc'
      : 'subscription.paymentSuccessDesc';

  const titleFallback =
    paymentType === 'session'
      ? 'Session booked!'
      : paymentType === 'webinar'
      ? 'Ticket confirmed!'
      : undefined;

  const descFallback =
    paymentType === 'session'
      ? 'Your session has been booked. Check My Mentor for details.'
      : paymentType === 'webinar'
      ? 'Your ticket is confirmed. Check My Mentor for the meeting link.'
      : undefined;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-blob ambient-blob-primary w-96 h-96 top-20 left-1/4 opacity-50" />
        <div className="ambient-blob ambient-blob-gold w-64 h-64 bottom-20 right-1/4 opacity-30" />
      </div>

      <div className="relative z-10 glass-card rounded-2xl p-12 max-w-md w-full mx-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient-primary">
              {t(titleKey, titleFallback ?? t('subscription.paymentSuccess'))}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {t(descKey, descFallback ?? t('subscription.paymentSuccessDesc'))}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
