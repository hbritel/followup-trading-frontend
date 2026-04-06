import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, Globe, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

const Contact = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto max-w-3xl px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">FT</div>
            <span className="text-sm font-semibold hidden sm:inline">FollowUp Trading</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-6 py-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('legal.backToHome', 'Back to Home')}
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('contact.title', 'Contact Us')}</h1>
        <p className="text-muted-foreground mb-10">
          {t('contact.subtitle', 'Have a question, issue, or suggestion? We are here to help.')}
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('contact.emailTitle', 'Email')}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t('contact.emailDesc', 'For general inquiries')}</p>
                <a href="mailto:support@followuptrading.com" className="text-sm text-primary hover:underline">
                  support@followuptrading.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('contact.securityTitle', 'Security')}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t('contact.securityDesc', 'Report a security vulnerability')}</p>
                <a href="mailto:security@followuptrading.com" className="text-sm text-primary hover:underline">
                  security@followuptrading.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('contact.socialTitle', 'Social & Community')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('contact.socialDesc', 'Follow us on social media for updates, tips, and community discussions.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border bg-muted/30 p-6">
          <h3 className="font-semibold mb-2">{t('contact.responseTitle', 'Response Times')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('contact.responseDesc', 'We aim to respond to all inquiries within 24-48 business hours. Elite plan subscribers receive priority support with a guaranteed response within 4 hours.')}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">{t('landing.privacy', 'Privacy Policy')}</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">{t('landing.terms', 'Terms of Service')}</Link>
          <Link to="/cookies" className="hover:text-foreground transition-colors">{t('landing.cookies', 'Cookie Policy')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;
