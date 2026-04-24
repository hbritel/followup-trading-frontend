import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  LogIn,
  Star,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicMentorProfile, useJoinInstance, useDirectoryTags } from '@/hooks/useMentor';
import { usePublicSessionOfferings, useBookSession, usePublicWebinars } from '@/hooks/useMentorRevenue';
import { useAuth } from '@/contexts/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import RiskDisclosureBanner from '@/components/mentor/legal/RiskDisclosureBanner';
import DisclaimerModal from '@/components/mentor/legal/DisclaimerModal';
import VerifiedBadge from '@/components/mentor/trust/VerifiedBadge';
import VerifiedStatsPanel from '@/components/mentor/trust/VerifiedStatsPanel';
import CancellationPolicyChip from '@/components/mentor/trust/CancellationPolicyChip';
import PublicFaqSection from '@/components/mentor/faq/PublicFaqSection';
import MentorContactForm from '@/components/mentor/contact/MentorContactForm';
import ReportProfileButton from '@/components/mentor/complaint/ReportProfileButton';
import SessionBookingCalendar from '@/components/mentor/sessions/SessionBookingCalendar';
import WebinarCard from '@/components/mentor/webinars/WebinarCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Video } from 'lucide-react';
import type { MentorPublicProfileDto, SessionOfferingDto } from '@/types/dto';

const currencySymbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

