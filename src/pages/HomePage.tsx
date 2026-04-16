
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  LineChart,
  ChevronRight,
  CheckCircle2,
  Menu,
  BookOpen,
  Bell,
  RefreshCcw,
  Globe,
  Calculator,
  Newspaper,
  Star,
  ArrowRight,
  ChevronDown,
  Mail,
  ExternalLink,
} from 'lucide-react';

// ── Pricing data (mirrors backend SubscriptionPlan) ────────────────────────

const PLANS = [
  {
    name: 'Free',
    price: 0,
    annual: 0,
    description: 'Get started with the essentials',
    features: [
      '1 broker connection',
      'Up to 100 trades',
      '2 strategies, 5 tags',
      '1 watchlist',
      '30 days market history',
      'Basic analytics',
    ],
    cta: 'getStartedFree',
    variant: 'outline' as const,
    popular: false,
  },
  {
    name: 'Starter',
    price: 9.99,
    annual: 7.99,
    description: 'For active traders building discipline',
    features: [
      '2 broker connections',
      'Up to 1,500 trades',
      '5 strategies, 20 tags',
      '3 watchlists',
      '5 AI coach messages/day',
      '5 price alerts',
      '3 reports/month + CSV export',
      'Market feed & economic calendar',
      '1 year market history',
      '1 prop firm evaluation',
    ],
    cta: 'startFreeTrial',
    variant: 'outline' as const,
    popular: false,
  },
  {
    name: 'Pro',
    price: 24.99,
    annual: 19.99,
    description: 'Full-featured for serious traders',
    features: [
      '5 broker connections',
      'Up to 15,000 trades',
      '20 strategies, unlimited tags',
      '10 watchlists',
      '30 AI coach messages/day',
      '25 price alerts',
      '15 reports/month',
      'Trade replay & backtesting',
      'Tax preview',
      'Advanced analytics & scheduled reports',
      '5 years market history',
      'Public leaderboard profile',
      '10 prop firm evaluations',
    ],
    cta: 'startFreeTrial',
    variant: 'default' as const,
    popular: true,
  },
  {
    name: 'Elite',
    price: 59.99,
    annual: 47.99,
    description: 'Unlimited power for professionals',
    features: [
      'Unlimited broker connections',
      'Unlimited trades',
      'Unlimited strategies & tags',
      'Unlimited watchlists',
      '150 AI coach messages/day',
      'Unlimited alerts & reports',
      'Trade replay & backtesting (unlimited)',
      'Full tax reporting',
      'All analytics & exports',
      'Unlimited market history',
      'Real-time sync (<1s)',
      'Prop firm live tracking (unlimited)',
      'Priority support',
    ],
    cta: 'startFreeTrial',
    variant: 'outline' as const,
    popular: false,
  },
];

const FEATURES = [
  { icon: BarChart3, title: 'performanceAnalytics', desc: 'performanceAnalyticsDesc' },
  { icon: BookOpen, title: 'tradingJournal', desc: 'tradingJournalDesc' },
  { icon: Shield, title: 'riskManagement', desc: 'riskManagementDesc' },
  { icon: Bell, title: 'priceAlerts', desc: 'priceAlertsDesc' },
  { icon: RefreshCcw, title: 'backtesting', desc: 'backtestingDesc' },
  { icon: LineChart, title: 'tradeReplay', desc: 'tradeReplayDesc' },
  { icon: Zap, title: 'aiCoach', desc: 'aiCoachDesc' },
  { icon: Calculator, title: 'taxReporting', desc: 'taxReportingDesc' },
  { icon: Newspaper, title: 'marketFeed', desc: 'marketFeedDesc' },
  { icon: Globe, title: 'multiBroker', desc: 'multiBrokerDesc' },
  { icon: TrendingUp, title: 'advancedStats', desc: 'advancedStatsDesc' },
  { icon: Star, title: 'leaderboard', desc: 'leaderboardDesc' },
];

const FAQS = [
  { q: 'faqFreeQ', a: 'faqFreeA' },
  { q: 'faqTrialQ', a: 'faqTrialA' },
  { q: 'faqBrokersQ', a: 'faqBrokersA' },
  { q: 'faqDataQ', a: 'faqDataA' },
  { q: 'faqCancelQ', a: 'faqCancelA' },
];

// ── Component ───────────────────────────────────────────────────────────────

