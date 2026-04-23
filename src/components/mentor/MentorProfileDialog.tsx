import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Star,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicMentorProfile, useDirectoryTags } from '@/hooks/useMentor';
import { useAuth } from '@/contexts/auth-context';
import RiskDisclosureBanner from '@/components/mentor/legal/RiskDisclosureBanner';
import DisclaimerModal from '@/components/mentor/legal/DisclaimerModal';
import type { MentorPublicProfileDto, MentorTestimonialPublicDto } from '@/types/dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const formatPrice = (pricing: MentorPublicProfileDto['pricing']): string | null => {
  if (!pricing) return null;
  const sym = currencySymbol[pricing.currency] ?? '';
  return `${sym}${pricing.monthlyAmount.toFixed(2)} ${pricing.currency}`;
};

// ── Shared small atoms ────────────────────────────────────────────────────────

const StarRow: React.FC<{ rating: number }> = ({ rating }) => {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${r} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={[
            'w-3.5 h-3.5',
            i < r ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
          ].join(' ')}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const TestimonialCard: React.FC<{ item: MentorTestimonialPublicDto; idx: number }> = ({
  item,
  idx,
}) => (
  <article
    key={`${item.username}-${idx}`}
    className="glass-card rounded-2xl p-4 border border-border/50 space-y-2"
  >
    <StarRow rating={item.rating} />
    <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.body}</p>
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="font-medium">{item.username}</span>
      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
    </div>
  </article>
);

const StatItem: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  hint?: string;
}> = ({ label, value, icon, hint }) => (
  <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
      {icon}
    </div>
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="text-lg font-bold tracking-tight tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

// ── Loading skeleton ──────────────────────────────────────────────────────────

const DialogLoadingSkeleton: React.FC = () => (
  <div className="space-y-5 p-1" aria-busy="true">
    <div className="flex items-start gap-4">
      <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
    <Skeleton className="h-24 w-full rounded-xl" />
  </div>
);

// ── Not found ─────────────────────────────────────────────────────────────────

const DialogNotFound: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-2xl font-bold">404</p>
      <p className="text-muted-foreground text-sm">
        {t('mentor.publicPage.notFound', 'Mentor not found')}
      </p>
      <Button variant="outline" onClick={onClose}>
        {t('mentor.profileDialog.close', 'Close')}
      </Button>
    </div>
  );
};

// ── Profile content ───────────────────────────────────────────────────────────

