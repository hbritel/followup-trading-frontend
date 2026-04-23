import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DirectoryCardDto, MentorTagDto } from '@/types/dto';

interface MentorCardProps {
  card: DirectoryCardDto;
  tags: MentorTagDto[];
}

const StarRow: React.FC<{ rating: number; count: number }> = ({ rating, count }) => {
  const { t } = useTranslation();
  if (count < 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
        {t('mentor.directory.card.new')}
      </span>
    );
  }
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="inline-flex items-center gap-1" aria-label={`${rating.toFixed(1)} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < r ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25'
          )}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs tabular-nums text-muted-foreground ml-0.5">
        ({count})
      </span>
    </div>
  );
};

const studentBucket = (count: number, t: ReturnType<typeof useTranslation>['t']): string => {
  if (count <= 10) return t('mentor.directory.card.studentsFew');
  if (count <= 50) return t('mentor.directory.card.studentsMedium');
  return t('mentor.directory.card.studentsMany');
};

const MentorCard: React.FC<MentorCardProps> = ({ card, tags }) => {
  const { t, i18n } = useTranslation();
  const accent = card.primaryColor ?? undefined;

  const getTagLabel = (slug: string): string => {
    const tag = tags.find((tg) => tg.slug === slug);
    if (!tag) return slug;
    const lang = i18n.language.split('-')[0];
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const priceLabel = card.monetized && card.defaultMonthlyPriceCents != null
    ? (() => {
        const amount = (card.defaultMonthlyPriceCents / 100).toFixed(2);
        const symbol = card.defaultCurrency === 'EUR' ? '€' : card.defaultCurrency === 'GBP' ? '£' : '$';
        return t('mentor.directory.card.monthlyPrice', { price: `${symbol}${amount}` });
      })()
    : t('mentor.directory.card.free');

  const visibleTags = card.tagSlugs.slice(0, 3);

  return (
    <Link
      to={`/m/${card.slug}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-2xl"
      aria-label={card.brandName}
    >
      <article
        className={cn(
          'glass-card rounded-2xl border border-border/50 p-5 h-full flex flex-col gap-4',
          'transition-all duration-200',
          'group-hover:shadow-lg group-hover:shadow-black/8 group-hover:-translate-y-0.5',
          'group-focus-visible:border-primary/40',
          'relative overflow-hidden'
        )}
        style={accent ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
      >
        {/* Header: logo + name + accepting chip */}
        <div className="flex items-start gap-3">
          {card.logoUrl ? (
            <img
              src={card.logoUrl}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover border border-border/50 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: accent ?? 'hsl(var(--primary))' }}
              aria-hidden="true"
            >
              {card.brandName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-tight truncate">
              {card.brandName}
            </h3>
            {card.publicHeadline && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-snug">
                {card.publicHeadline}
              </p>
            )}
          </div>

          {card.acceptsNewStudents && (
            <span
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full"
              title={t('mentor.directory.card.acceptsNew')}
            >
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
              {t('mentor.directory.card.acceptsNew')}
            </span>
          )}
        </div>

        {/* Tag chips */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Tags">
            {visibleTags.map((slug) => (
              <span
                key={slug}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground border border-border/40"
              >
                {getTagLabel(slug)}
              </span>
            ))}
            {card.tagSlugs.length > 3 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/60 border border-border/30">
                +{card.tagSlugs.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: rating + students + price */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-border/30">
          <div className="flex flex-col gap-1">
            <StarRow rating={card.avgRating} count={card.testimonialCount} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{studentBucket(card.studentCount, t)}</span>
            </div>
          </div>

          <span
            className={cn(
              'text-sm font-semibold tabular-nums shrink-0',
              card.monetized ? 'text-foreground' : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {priceLabel}
          </span>
        </div>
      </article>
    </Link>
  );
};

export default MentorCard;
