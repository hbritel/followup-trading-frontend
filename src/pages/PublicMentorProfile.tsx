import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Loader2,
  LogIn,
  Star,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicMentorProfile, useJoinInstance } from '@/hooks/useMentor';
import { useAuth } from '@/contexts/auth-context';
import type { MentorPublicProfileDto } from '@/types/dto';

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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {profile.brandName}
          </h1>
          {profile.headline && (
            <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
              {profile.headline}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
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

const PublicMentorProfile: React.FC = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: profile, isLoading } = usePublicMentorProfile(slug);

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

    return () => {
      document.title = prevTitle;
      if (prevDesc != null) descTag.setAttribute('content', prevDesc);
      if (prevOgTitle != null) ogTitle.setAttribute('content', prevOgTitle);
      if (prevOgDesc != null) ogDesc.setAttribute('content', prevOgDesc);
    };
  }, [profile]);

  if (isLoading) return <LoadingSkeleton />;
  if (!profile) return <NotFoundState />;

  const priceLabel = profile.pricing
    ? `${currencySymbol[profile.pricing.currency] ?? ''}${profile.pricing.monthlyAmount.toFixed(
        2
      )} ${profile.pricing.currency}`
    : null;

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <nav aria-label="Breadcrumb">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('mentor.publicPage.backHome', 'Back to home')}
          </Link>
        </nav>

        <ProfileHero profile={profile} />

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

        {/* Testimonials */}
        {profile.testimonials.length > 0 && (
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
              {profile.testimonials.map((item, idx) => (
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

        {/* Join */}
        {profile.acceptsNewStudents && (
          <JoinByCodeCard brandName={profile.brandName} />
        )}

        <footer className="text-center text-xs text-muted-foreground pt-6 pb-4">
          {t(
            'mentor.publicPage.poweredBy',
            'Powered by FollowUp Trading'
          )}
        </footer>
      </div>
    </main>
  );
};

export default PublicMentorProfile;