interface ProfileContentProps {
  profile: MentorPublicProfileDto;
  onClose: () => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ profile, onClose }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  const { data: tags = [] } = useDirectoryTags();

  const accent = profile.primaryColor || undefined;
  const priceLabel = formatPrice(profile.pricing);

  const getTagLabel = (slug: string): string => {
    const tag = tags.find((tg) => tg.slug === slug);
    if (!tag) return slug;
    const lang = i18n.language.split('-')[0];
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const getLanguageName = (code: string): string => {
    try {
      const lang = i18n.language.split('-')[0];
      const displayNames = new Intl.DisplayNames([lang, 'en'], { type: 'language' });
      return displayNames.of(code) ?? code;
    } catch {
      return code;
    }
  };

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      navigate(`/auth/signup?returnTo=/m/${profile.slug}`);
      onClose();
      return;
    }
    setDisclaimerOpen(true);
  };

  return (
    <>
      <div className="space-y-5">
        <RiskDisclosureBanner isCfdContext={profile.isCfdContext} className="mb-1" />

        {/* Hero */}
        <header
          className="glass-card rounded-2xl p-5 border border-border/50 relative overflow-hidden"
          style={accent ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
        >
          <div className="flex items-start gap-4">
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover border border-border/50 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-semibold text-2xl shrink-0"
                style={{ backgroundColor: profile.primaryColor || 'hsl(var(--primary))' }}
                aria-hidden="true"
              >
                {(profile.brandName ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold tracking-tight">{profile.brandName}</h2>
              {profile.headline && (
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  {profile.headline}
                </p>
              )}
              <div className="mt-2">
                {profile.acceptsNewStudents ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('mentor.publicPage.acceptingNew', 'Accepting new students')}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-full">
                    {t('mentor.publicPage.closed', 'Waitlist')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Tag chips */}
        {profile.tagSlugs.length > 0 && (
          <section aria-labelledby="dialog-taxonomy-heading">
            <h3
              id="dialog-taxonomy-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2"
            >
              {t('mentor.myMentor.taxonomyTitle', 'Niche')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.tagSlugs.map((slug) => (
                <span
                  key={slug}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground border border-border/40"
                >
                  {getTagLabel(slug)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Language chips */}
        {profile.languageCodes.length > 0 && (
          <section aria-labelledby="dialog-languages-heading">
            <h3
              id="dialog-languages-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2"
            >
              {t('mentor.myMentor.languagesTitle', 'Languages')}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.languageCodes.map((code) => (
                <span
                  key={code}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20"
                >
                  {getLanguageName(code)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {(profile.bio || profile.credentials || profile.yearsTrading != null) && (
          <section aria-labelledby="dialog-about-heading" className="glass-card rounded-2xl p-5 space-y-3">
            <h3 id="dialog-about-heading" className="text-base font-semibold">
              {t('mentor.publicPage.aboutTitle', 'About')}
            </h3>
            {profile.bio && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.credentials && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  {t('mentor.publicPage.credentialsTitle', 'Credentials')}
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {profile.credentials}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Stats */}
        <section aria-labelledby="dialog-stats-heading">
          <h3 id="dialog-stats-heading" className="sr-only">
            {t('mentor.publicPage.statsTitle', 'Stats')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatItem
              label={t('mentor.publicPage.studentsLabel', 'Students')}
              value={profile.studentsCount}
              icon={<Users className="w-4 h-4" aria-hidden="true" />}
              hint={t('mentor.publicPage.ofMax', 'of {{max}} max', { max: profile.maxStudents })}
            />
            {profile.yearsTrading != null && (
              <StatItem
                label={t('mentor.publicPage.experienceLabel', 'Experience')}
                value={t('mentor.publicPage.yearsValue', '{{n}} yrs', { n: profile.yearsTrading })}
                icon={<CalendarClock className="w-4 h-4" aria-hidden="true" />}
              />
            )}
            {priceLabel && (
              <StatItem
                label={t('mentor.publicPage.priceLabel', 'Monthly price')}
                value={priceLabel}
                icon={<Star className="w-4 h-4" aria-hidden="true" />}
                hint={t('mentor.publicPage.cancelAnytime', 'Cancel anytime')}
              />
            )}
          </div>
        </section>

        {/* Subscribe CTA */}
        {profile.pricing != null && profile.acceptsNewStudents && priceLabel && (
          <div
            className="glass-card rounded-2xl p-5 border border-border/50 space-y-4 relative overflow-hidden"
            style={accent ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-base font-semibold">
                  {t('mentor.legal.profile.subscribeCta.title', 'Subscribe to {{brand}}', {
                    brand: profile.brandName,
                  })}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {priceLabel}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {t('mentor.monetization.month', 'month')}
                  </span>
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <Button className="w-full" onClick={handleSubscribeClick}>
              {t('mentor.legal.profile.subscribeCta.title', 'Subscribe to {{brand}}', {
                brand: profile.brandName,
              })}
            </Button>
          </div>
        )}

        {/* Testimonials */}
        {profile.testimonials.length > 0 && (
          <section aria-labelledby="dialog-testimonials-heading" className="space-y-3">
            <h3 id="dialog-testimonials-heading" className="text-base font-semibold">
              {t('mentor.publicPage.testimonialsTitle', 'What students are saying')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.testimonials.map((item, idx) => (
                <TestimonialCard key={`${item.username}-${idx}`} item={item} idx={idx} />
              ))}
            </div>
          </section>
        )}

        {/* Footer: open full page */}
        <footer className="flex justify-center pt-2 pb-1">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link to={`/m/${profile.slug}`} onClick={onClose}>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              {t('mentor.profileDialog.openFull', 'Open full page')}
            </Link>
          </Button>
        </footer>
      </div>

      {profile.pricing && (
        <DisclaimerModal
          open={disclaimerOpen}
          onOpenChange={setDisclaimerOpen}
          slug={profile.slug}
          brandName={profile.brandName}
        />
      )}
    </>
  );
};

// ── Public API ────────────────────────────────────────────────────────────────

interface MentorProfileDialogProps {
  slug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MentorProfileDialog: React.FC<MentorProfileDialogProps> = ({
  slug,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = usePublicMentorProfile(slug ?? undefined);

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] overflow-y-auto"
        aria-labelledby="mentor-profile-dialog-title"
        aria-describedby="mentor-profile-dialog-desc"
      >
        <DialogHeader className="sr-only">
          <DialogTitle id="mentor-profile-dialog-title">
            {t('mentor.profileDialog.title', 'Mentor profile')}
          </DialogTitle>
          <DialogDescription id="mentor-profile-dialog-desc">
            {profile?.brandName ?? ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <DialogLoadingSkeleton />}
        {!isLoading && !profile && <DialogNotFound onClose={handleClose} />}
        {!isLoading && profile && (
          <ProfileContent profile={profile} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MentorProfileDialog;
