import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface LegalSection {
  title: string;
  content: string;
  list?: string[];
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export function LegalPageLayout({ title, lastUpdated, sections }: LegalPageLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Mini header */}
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

        <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
        <p className="text-sm text-muted-foreground mb-10">{t('legal.lastUpdated', 'Last updated')}: {lastUpdated}</p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
              {section.list && section.list.length > 0 && (
                <ul className="list-disc pl-6 space-y-1.5 text-sm text-muted-foreground mt-3">
                  {section.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">{t('landing.privacy', 'Privacy Policy')}</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">{t('landing.terms', 'Terms of Service')}</Link>
          <Link to="/cookies" className="hover:text-foreground transition-colors">{t('landing.cookies', 'Cookie Policy')}</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">{t('landing.contactSupport', 'Contact')}</Link>
        </div>
      </div>
    </div>
  );
}
