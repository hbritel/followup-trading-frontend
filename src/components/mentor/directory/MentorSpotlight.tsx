import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Flame, Sparkles, Star, Users, Verified } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DirectoryCardDto } from '@/types/dto';

interface Props {
  cards: DirectoryCardDto[];
}

const ROTATION_MS = 6000;
const MAX_SPOTLIGHTS = 5;
const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const score = (c: DirectoryCardDto): number => {
  const ratingWeight = (c.avgRating || 0) * Math.log1p(c.testimonialCount);
  const momentum = c.studentCount / Math.max(1, c.maxStudents);
  const verifiedBonus = c.verified ? 2 : 0;
  return ratingWeight + momentum + verifiedBonus;
};

const MentorSpotlight: React.FC<Props> = ({ cards }) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const ranked = useMemo(() => {
    return [...cards]
      .filter((c) => c.acceptsNewStudents)
      .sort((a, b) => score(b) - score(a))
      .slice(0, MAX_SPOTLIGHTS);
  }, [cards]);

  useEffect(() => {
    if (paused || ranked.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ranked.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [paused, ranked.length]);

  useEffect(() => {
    if (index >= ranked.length) setIndex(0);
  }, [ranked.length, index]);

  if (ranked.length === 0) return null;

  const card = ranked[index];
  const accent = card.primaryColor || undefined;
  const price =
    card.defaultMonthlyPriceCents != null && card.defaultCurrency
      ? `${currencySymbol[card.defaultCurrency] ?? card.defaultCurrency}${(card.defaultMonthlyPriceCents / 100).toFixed(0)}`
      : null;
  const capacityLeft = Math.max(0, card.maxStudents - card.studentCount);
  const almostFull = capacityLeft <= 3 && capacityLeft > 0;

  return (
    <section
      aria-label={t('mentor.directory.spotlight.aria', 'Featured mentor')}
      className="relative rounded-2xl overflow-hidden border border-border/50 glass-card mb-6 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: accent
            ? `radial-gradient(ellipse at top left, ${accent}33 0%, transparent 60%)`
            : 'radial-gradient(ellipse at top left, hsl(var(--primary) / 0.2) 0%, transparent 60%)',
        }}
      />

      <div
        key={card.id}
        className="relative p-5 sm:p-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-500"
      >
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-primary mb-3">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {t('mentor.directory.spotlight.label', 'Mentor spotlight')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-5 items-center">
          {card.logoUrl ? (
            <img
              src={card.logoUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover border-2 border-border/60 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-md"
              style={{ backgroundColor: accent ?? 'hsl(var(--primary))' }}
              aria-hidden="true"
            >
              {card.brandName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {card.brandName}
              </h3>
              {card.verified && (
                <span
                  className="inline-flex items-center gap-0.5 text-primary"
                  title={t('mentor.verified.badge', 'Verified')}
                >
                  <Verified className="w-4 h-4" aria-hidden="true" />
                </span>
              )}
              {almostFull && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-full motion-safe:animate-pulse">
                  <Flame className="w-3 h-3" />
                  {t('mentor.directory.spotlight.fillingFast', 'Filling fast')}
                </span>
              )}
            </div>
            {card.publicHeadline && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {card.publicHeadline}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
              {card.avgRating > 0 && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="tabular-nums">{card.avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({card.testimonialCount})</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                {t('mentor.directory.spotlight.students', '{{n}} students', {
                  n: card.studentCount,
                })}
              </span>
              {price && (
                <span className="font-semibold tabular-nums text-foreground">
                  {price}
                  <span className="text-muted-foreground font-normal">
                    /{t('mentor.monetization.month', 'month')}
                  </span>
                </span>
              )}
            </div>
          </div>

          <Button asChild size="lg" className="shrink-0 gap-1.5 self-center">
            <Link to={`/m/${card.slug}`}>
              {t('mentor.directory.spotlight.viewProfile', 'View profile')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>

        {ranked.length > 1 && (
          <div
            className="flex items-center justify-center gap-1.5 mt-4"
            role="tablist"
            aria-label={t('mentor.directory.spotlight.rotatorAria', 'Spotlight navigation')}
          >
            {ranked.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t('mentor.directory.spotlight.goTo', 'Go to {{brand}}', {
                  brand: c.brandName,
                })}
                onClick={() => setIndex(i)}
                className={[
                  'rounded-full transition-all duration-300',
                  i === index
                    ? 'h-1.5 w-6 bg-primary'
                    : 'h-1.5 w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MentorSpotlight;
