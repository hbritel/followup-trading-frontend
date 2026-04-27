import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  LogIn,
  MessageSquarePlus,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicMentorProfile, useJoinInstance, useDirectoryTags } from '@/hooks/useMentor';
import {
  usePublicSessionOfferings,
  useBookSession,
  usePublicWebinars,
  MentorEnrollmentRequiredError,
} from '@/hooks/useMentorRevenue';
import { toast } from 'sonner';
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
import StickySubscribePanel from '@/components/mentor/publicprofile/StickySubscribePanel';
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
  const accent = profile.primaryColor || 'hsl(var(--primary))';

  // Cinematic cover: radial accent glow + soft chromatic gradient. Layered
  // behind the content with `pointer-events-none` so it never interferes
  // with hit testing.
  return (
    <header
      className="relative overflow-hidden rounded-3xl border border-border/50 isolate motion-safe:transition-shadow motion-safe:duration-300 hover:shadow-xl"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(120% 80% at 0% 0%, ${accent}26 0%, transparent 55%), radial-gradient(80% 60% at 100% 100%, ${accent}1A 0%, transparent 50%), linear-gradient(180deg, hsl(var(--card)/0.6) 0%, hsl(var(--card)/0.95) 60%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-60 -z-10 pointer-events-none motion-safe:animate-pulse motion-reduce:hidden"
        style={{ background: `${accent}22` }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full blur-3xl opacity-40 -z-10 pointer-events-none motion-reduce:hidden"
        style={{ background: `${accent}1A` }}
      />

      <div className="relative p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
          {/* Avatar / monogram with accent ring */}
          <div className="relative shrink-0">
            <div
              aria-hidden="true"
              className="absolute inset-0 -m-1.5 rounded-3xl blur-md opacity-70"
              style={{ background: `${accent}33` }}
            />
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt=""
                width={112}
                height={112}
                className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover border-2 shadow-lg"
                style={{ borderColor: `${accent}66` }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-lg border-2"
                style={{
                  backgroundColor: accent,
                  borderColor: `${accent}AA`,
                }}
                aria-hidden="true"
              >
                {(profile.brandName ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Title + headline + status chips */}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: accent }}
              >
                {t('mentor.publicPage.eyebrow', 'Trading mentor')}
              </p>
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                  {profile.brandName}
                </h1>
                {profile.verified && (
                  <span className="mt-2 inline-flex">
                    <VerifiedBadge />
                  </span>
                )}
              </div>
              {profile.headline && (
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed pt-1">
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {profile.acceptsNewStudents ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {t('mentor.publicPage.acceptingNew', 'Accepting new students')}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted border border-border/40 px-2.5 py-1 rounded-full">
                  {t('mentor.publicPage.closed', 'Waitlist')}
                </span>
              )}
              {profile.cancellationPolicy && (
                <CancellationPolicyChip policy={profile.cancellationPolicy} />
              )}
              {profile.maxStudents > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/60 border border-border/40 px-2.5 py-1 rounded-full">
                  <Users className="w-3 h-3" aria-hidden="true" />
                  {t('mentor.publicPage.spotsRibbon', '{{n}}/{{max}}', {
                    n: profile.studentsCount,
                    max: profile.maxStudents,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

interface ByTheNumbersRibbonProps {
  profile: MentorPublicProfileDto;
  priceLabel: string | null;
  languagesCount: number;
}

const ByTheNumbersRibbon: React.FC<ByTheNumbersRibbonProps> = ({
  profile,
  priceLabel,
  languagesCount,
}) => {
  const { t } = useTranslation();
  const accent = profile.primaryColor || 'hsl(var(--primary))';

  const items: Array<{
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    sub?: string;
  }> = [
    {
      label: t('mentor.publicPage.studentsLabel', 'Students'),
      value: profile.studentsCount,
      sub:
        profile.maxStudents > 0
          ? t('mentor.publicPage.ofMax', 'of {{max}} max', {
              max: profile.maxStudents,
            })
          : undefined,
      icon: <Users className="w-4 h-4" aria-hidden="true" />,
    },
  ];
  if (profile.yearsTrading != null) {
    items.push({
      label: t('mentor.publicPage.experienceLabel', 'Experience'),
      value: t('mentor.publicPage.yearsValue', '{{n}} yrs', {
        n: profile.yearsTrading,
      }),
      icon: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
    });
  }
  if (languagesCount > 0) {
    items.push({
      label: t('mentor.publicPage.languagesLabel', 'Languages'),
      value: languagesCount,
      icon: <Globe className="w-4 h-4" aria-hidden="true" />,
    });
  }
  if (priceLabel) {
    items.push({
      label: t('mentor.publicPage.priceLabel', 'Monthly price'),
      value: priceLabel,
      sub: t('mentor.publicPage.cancelAnytime', 'Cancel anytime'),
      icon: <Sparkles className="w-4 h-4" aria-hidden="true" />,
    });
  }

  // Grid spans the actual count of items so the strip never shows an empty
  // cell — pricing-free mentors get a 3-up grid, monetised mentors get 4-up.
  const gridClass =
    items.length === 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : items.length === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : items.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1';

  return (
    <section
      aria-label={t('mentor.publicPage.statsTitle', 'Stats')}
      className={`grid ${gridClass} gap-px rounded-2xl overflow-hidden border border-border/50 bg-border/40`}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-card/95 px-4 py-4 sm:px-5 sm:py-5 flex flex-col gap-1.5 motion-safe:transition-colors motion-safe:duration-200 hover:bg-card"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span style={{ color: accent }}>{item.icon}</span>
            {item.label}
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
            {item.value}
          </div>
          {item.sub && (
            <div className="text-[11px] text-muted-foreground">{item.sub}</div>
          )}
        </div>
      ))}
    </section>
  );
};

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
        onError: (error) => {
          if (error instanceof MentorEnrollmentRequiredError) {
            setBookingOffering(undefined);
            toast.error(
              t(
                'mentor.sessions.enrollmentRequired',
                'You must be enrolled with this mentor to book a session. Subscribe or join with an invite code first.',
              ),
            );
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

  const accent = profile.primaryColor || 'hsl(var(--primary))';
  const activeOfferings = offerings.filter((o) => o.active);
  const testimonialList = profile.testimonials ?? [];
  const aggregateRating =
    testimonialList.length > 0
      ? testimonialList.reduce((sum, t) => sum + t.rating, 0) / testimonialList.length
      : null;

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
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

        <ByTheNumbersRibbon
          profile={profile}
          priceLabel={priceLabel}
          languagesCount={profile.languageCodes?.length ?? 0}
        />

        {/* Bento layout: main story column + sticky pricing rail on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-10 items-start">
          {/* ── MAIN STORY COLUMN ─────────────────────────────────────────── */}
          <div className="min-w-0 space-y-10">
            {/* About — editorial-styled bio with serif-style ornament */}
            {(profile.bio || profile.credentials) && (
              <section
                aria-labelledby="about-heading"
                className="relative glass-card rounded-3xl p-6 sm:p-8 border border-border/50 overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 w-1.5 h-full"
                  style={{ background: `linear-gradient(180deg, ${accent} 0%, ${accent}33 100%)` }}
                />
                <h2
                  id="about-heading"
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3"
                >
                  {t('mentor.publicPage.aboutTitle', 'About')}
                </h2>
                {profile.bio && (
                  <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {profile.bio}
                  </p>
                )}
                {profile.credentials && (
                  <div className="mt-5 pt-5 border-t border-border/40">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                      <ShieldCheck
                        className="w-3.5 h-3.5"
                        style={{ color: accent }}
                        aria-hidden="true"
                      />
                      {t('mentor.publicPage.credentialsTitle', 'Credentials')}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {profile.credentials}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Tags + Languages — tight chip ribbon under bio */}
            {((profile.tagSlugs?.length ?? 0) > 0 ||
              (profile.languageCodes?.length ?? 0) > 0) && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(profile.tagSlugs?.length ?? 0) > 0 && (
                  <div className="glass-card rounded-2xl p-5 border border-border/50">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
                      <Tag
                        className="w-3.5 h-3.5"
                        style={{ color: accent }}
                        aria-hidden="true"
                      />
                      {t('mentor.myMentor.taxonomyTitle', 'Niche')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.tagSlugs ?? []).map((s) => (
                        <span
                          key={s}
                          className="text-xs font-medium px-3 py-1 rounded-full bg-muted/70 text-muted-foreground border border-border/40"
                        >
                          {tagLabel(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.languageCodes?.length ?? 0) > 0 && (
                  <div
                    className="glass-card rounded-2xl p-5 border"
                    style={{ borderColor: `${accent}33` }}
                  >
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3 inline-flex items-center gap-1.5">
                      <Globe
                        className="w-3.5 h-3.5"
                        style={{ color: accent }}
                        aria-hidden="true"
                      />
                      {t('mentor.myMentor.languagesTitle', 'Languages')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.languageCodes ?? []).map((c) => (
                        <span
                          key={c}
                          className="text-xs font-medium px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: `${accent}14`,
                            color: accent,
                            border: `1px solid ${accent}33`,
                          }}
                        >
                          {languageName(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Verified trading stats — magazine "by the numbers" feel */}
            {profile.showStatsPublicly && profile.stats && (
              <VerifiedStatsPanel stats={profile.stats} />
            )}

            {/* Testimonials — pull-quote editorial cards */}
            {testimonialList.length > 0 && (
              <section
                aria-labelledby="testimonials-heading"
                className="space-y-5"
              >
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: accent }}
                    >
                      {t('mentor.publicPage.testimonialsEyebrow', 'Social proof')}
                    </p>
                    <h2
                      id="testimonials-heading"
                      className="text-2xl sm:text-3xl font-bold tracking-tight mt-1"
                    >
                      {t(
                        'mentor.publicPage.testimonialsTitle',
                        'What students are saying',
                      )}
                    </h2>
                    {aggregateRating != null && (
                      <div className="flex items-center gap-2 mt-2">
                        <StarRow rating={aggregateRating} />
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {aggregateRating.toFixed(1)} · {testimonialList.length}{' '}
                          {t(
                            'mentor.publicPage.testimonialsCount',
                            'reviews',
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-primary hover:text-primary hover:bg-primary/5"
                      onClick={() => navigate('/my-mentor#my-testimonial-heading')}
                    >
                      <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                      {t(
                        'mentor.publicPage.shareYourFeedback',
                        'Share your feedback',
                      )}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {testimonialList.map((item, idx) => (
                    <article
                      key={`${item.username}-${idx}`}
                      className="relative glass-card rounded-2xl p-6 border border-border/50 motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                      style={
                        {
                          '--tw-ring-color': accent,
                        } as React.CSSProperties
                      }
                    >
                      <Quote
                        className="absolute -top-2 -left-2 w-12 h-12 opacity-10"
                        style={{ color: accent }}
                        aria-hidden="true"
                      />
                      <div className="relative space-y-4">
                        <StarRow rating={item.rating} />
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          “{item.body}”
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                          <span className="font-semibold text-foreground">
                            {item.username}
                          </span>
                          <span className="tabular-nums">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 1-on-1 Sessions — premium cards with accent border-left */}
            {activeOfferings.length > 0 && (
              <section
                aria-labelledby="sessions-public-heading"
                className="space-y-5"
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: accent }}
                  >
                    {t('mentor.publicPage.workWithEyebrow', 'Work together')}
                  </p>
                  <h2
                    id="sessions-public-heading"
                    className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2"
                  >
                    <Clock className="w-6 h-6" style={{ color: accent }} aria-hidden="true" />
                    {t('mentor.sessions.sectionTitle', '1-on-1 Sessions')}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeOfferings.map((offering) => (
                    <div
                      key={offering.id}
                      className="relative group glass-card rounded-2xl p-5 border border-border/50 motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute top-0 left-0 w-1 h-full opacity-60 group-hover:opacity-100 motion-safe:transition-opacity"
                        style={{ background: accent }}
                      />
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-semibold text-base leading-snug pr-2">
                          {offering.title}
                        </h3>
                        <div
                          className="text-sm font-bold tabular-nums shrink-0 px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: `${accent}14`,
                            color: accent,
                          }}
                        >
                          {offering.priceCents === 0
                            ? t('mentor.webinars.free', 'Free')
                            : `${currencySymbol[offering.currency] ?? offering.currency}${(offering.priceCents / 100).toFixed(2)}`}
                        </div>
                      </div>
                      {offering.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                          {offering.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="tabular-nums">
                          {offering.durationMinutes}
                          {t('mentor.sessions.min', ' min')}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => setBookingOffering(offering)}
                      >
                        <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('mentor.sessions.bookButton', 'Book session')}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Webinars */}
            {webinars.length > 0 && (
              <section
                aria-labelledby="webinars-public-heading"
                className="space-y-5"
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: accent }}
                  >
                    {t('mentor.publicPage.liveEventsEyebrow', 'Live events')}
                  </p>
                  <h2
                    id="webinars-public-heading"
                    className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2"
                  >
                    <Video className="w-6 h-6" style={{ color: accent }} aria-hidden="true" />
                    {t('mentor.webinars.title', 'Webinars')}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {webinars.map((webinar) => (
                    <WebinarCard
                      key={webinar.id}
                      webinar={webinar}
                      slug={profile.slug}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {(profile.faq?.length ?? 0) > 0 && (
              <PublicFaqSection faq={profile.faq ?? []} />
            )}
          </div>

          {/* ── STICKY RIGHT RAIL (lg+) — pricing CTA + join code + contact ── */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {profile.acceptsNewStudents && profile.pricing && priceLabel && (
              <SubscribeCtaCard
                profile={profile}
                priceLabel={priceLabel}
                onSubscribe={handleSubscribeClick}
              />
            )}
            {profile.acceptsNewStudents && (
              <JoinByCodeCard brandName={profile.brandName} />
            )}
            {profile.hasContactForm && (
              <MentorContactForm
                slug={profile.slug}
                brandName={profile.brandName}
              />
            )}
          </aside>
        </div>

        {/* Phase 4: Session booking dialog with sticky offering summary */}
        <Dialog
          open={bookingOffering !== undefined}
          onOpenChange={(open) => { if (!open) setBookingOffering(undefined); }}
        >
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-3">
              <DialogTitle>
                {t('mentor.sessions.calendar.title', 'Pick a time')}
              </DialogTitle>
            </DialogHeader>
            {bookingOffering && (
              <>
                <div
                  className="mx-6 mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2"
                  role="region"
                  aria-label={t('mentor.sessions.summary.aria', 'Session summary')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                        {t('mentor.sessions.summary.label', 'Booking')}
                      </p>
                      <p className="font-semibold text-sm leading-snug mt-0.5">
                        {bookingOffering.title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold tabular-nums">
                        {bookingOffering.priceCents === 0
                          ? t('mentor.webinars.free', 'Free')
                          : `${currencySymbol[bookingOffering.currency] ?? bookingOffering.currency}${(bookingOffering.priceCents / 100).toFixed(2)}`}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {bookingOffering.durationMinutes}{t('mentor.sessions.min', ' min')}
                      </p>
                    </div>
                  </div>
                  {profile.cancellationPolicy && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-primary/10">
                      <ShieldCheck className="w-3 h-3 text-primary/70" aria-hidden="true" />
                      <CancellationPolicyChip policy={profile.cancellationPolicy} />
                    </div>
                  )}
                </div>
                <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
                  <SessionBookingCalendar
                    offering={bookingOffering}
                    onConfirm={handleBookSession}
                    isPending={bookSession.isPending}
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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

      {profile.acceptsNewStudents && profile.pricing && priceLabel && (
        <StickySubscribePanel
          profile={profile}
          priceLabel={priceLabel}
          onSubscribe={handleSubscribeClick}
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