const HomePage = () => {
  // All hooks MUST be called before any early return (Rules of Hooks).
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t } = useTranslation();

  // Redirect authenticated users to the dashboard — avoids rendering app-shell
  // components (WebSocketProvider etc.) in the public landing page context.
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const navLinks = [
    { href: '#features', label: t('landing.features', 'Features') },
    { href: '#pricing', label: t('landing.pricing', 'Pricing') },
    { href: '#faq', label: t('landing.faq', 'FAQ') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="border-b border-border/50 sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-white shadow-lg shadow-primary/20">
              FT
            </div>
            <span className="text-lg font-bold hidden sm:inline">FollowUp Trading</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="sm">{t('landing.goToDashboard', 'Go to Dashboard')}</Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="ghost" size="sm">{t('common.login', 'Log in')}</Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button size="sm">{t('common.signup', 'Sign Up')}</Button>
                  </Link>
                </>
              )}
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-10">
                <nav className="flex flex-col gap-4">
                  {navLinks.map(link => (
                    <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium py-2 border-b border-border">
                      {link.label}
                    </a>
                  ))}
                  {isAuthenticated ? (
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full mt-4">{t('landing.goToDashboard', 'Go to Dashboard')}</Button>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4">
                      <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">{t('common.login', 'Log in')}</Button>
                      </Link>
                      <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">{t('common.signup', 'Sign Up')}</Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-6 text-xs px-3 py-1 gap-1.5">
            <Zap className="h-3 w-3" />
            {t('landing.heroTag', 'AI-powered trading journal')}
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            {t('landing.heroTitle1', 'Track, Analyze &')}{' '}
            <span className="text-primary">{t('landing.heroTitle2', 'Improve')}</span>{' '}
            {t('landing.heroTitle3', 'Your Trading')}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroSubtitle', 'Connect your brokers, track every trade automatically, and get AI-powered insights to optimize your strategy.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link to="/auth/signup">
              <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20">
                {t('landing.getStartedFree', 'Get Started Free')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                {t('landing.seeFeatures', 'See Features')}
              </Button>
            </a>
          </div>
          {/* Stats strip */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { value: '10+', label: t('landing.statBrokers', 'Supported Brokers') },
              { value: '50K+', label: t('landing.statTrades', 'Trades Tracked') },
              { value: '99.9%', label: t('landing.statUptime', 'Uptime') },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">{t('landing.featuresTitle', 'Everything You Need to Trade Better')}</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.featuresSubtitle', 'From journaling to backtesting, FollowUp Trading covers every aspect of your trading workflow.')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{t(`landing.${f.title}`, f.title)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.${f.desc}`, f.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-28 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('landing.pricingTitle', 'Simple, Transparent Pricing')}</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.pricingSubtitle', 'Start free, upgrade when you need more. No hidden fees.')}
            </p>
            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border p-1">
              <button
                onClick={() => setBillingAnnual(false)}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', !billingAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {t('landing.monthly', 'Monthly')}
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', billingAnnual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {t('landing.annual', 'Annual')}
                <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">-20%</Badge>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map(plan => {
              const price = billingAnnual ? plan.annual : plan.price;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative rounded-xl border p-6 flex flex-col transition-all',
                    plan.name === 'Elite'
                      ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : plan.popular
                        ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
                        : 'border-border hover:border-primary/30',
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-3">
                      {t('landing.mostPopular', 'Most Popular')}
                    </Badge>
                  )}
                  {plan.name === 'Elite' && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] px-3">
                      {t('landing.mostPowerful', 'Most Powerful')}
                    </Badge>
                  )}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{t(`landing.plan${plan.name}Desc`, plan.description)}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-bold tabular-nums">${price}</span>
                    <span className="text-sm text-muted-foreground">/{t('landing.mo', 'mo')}</span>
                    {billingAnnual && plan.price > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {t('landing.billedAnnually', 'Billed annually')} · ${(price * 12).toFixed(0)}/{t('landing.yr', 'yr')}
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth/signup" className="mt-auto">
                    <Button
                      variant={plan.variant}
                      className={cn(
                        'w-full',
                        plan.popular && 'shadow-md',
                        plan.name === 'Elite' && 'bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-600 hover:to-amber-500 border-0',
                      )}
                    >
                      {plan.price === 0
                        ? t('landing.getStartedFree', 'Get Started Free')
                        : t('landing.startFreeTrial', 'Start Free Trial')}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 md:py-28 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('landing.faqTitle', 'Frequently Asked Questions')}</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  {t(`landing.${faq.q}`, faq.q)}
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                    {t(`landing.${faq.a}`, faq.a)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('landing.ctaTitle', 'Ready to Take Your Trading to the Next Level?')}
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            {t('landing.ctaSubtitle', 'Join thousands of traders who track, analyze, and improve their performance every day.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 px-8 h-12">
                  {t('landing.goToDashboard', 'Go to Dashboard')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/signup">
                  <Button size="lg" className="gap-2 px-8 h-12 shadow-lg shadow-primary/20">
                    {t('landing.getStartedFree', 'Get Started Free')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button size="lg" variant="outline" className="px-8 h-12">
                    {t('common.login', 'Log in')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">FT</div>
                <span className="text-lg font-bold">FollowUp Trading</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('landing.footerTagline', 'The modern trading journal for retail and professional traders.')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold mb-4">{t('landing.footerProduct', 'Product')}</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.features', 'Features')}</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.pricing', 'Pricing')}</a></li>
                <li><a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.faq', 'FAQ')}</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold mb-4">{t('landing.footerLegal', 'Legal')}</h4>
              <ul className="space-y-2.5">
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.privacy', 'Privacy Policy')}</Link></li>
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.terms', 'Terms of Service')}</Link></li>
                <li><Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.cookies', 'Cookie Policy')}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold mb-4">{t('landing.footerSupport', 'Support')}</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {t('landing.contactSupport', 'Contact')}
                  </Link>
                </li>
                <li>
                  <a href="https://docs.followuptrading.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('landing.documentation', 'Documentation')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} FollowUp Trading. {t('landing.allRightsReserved', 'All rights reserved.')}
            </p>
            <p className="text-[11px] text-muted-foreground/50 max-w-md text-center md:text-right">
              {t('landing.riskDisclaimer', 'Trading involves risk. Past performance is not indicative of future results. This platform is a tool, not financial advice.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
