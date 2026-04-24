import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Check,
  ChevronRight,
  Globe,
  GraduationCap,
  Landmark,
  Repeat2,
  ShieldCheck,
  User2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/auth-context';
import { useFeatureFlags } from '@/contexts/feature-flags-context';

// ── Value proposition cards ───────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    icon: Repeat2,
    titleKey: 'mentor.becomeMentor.valueProps.recurringRevenue.title',
    bodyKey: 'mentor.becomeMentor.valueProps.recurringRevenue.body',
    accent: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart3,
    titleKey: 'mentor.becomeMentor.valueProps.analytics.title',
    bodyKey: 'mentor.becomeMentor.valueProps.analytics.body',
    accent: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
  },
  {
    icon: Globe,
    titleKey: 'mentor.becomeMentor.valueProps.publicProfile.title',
    bodyKey: 'mentor.becomeMentor.valueProps.publicProfile.body',
    accent: 'from-violet-500/20 to-violet-500/5',
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
  },
  {
    icon: Landmark,
    titleKey: 'mentor.becomeMentor.valueProps.payouts.title',
    bodyKey: 'mentor.becomeMentor.valueProps.payouts.body',
    accent: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
] as const;

// ── Requirements list ─────────────────────────────────────────────────────────

const REQUIREMENT_KEYS = [
  { key: 'mentor.becomeMentor.requirements.teamPlan', icon: GraduationCap },
  { key: 'mentor.becomeMentor.requirements.kyc', icon: ShieldCheck },
  { key: 'mentor.becomeMentor.requirements.agreement', icon: Check },
  { key: 'mentor.becomeMentor.requirements.age', icon: User2 },
  { key: 'mentor.becomeMentor.requirements.sanctions', icon: Globe },
] as const;

// ── Earnings Calculator ───────────────────────────────────────────────────────

const PLATFORM_FEE = 0.15;
const MIN_PRICE = 9;
const MAX_PRICE = 299;
const MIN_STUDENTS = 1;
const MAX_STUDENTS = 50;