const StarRow: React.FC<{ rating: number }> = ({ rating }) => {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`${r} of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={[
            'w-4 h-4',
            i < r
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30',
          ].join(' ')}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen">
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  </div>
);

const NotFoundState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-5xl font-bold mb-3">404</h1>
        <p className="text-muted-foreground text-lg">
          {t('mentor.publicPage.notFound', 'Mentor not found')}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          {t(
            'mentor.publicPage.notFoundDesc',
            "This profile doesn't exist or isn't published."
          )}
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/" className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          {t('mentor.publicPage.backHome', 'Back to home')}
        </Link>
      </Button>
    </div>
  );
};

const JoinByCodeCard: React.FC<{ brandName: string }> = ({ brandName }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const joinMutation = useJoinInstance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    joinMutation.mutate(trimmed, {
      onSuccess: () => navigate('/my-mentor'),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4 text-center">
        <h3 className="text-lg font-semibold">
          {t('mentor.publicPage.joinTitle', 'Join {{brand}}', {
            brand: brandName,
          })}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {t(
            'mentor.publicPage.signupToJoin',
            'Create a free account to join with your invite code.'
          )}
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Button asChild>
            <Link to="/auth/signup" className="gap-1.5">
              <LogIn className="w-4 h-4" />
              {t('mentor.publicPage.createAccount', 'Create account')}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth/login">
              {t('mentor.publicPage.login', 'Log in')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {t('mentor.publicPage.joinTitle', 'Join {{brand}}', {
            brand: brandName,
          })}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t(
            'mentor.publicPage.joinHelper',
            'Ask {{brand}} for an invite code to join.',
            { brand: brandName }
          )}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Label htmlFor="public-invite-code">
          {t('mentor.publicPage.inviteCodeLabel', 'Invite code')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="public-invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXX-XXXX"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!code.trim() || joinMutation.isPending}
          >
            {joinMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('mentor.publicPage.joinButton', 'Join')}
          </Button>
        </div>
      </form>
    </div>
  );
};

const ProfileHero: React.FC<{ profile: MentorPublicProfileDto }> = ({
  profile,
}) => {
  const { t } = useTranslation();
  const accent = profile.primaryColor || undefined;

  return (
    <header
      className="glass-card rounded-3xl p-6 sm:p-8 border border-border/50 relative overflow-hidden"
      style={accent ? { boxShadow: `inset 4px 0 0 0 ${accent}` } : undefined}
    >
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt=""
            className="h-20 w-20 rounded-2xl object-cover border border-border/50 shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-semibold text-3xl shrink-0"
            style={{
              backgroundColor: profile.primaryColor || 'hsl(var(--primary))',
            }}
            aria-hidden="true"
          >
            {(profile.brandName ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {profile.brandName}
            </h1>
            {profile.verified && <VerifiedBadge />}
          </div>
          {profile.headline && (
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              {profile.headline}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {profile.acceptsNewStudents ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {t('mentor.publicPage.acceptingNew', 'Accepting new students')}
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-full">
                {t('mentor.publicPage.closed', 'Waitlist')}
              </span>
            )}
            {profile.cancellationPolicy && (
              <CancellationPolicyChip policy={profile.cancellationPolicy} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  hint?: string;
}> = ({ label, value, icon, hint }) => (
  <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
      {icon}
    </div>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="text-xl font-bold tracking-tight tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const SubscribeCtaCard: React.FC<{
  profile: MentorPublicProfileDto;
  priceLabel: string;
  onSubscribe: () => void;
}> = ({ profile, priceLabel, onSubscribe }) => {
  const { t } = useTranslation();
  const accent = profile.primaryColor || undefined;

  return (
    <div
      className="glass-card rounded-2xl p-6 border border-border/50 space-y-4 relative overflow-hidden"
      style={accent ? { boxShadow: `inset 4px 0 0 0 ${accent}` } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            {t(
              'mentor.legal.profile.subscribeCta.title',
              'Subscribe to {{brand}}',
              { brand: profile.brandName }
            )}
          </h3>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {priceLabel}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / {t('mentor.monetization.month', 'month')}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              'mentor.legal.profile.subscribeCta.cancelAnytime',
              'Cancel anytime. No commitment.'
            )}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
      <Button className="w-full" size="lg" onClick={onSubscribe}>
        {t(
          'mentor.legal.profile.subscribeCta.title',
          'Subscribe to {{brand}}',
          { brand: profile.brandName }
        )}
      </Button>
    </div>
  );
};

const PublicMentorProfileContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: profile, isLoading } = usePublicMentorProfile(slug);
  const { data: allTags = [] } = useDirectoryTags();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [bookingOffering, setBookingOffering] = useState<SessionOfferingDto | undefined>(undefined);

  const { data: offerings = [] } = usePublicSessionOfferings(slug ?? '');
  const { data: webinars = [] } = usePublicWebinars(slug ?? '');
  const bookSession = useBookSession();

  const handleBookSession = (scheduledAt: string) => {
    if (!bookingOffering || !slug) return;
    bookSession.mutate(
      { slug, offeringId: bookingOffering.id, scheduledAt },
      {
        onSuccess: (data) => {
          setBookingOffering(undefined);
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            navigate('/my-mentor');
          }
        },
      }
    );
  };

  const tagLabel = (tagSlug: string): string => {
    const tag = allTags.find((tg) => tg.slug === tagSlug);
    if (!tag) return tagSlug;
    const lang = i18n.language.split('-')[0];
    if (lang === 'fr' && tag.labelFr) return tag.labelFr;
    if (lang === 'es' && tag.labelEs) return tag.labelEs;
    return tag.labelEn;
  };

  const languageName = (code: string): string => {
    try {
      const lang = i18n.language.split('-')[0];
      const dn = new Intl.DisplayNames([lang, 'en'], { type: 'language' });
      return dn.of(code) ?? code;
    } catch {
      return code;
    }
  };

  // SEO — react-helmet not available; use document.title + meta tags directly
  useEffect(() => {
    if (!profile) return;
    const title = `${profile.brandName}${
      profile.headline ? ' — ' + profile.headline : ''
    }`;
    const prevTitle = document.title;
    document.title = title;

    const descValue =
      profile.bio?.slice(0, 160) ??
      profile.headline ??
      `Trading mentor: ${profile.brandName}`;

    const ensureMeta = (selector: string, build: () => HTMLMetaElement) => {
      let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!tag) {
        tag = build();
        document.head.appendChild(tag);
      }
      return tag;
    };

    const descTag = ensureMeta('meta[name="description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      return m;
    });
    const prevDesc = descTag.getAttribute('content');
    descTag.setAttribute('content', descValue);

    const ogTitle = ensureMeta('meta[property="og:title"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:title');
      return m;
    });
    const prevOgTitle = ogTitle.getAttribute('content');
    ogTitle.setAttribute('content', title);

    const ogDesc = ensureMeta('meta[property="og:description"]', () => {
      const m = document.createElement('meta');
      m.setAttribute('property', 'og:description');
      return m;
    });
    const prevOgDesc = ogDesc.getAttribute('content');
    ogDesc.setAttribute('content', descValue);

    // JSON-LD structured data (Google Rich Results–compatible)
    const canonicalUrl = window.location.href;

    const personSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.brandName,
      url: canonicalUrl,
      ...(profile.bio ? { description: profile.bio } : {}),
      ...(profile.logoUrl ? { image: profile.logoUrl } : {}),
      ...(profile.headline ? { knowsAbout: profile.headline } : {}),
    };

    if (profile.pricing) {
      const service: Record<string, unknown> = {
        '@type': 'Service',
        serviceType: 'Trading Education',
        url: canonicalUrl,
        provider: {
          '@type': 'Person',
          name: profile.brandName,
          ...(profile.logoUrl ? { image: profile.logoUrl } : {}),
        },
        offers: {
          '@type': 'Offer',
          price: profile.pricing.monthlyAmount.toFixed(2),
          priceCurrency: profile.pricing.currency,
          url: canonicalUrl,
        },
      };
      personSchema['offers'] = (service['offers'] as Record<string, unknown>);
      personSchema['hasOfferCatalog'] = service;
    }

    const testimonials = profile.testimonials ?? [];
    if (testimonials.length >= 3) {
      const totalRating = testimonials.reduce(
        (sum, t) => sum + t.rating,
        0
      );
      personSchema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: (totalRating / testimonials.length).toFixed(1),
        reviewCount: testimonials.length,
        bestRating: 5,
        worstRating: 1,
      };
    }

    const ldScript = document.createElement('script');
    ldScript.setAttribute('type', 'application/ld+json');
    ldScript.setAttribute('data-mentor-ld', profile.slug);
    ldScript.textContent = JSON.stringify(personSchema);
    document.head.appendChild(ldScript);

    // hreflang alternate links — one per supported locale
    const HREFLANG_LOCALES = ['en', 'fr', 'es'] as const;
    const hreflangLinks: HTMLLinkElement[] = HREFLANG_LOCALES.map((lng) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lng);
      link.setAttribute('href', `${canonicalUrl}?lng=${lng}`);
      link.setAttribute('data-mentor-hreflang', `${profile.slug}-${lng}`);
      document.head.appendChild(link);
      return link;
    });

    return () => {
      document.title = prevTitle;
      if (prevDesc != null) descTag.setAttribute('content', prevDesc);
      if (prevOgTitle != null) ogTitle.setAttribute('content', prevOgTitle);
      if (prevOgDesc != null) ogDesc.setAttribute('content', prevOgDesc);
      const injected = document.head.querySelector(
        `script[data-mentor-ld="${profile.slug}"]`
      );
      if (injected) document.head.removeChild(injected);
      hreflangLinks.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, [profile]);

  if (isLoading) return <LoadingSkeleton />;
  if (!profile) return <NotFoundState />;

  const priceLabel = profile.pricing
    ? `${currencySymbol[profile.pricing.currency] ?? ''}${profile.pricing.monthlyAmount.toFixed(
        2
      )} ${profile.pricing.currency}`
    : null;

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      navigate(`/auth/signup?returnTo=/m/${profile.slug}`);
      return;
    }
    setDisclaimerOpen(true);
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <nav aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated && window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isAuthenticated
              ? t('mentor.publicPage.back', 'Back')
              : t('mentor.publicPage.backHome', 'Back to home')}
          </button>
        </nav>

        <RiskDisclosureBanner isCfdContext={profile.isCfdContext} />

        <ProfileHero profile={profile} />

        {/* Tags + Languages */}
        {((profile.tagSlugs?.length ?? 0) > 0 || (profile.languageCodes?.length ?? 0) > 0) && (
          <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
            {(profile.tagSlugs?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {t('mentor.myMentor.taxonomyTitle', 'Niche')}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.tagSlugs ?? []).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground border border-border/40"
                    >
                      {tagLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(profile.languageCodes?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {t('mentor.myMentor.languagesTitle', 'Languages')}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.languageCodes ?? []).map((c) => (
                    <span
                      key={c}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20"
                    >
                      {languageName(c)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* About */}
        {(profile.bio || profile.credentials || profile.yearsTrading != null) && (
          <section
            aria-labelledby="about-heading"
            className="glass-card rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <h2 id="about-heading" className="text-lg font-semibold">
              {t('mentor.publicPage.aboutTitle', 'About')}
            </h2>
            {profile.bio && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
            {profile.credentials && (
              <div>
                <h3 className="text-sm font-medium mb-1.5">
                  {t(
                    'mentor.publicPage.credentialsTitle',
                    'Credentials'
                  )}
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {profile.credentials}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Stats */}
        <section
          aria-labelledby="stats-heading"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <h2 id="stats-heading" className="sr-only">
            {t('mentor.publicPage.statsTitle', 'Stats')}
          </h2>
          <StatCard
            label={t('mentor.publicPage.studentsLabel', 'Students')}
            value={profile.studentsCount}
            icon={<Users className="w-4 h-4" aria-hidden="true" />}
            hint={t(
              'mentor.publicPage.ofMax',
              'of {{max}} max',
              { max: profile.maxStudents }
            )}
          />
          {profile.yearsTrading != null && (
            <StatCard
              label={t('mentor.publicPage.experienceLabel', 'Experience')}
              value={t('mentor.publicPage.yearsValue', '{{n}} yrs', {
                n: profile.yearsTrading,
              })}
              icon={<CalendarClock className="w-4 h-4" aria-hidden="true" />}
            />
          )}
          {priceLabel && (
            <StatCard
              label={t('mentor.publicPage.priceLabel', 'Monthly price')}
              value={priceLabel}
              icon={<Star className="w-4 h-4" aria-hidden="true" />}
              hint={t('mentor.publicPage.cancelAnytime', 'Cancel anytime')}
            />
          )}
        </section>

        {/* Verified trading stats */}
        {profile.showStatsPublicly && profile.stats && (
          <VerifiedStatsPanel stats={profile.stats} />
        )}

        {/* Testimonials */}
        {(profile.testimonials?.length ?? 0) > 0 && (
          <section
            aria-labelledby="testimonials-heading"
            className="space-y-4"
          >
            <h2
              id="testimonials-heading"
              className="text-lg font-semibold"
            >
              {t(
                'mentor.publicPage.testimonialsTitle',
                'What students are saying'
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(profile.testimonials ?? []).map((item, idx) => (
                <article
                  key={`${item.username}-${idx}`}
                  className="glass-card rounded-2xl p-5 border border-border/50 space-y-3"
                >
                  <StarRow rating={item.rating} />
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {item.body}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{item.username}</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Phase 4: 1-on-1 Sessions */}
        {offerings.length > 0 && (
          <section aria-labelledby="sessions-public-heading" className="space-y-4">
            <h2
              id="sessions-public-heading"
              className="text-lg font-semibold flex items-center gap-2"
            >
              <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
              {t('mentor.sessions.sectionTitle', '1-on-1 Sessions')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offerings.filter((o) => o.active).map((offering) => (
                <div
                  key={offering.id}
                  className="glass-card rounded-2xl p-5 border border-border/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-sm leading-snug">{offering.title}</h3>
                    <span className="text-sm font-semibold shrink-0">
                      {offering.priceCents === 0
                        ? t('mentor.webinars.free', 'Free')
                        : `${(currencySymbol[offering.currency] ?? offering.currency)}${(offering.priceCents / 100).toFixed(2)}`}
                    </span>
                  </div>
                  {offering.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {offering.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {offering.durationMinutes}{t('mentor.sessions.min', ' min')}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setBookingOffering(offering)}
                  >
                    {t('mentor.sessions.bookButton', 'Book session')}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Phase 4: Webinars */}
        {webinars.length > 0 && (
          <section aria-labelledby="webinars-public-heading" className="space-y-4">
            <h2
              id="webinars-public-heading"
              className="text-lg font-semibold flex items-center gap-2"
            >
              <Video className="w-5 h-5 text-primary" aria-hidden="true" />
              {t('mentor.webinars.title', 'Webinars')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {webinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} slug={profile.slug} />
              ))}
            </div>
          </section>
        )}

        {/* Phase 4: Session booking dialog */}
        <Dialog
          open={bookingOffering !== undefined}
          onOpenChange={(open) => { if (!open) setBookingOffering(undefined); }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {t('mentor.sessions.calendar.title', 'Pick a time')}
                {bookingOffering && ` — ${bookingOffering.title}`}
              </DialogTitle>
            </DialogHeader>
            {bookingOffering && (
              <SessionBookingCalendar
                offering={bookingOffering}
                onConfirm={handleBookSession}
                isPending={bookSession.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* FAQ */}
        {(profile.faq?.length ?? 0) > 0 && (
          <PublicFaqSection faq={profile.faq ?? []} />
        )}

        {/* Subscribe CTA + Join by code */}
        {profile.acceptsNewStudents && (
          <div className="space-y-4">
            {profile.pricing && priceLabel && (
              <SubscribeCtaCard
                profile={profile}
                priceLabel={priceLabel}
                onSubscribe={handleSubscribeClick}
              />
            )}
            <JoinByCodeCard brandName={profile.brandName} />
          </div>
        )}

        {/* Contact form */}
        {profile.hasContactForm && (
          <MentorContactForm slug={profile.slug} brandName={profile.brandName} />
        )}

        <footer className="flex items-center justify-between text-xs text-muted-foreground pt-6 pb-4">
          <span>
            {t(
              'mentor.publicPage.poweredBy',
              'Powered by FollowUp Trading'
            )}
          </span>
          <ReportProfileButton slug={profile.slug} brandName={profile.brandName} />
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
    </main>
  );
};

const PublicMentorProfile: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const { data: profile } = usePublicMentorProfile(slug);
  const { t } = useTranslation();

  if (isAuthenticated) {
    const pageTitle = profile?.brandName
      ?? t('mentor.publicPage.pageTitle', 'Mentor profile');
    return (
      <WebSocketProvider>
        <DashboardLayout pageTitle={pageTitle}>
          <PublicMentorProfileContent />
        </DashboardLayout>
      </WebSocketProvider>
    );
  }
  return <PublicMentorProfileContent />;
};

export default PublicMentorProfile;
