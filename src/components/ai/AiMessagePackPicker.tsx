import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  aiMessagePackService,
  type AiMessagePackDto,
} from '@/services/aiMessagePack.service';
import { getApiErrorMessage } from '@/services/apiClient';

interface AiMessagePackPickerProps {
  /** Optional explanatory text above the cards. */
  heading?: string;
  /** Optional secondary line. */
  subheading?: string;
  /** Compact layout hides the heading block; use when embedded in the chat. */
  compact?: boolean;
  className?: string;
}

/**
 * Catalog picker for AI coach message packs.
 *
 * <p>Fetches the active catalog from {@code GET /coach/packs} and renders
 * one card per tier. "Buy" initiates a Stripe Checkout redirect — the bonus
 * pool is credited asynchronously by the webhook once payment clears.</p>
 */
const AiMessagePackPicker: React.FC<AiMessagePackPickerProps> = ({
  heading,
  subheading,
  compact = false,
  className,
}) => {
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const { data: packs, isLoading, error } = useQuery<AiMessagePackDto[]>({
    queryKey: ['ai-message-packs'],
    queryFn: async () => {
      const res = await aiMessagePackService.list();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleBuy = async (slug: string) => {
    setPendingSlug(slug);
    try {
      const { data } = await aiMessagePackService.checkout(slug);
      // Hard redirect to Stripe Checkout. The frontend picks up on the
      // success URL (/settings/billing?pack_purchase=success) once the
      // webhook has already credited the pool server-side.
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setPendingSlug(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 p-4 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading packs…
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive', className)}>
        Could not load message packs. Please retry later.
      </div>
    );
  }

  if (!packs || packs.length === 0) {
    return null;
  }

  // Heuristic: best value is the highest messages-per-dollar tier.
  const bestValueSlug = packs.slice().sort((a, b) => {
    const ratioA = a.messageCount / Math.max(a.priceCents, 1);
    const ratioB = b.messageCount / Math.max(b.priceCents, 1);
    return ratioB - ratioA;
  })[0]?.slug;

  return (
    <section className={cn('space-y-3', className)} aria-labelledby="pack-picker-heading">
      {!compact && (
        <header className="space-y-1">
          <h3 id="pack-picker-heading" className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {heading ?? 'Top up your coach messages'}
          </h3>
          {subheading && (
            <p className="text-sm text-muted-foreground">{subheading}</p>
          )}
        </header>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {packs.map((pack) => {
          const isBestValue = pack.slug === bestValueSlug && packs.length > 1;
          const isBusy = pendingSlug === pack.slug;
          return (
            <Card
              key={pack.id}
              className={cn(
                'relative flex flex-col transition-all',
                isBestValue && 'border-amber-400/60 shadow-md shadow-amber-500/10',
              )}
            >
              {isBestValue && (
                <div className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  <Zap className="h-3 w-3" /> Best value
                </div>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  {pack.name}
                </CardTitle>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-2xl font-bold tabular-nums">
                    {formatPrice(pack.priceCents, pack.currency)}
                  </span>
                </div>
                <p className="pt-0.5 text-xs text-muted-foreground">
                  {pack.messageCount} messages{' '}
                  <span className="opacity-70">
                    · {formatPerMessage(pack.priceCents, pack.messageCount, pack.currency)}
                  </span>
                </p>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                {pack.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {pack.description}
                  </p>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  onClick={() => handleBuy(pack.slug)}
                  disabled={isBusy || pendingSlug !== null}
                  className="w-full"
                  variant={isBestValue ? 'default' : 'outline'}
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    'Buy'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

function formatPrice(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function formatPerMessage(cents: number, count: number, currency: string): string {
  if (!count) return '';
  const perCents = cents / count;
  try {
    return `${new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(perCents / 100)}/msg`;
  } catch {
    return `$${(perCents / 100).toFixed(2)}/msg`;
  }
}

export default AiMessagePackPicker;