const EarningsCalculator: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [price, setPrice] = useState(49);
  const [students, setStudents] = useState(10);

  const monthly = useMemo(
    () => price * students * (1 - PLATFORM_FEE),
    [price, students]
  );
  const annual = useMemo(() => monthly * 12, [monthly]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <section
      aria-labelledby="calculator-heading"
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-6"
    >
      <h2
        id="calculator-heading"
        className="text-xl font-bold tracking-tight"
      >
        {t('mentor.becomeMentor.calculator.title')}
      </h2>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Price slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t('mentor.becomeMentor.calculator.priceLabel')}
            </Label>
            <span className="text-xl font-bold tabular-nums text-primary">
              ${price}/mo
            </span>
          </div>
          <Slider
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={1}
            value={[price]}
            onValueChange={([v]) => setPrice(v)}
            aria-label={t('mentor.becomeMentor.calculator.priceLabel')}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>${MIN_PRICE}</span>
            <span>${MAX_PRICE}</span>
          </div>
        </div>

        {/* Students slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t('mentor.becomeMentor.calculator.studentsLabel')}
            </Label>
            <span className="text-xl font-bold tabular-nums text-primary">
              {students}
            </span>
          </div>
          <Slider
            min={MIN_STUDENTS}
            max={MAX_STUDENTS}
            step={1}
            value={[students]}
            onValueChange={([v]) => setStudents(v)}
            aria-label={t('mentor.becomeMentor.calculator.studentsLabel')}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{MIN_STUDENTS}</span>
            <span>{MAX_STUDENTS}</span>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            {t('mentor.becomeMentor.calculator.monthlyOutput', {
              amount: '',
            }).replace('{{amount}}', '').trim()}
          </p>
          <p className="text-3xl font-bold tabular-nums text-primary">
            {fmt(monthly)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t('mentor.becomeMentor.calculator.monthlyOutput', {
              amount: fmt(monthly),
            })}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            {t('mentor.becomeMentor.calculator.annualOutput', {
              amount: '',
            }).replace('{{amount}}', '').trim()}
          </p>
          <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {fmt(annual)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t('mentor.becomeMentor.calculator.annualOutput', {
              amount: fmt(annual),
            })}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {t('mentor.becomeMentor.calculator.feeDisclosure')}
      </p>
    </section>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const BecomeMentorContent: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { hasPlan } = useFeatureFlags();
  const navigate = useNavigate();
  const [legalAgreed, setLegalAgreed] = useState(false);

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/auth/signup?returnTo=/become-a-mentor');
      return;
    }
    if (!hasPlan('TEAM')) {
      navigate('/pricing?highlight=TEAM');
      return;
    }
    navigate('/mentor');
  };

  const ctaLabel = !isAuthenticated
    ? t('mentor.becomeMentor.cta.signupFirst')
    : !hasPlan('TEAM')
      ? t('mentor.becomeMentor.cta.upgradeFirst')
      : t('mentor.becomeMentor.cta.apply');

  return (
    <main className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="become-mentor-heading"
        className="relative overflow-hidden py-20 md:py-32 px-4"
      >
        {/* Ambient gradients — compositor-only opacity/transform, no layout */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute top-[-15%] left-[5%] h-[560px] w-[560px] rounded-full bg-primary/12 blur-[130px]" />
          <div className="absolute bottom-[-10%] right-[8%] h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[110px]" />
          {/* Subtle grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              backgroundSize: '128px 128px',
            }}
          />
        </div>

        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            <BadgeDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
            Mentor Program
          </div>

          <h1
            id="become-mentor-heading"
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-balance"
          >
            {t('mentor.becomeMentor.hero.title')}
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('mentor.becomeMentor.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/20"
              onClick={handleApply}
              disabled={isAuthenticated && hasPlan('TEAM') && !legalAgreed}
              aria-describedby="legal-gate-label"
            >
              {t('mentor.becomeMentor.hero.ctaPrimary')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 px-8 h-12 text-base"
            >
              <Link to="/mentors">
                {t('mentor.becomeMentor.hero.ctaSecondary')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Value propositions ────────────────────────────────────────── */}
      <section
        aria-labelledby="value-props-heading"
        className="py-16 md:py-24 px-4 bg-muted/20"
      >
        <div className="container mx-auto max-w-6xl">
          <h2
            id="value-props-heading"
            className="sr-only"
          >
            Why mentor on FollowUp Trading
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUE_PROPS.map(({ icon: Icon, titleKey, bodyKey, accent, iconColor, iconBg }) => (
              <article
                key={titleKey}
                className={`rounded-2xl border border-border/50 bg-gradient-to-br ${accent} p-6 space-y-3 hover:shadow-md transition-shadow duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold leading-snug">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(bodyKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshots / Social proof ────────────────────────────────── */}
      <section
        aria-labelledby="screenshots-heading"
        className="py-16 md:py-24 px-4"
      >
        <div className="container mx-auto max-w-5xl">
          <h2
            id="screenshots-heading"
            className="text-2xl md:text-3xl font-bold text-center mb-12 tracking-tight"
          >
            Everything you need to run your program
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Hub screenshot */}
            <figure className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-muted/30 overflow-hidden aspect-[4/3] flex items-center justify-center">
                <img
                  src="/placeholder-hub.png"
                  alt={t('mentor.becomeMentor.screenshots.hub.alt')}
                  width={480}
                  height={360}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="text-center text-sm font-medium text-muted-foreground">
                Mentor hub
              </figcaption>
            </figure>
            {/* Students screenshot */}
            <figure className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-muted/30 overflow-hidden aspect-[4/3] flex items-center justify-center">
                <img
                  src="/placeholder-students.png"
                  alt={t('mentor.becomeMentor.screenshots.students.alt')}
                  width={480}
                  height={360}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="text-center text-sm font-medium text-muted-foreground">
                Student management
              </figcaption>
            </figure>
            {/* Analytics screenshot */}
            <figure className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-muted/30 overflow-hidden aspect-[4/3] flex items-center justify-center">
                <img
                  src="/placeholder-analytics.png"
                  alt={t('mentor.becomeMentor.screenshots.analytics.alt')}
                  width={480}
                  height={360}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="text-center text-sm font-medium text-muted-foreground">
                Analytics dashboard
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── Earnings calculator ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-3xl">
          <EarningsCalculator />
        </div>
      </section>

      {/* ── Requirements + Legal gate + CTA ──────────────────────────── */}
      <section
        aria-labelledby="requirements-heading"
        className="py-16 md:py-24 px-4"
      >
        <div className="container mx-auto max-w-2xl space-y-8">
          {/* Requirements checklist */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 space-y-5">
            <h2
              id="requirements-heading"
              className="text-xl font-bold tracking-tight"
            >
              {t('mentor.becomeMentor.requirements.title')}
            </h2>
            <ul className="space-y-3" role="list">
              {REQUIREMENT_KEYS.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-sm leading-relaxed">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal gate */}
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="legal-gate"
                checked={legalAgreed}
                onCheckedChange={(checked) => setLegalAgreed(checked === true)}
                aria-describedby="legal-gate-label"
                className="mt-0.5"
              />
              <Label
                id="legal-gate-label"
                htmlFor="legal-gate"
                className="text-sm leading-relaxed cursor-pointer select-none"
              >
                {t('mentor.becomeMentor.legalGate.label')}
              </Label>
            </div>

            <Button
              size="lg"
              className="w-full gap-2 shadow-md shadow-primary/15"
              disabled={!legalAgreed}
              onClick={handleApply}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Footer disclaimer */}
          <footer className="space-y-2 text-center">
            <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-lg mx-auto">
              {t('mentor.becomeMentor.footer.disclaimer')}
            </p>
            <Link
              to="/mentors"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
            >
              {t('mentor.becomeMentor.footer.faqLink')}
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default BecomeMentorContent;
