import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Eye, ExternalLink, Star, Users } from 'lucide-react';

interface Props {
  brandName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  headline: string;
  bio: string;
  credentials: string;
  yearsTrading: string;
  enabled: boolean;
  publicUrl?: string;
  className?: string;
}

const FALLBACK_HEADLINE = 'Your headline lives here.';
const FALLBACK_BIO = 'Your bio lives here. Tell visitors who you help and how.';

/**
 * PublicProfileLivePreview — miniature of the public profile rendered in
 * real-time from the editor form values. Lets the mentor see the impact of
 * each field change without leaving the page or opening a separate tab.
 */
const PublicProfileLivePreview: React.FC<Props> = ({
  brandName,
  logoUrl,
  primaryColor,
  headline,
  bio,
  credentials,
  yearsTrading,
  enabled,
  publicUrl,
  className,
}) => {
  const { t } = useTranslation();
  const accent = primaryColor || undefined;
  const initial = (brandName ?? '?').charAt(0).toUpperCase();
  const showHeadline = headline?.trim() || FALLBACK_HEADLINE;
  const showBio = bio?.trim() || FALLBACK_BIO;
  const yearsValue = yearsTrading?.trim() ? Number(yearsTrading) : null;
  const yearsValid = yearsValue !== null && Number.isFinite(yearsValue) && yearsValue >= 0;

  return (
    <aside
      aria-labelledby="profile-preview-heading"
      className={[
        'rounded-2xl border border-border/50 bg-background/40 p-4 space-y-4',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span id="profile-preview-heading">
            {t('mentor.publicProfile.previewLabel', 'Live preview')}
          </span>
        </div>
        {publicUrl && enabled && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            {t('mentor.publicProfile.openLive', 'Open live')}
          </a>
        )}
      </div>

      {!enabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
          {t(
            'mentor.publicProfile.previewDisabledHint',
            'Profile is unpublished — visitors will hit a 404.'
          )}
        </div>
      )}

      {/* Hero mini */}
      <div
        className="rounded-xl border border-border/40 p-4 space-y-3 relative overflow-hidden bg-background/60"
        style={accent ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
      >
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-12 w-12 rounded-xl object-cover border border-border/50 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-semibold text-xl shrink-0"
              style={{ backgroundColor: accent ?? 'hsl(var(--primary))' }}
              aria-hidden="true"
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight truncate">{brandName}</p>
            <p
              className={[
                'text-xs leading-snug mt-0.5 line-clamp-2',
                headline?.trim() ? 'text-muted-foreground' : 'italic text-muted-foreground/60',
              ].join(' ')}
            >
              {showHeadline}
            </p>
          </div>
        </div>
      </div>

      {/* Stats mini */}
      {yearsValid && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/40 px-3 py-2.5 bg-background/60">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('mentor.publicPage.experienceLabel', 'Experience')}
            </p>
            <p className="text-sm font-bold tabular-nums mt-0.5 inline-flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              {t('mentor.publicPage.yearsValue', '{{n}} yrs', { n: yearsValue })}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 px-3 py-2.5 bg-background/60">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('mentor.publicPage.studentsLabel', 'Students')}
            </p>
            <p className="text-sm font-bold tabular-nums mt-0.5 inline-flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              —
            </p>
          </div>
        </div>
      )}

      {/* Bio + credentials mini */}
      <div className="rounded-xl border border-border/40 p-3 bg-background/60 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('mentor.publicPage.aboutTitle', 'About')}
        </p>
        <p
          className={[
            'text-xs leading-relaxed whitespace-pre-wrap line-clamp-4',
            bio?.trim() ? '' : 'italic text-muted-foreground/60',
          ].join(' ')}
        >
          {showBio}
        </p>
        {credentials?.trim() && (
          <div className="pt-1.5 border-t border-border/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {t('mentor.publicPage.credentialsTitle', 'Credentials')}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3 whitespace-pre-wrap">
              {credentials}
            </p>
          </div>
        )}
      </div>

      {/* Star row mock */}
      <div className="flex items-center justify-center gap-1 opacity-40">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-3 h-3 text-muted-foreground/40"
            aria-hidden="true"
          />
        ))}
      </div>
    </aside>
  );
};

export default PublicProfileLivePreview;
