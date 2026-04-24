import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_LS_KEY,
  COOKIE_POLICY_VERSION,
  buildDefaultConsent,
  buildFullConsent,
  type CookieConsentPreferences,
} from '@/lib/legal';
import { useCookieConsentLatest, useRecordCookieConsent } from '@/hooks/useAdminMentor';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStoredVersion(): string | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.policyVersion ?? null;
  } catch {
    return null;
  }
}

function setStoredVersion(policyVersion: string, prefs: CookieConsentPreferences): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_LS_KEY, JSON.stringify({ policyVersion, prefs }));
  } catch {
    /* ignore storage errors */
  }
}

function dispatchConsentEvent(prefs: CookieConsentPreferences): void {
  try {
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: prefs })
    );
  } catch {
    /* ignore */
  }
}

// ── Customize dialog ─────────────────────────────────────────────────────────

interface CustomizeDialogProps {
  open: boolean;
  prefs: CookieConsentPreferences;
  onPrefsChange: (prefs: CookieConsentPreferences) => void;
  onSave: () => void;
  onClose: () => void;
}

function CustomizeDialog({ open, prefs, onPrefsChange, onSave, onClose }: CustomizeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('legal.cookieBanner.customizeTitle', 'Cookie preferences')}</DialogTitle>
          <DialogDescription>
            {t(
              'legal.cookieBanner.customizeDescription',
              'Manage which cookies you allow. Essential cookies cannot be disabled.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Essential — always on */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 bg-muted/30">
            <div className="min-w-0 pr-4">
              <Label className="text-sm font-medium">
                {t('legal.cookieBanner.essentialLabel', 'Essential')}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'legal.cookieBanner.essentialDescription',
                  'Required for core functionality — authentication, security, preferences.'
                )}
              </p>
            </div>
            <Switch checked disabled aria-label={t('legal.cookieBanner.essentialLabel', 'Essential')} />
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
            <div className="min-w-0 pr-4">
              <Label htmlFor="cookie-analytics" className="text-sm font-medium cursor-pointer">
                {t('legal.cookieBanner.analyticsLabel', 'Analytics')}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'legal.cookieBanner.analyticsDescription',
                  'Help us understand how you use the platform so we can improve it.'
                )}
              </p>
            </div>
            <Switch
              id="cookie-analytics"
              checked={prefs.analytics}
              onCheckedChange={(checked) =>
                onPrefsChange({ ...prefs, analytics: checked })
              }
              aria-label={t('legal.cookieBanner.analyticsLabel', 'Analytics')}
            />
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
            <div className="min-w-0 pr-4">
              <Label htmlFor="cookie-marketing" className="text-sm font-medium cursor-pointer">
                {t('legal.cookieBanner.marketingLabel', 'Marketing')}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'legal.cookieBanner.marketingDescription',
                  'Allow personalised content and relevant offers based on your activity.'
                )}
              </p>
            </div>
            <Switch
              id="cookie-marketing"
              checked={prefs.marketing}
              onCheckedChange={(checked) =>
                onPrefsChange({ ...prefs, marketing: checked })
              }
              aria-label={t('legal.cookieBanner.marketingLabel', 'Marketing')}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button size="sm" onClick={onSave}>
            {t('legal.cookieBanner.savePreferences', 'Save preferences')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────

const CookieBanner: React.FC = () => {
  const { t } = useTranslation();

  // Whether we should show the banner at all
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookieConsentPreferences>(buildDefaultConsent());

  const recordConsent = useRecordCookieConsent();

  // On mount — check localStorage first, then optionally verify server version
  const storedVersion = useRef(getStoredVersion());
  const needsConsentCheck = storedVersion.current !== COOKIE_POLICY_VERSION;

  // Only fetch server-side record when we already have a local record
  // (to detect policy version updates for returning users)
  const { data: serverConsent } = useCookieConsentLatest(!needsConsentCheck);

  useEffect(() => {
    if (needsConsentCheck) {
      // No local record or outdated version — show banner
      setVisible(true);
      return;
    }

    // Local record exists and version matches — but check if server disagrees
    // (policy version bump since last visit)
    if (
      serverConsent !== undefined &&
      serverConsent !== null &&
      serverConsent.policyVersion !== COOKIE_POLICY_VERSION
    ) {
      setVisible(true);
    }
  }, [needsConsentCheck, serverConsent]);

  const handleAcceptAll = () => {
    const full = buildFullConsent();
    save(full);
  };

  const handleRejectNonEssential = () => {
    const minimal = buildDefaultConsent();
    save(minimal);
  };

  const handleSaveCustom = () => {
    save(prefs);
    setCustomizeOpen(false);
  };

  const save = (finalPrefs: CookieConsentPreferences) => {
    setStoredVersion(COOKIE_POLICY_VERSION, finalPrefs);
    dispatchConsentEvent(finalPrefs);
    recordConsent.mutate(finalPrefs);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label={t('legal.cookieBanner.ariaLabel', 'Cookie consent')}
        className={cn(
          // Positioning — fixed bottom, full width
          'fixed bottom-0 left-0 right-0 z-50',
          // Safe area for mobile
          'pb-safe',
        )}
      >
        <div
          className={cn(
            'mx-auto max-w-5xl mb-4 mx-4 sm:mx-6',
            // Glass-card treatment
            'rounded-2xl border border-border/60',
            'bg-background/90 backdrop-blur-xl',
            // Subtle shadow instead of hard elevation
            'shadow-[0_-2px_24px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.04)_inset]',
            'dark:shadow-[0_-2px_24px_-4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.04)_inset]',
            'px-5 py-4',
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon + text */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Cookie
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug">
                  {t('legal.cookieBanner.title', 'We use cookies')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t(
                    'legal.cookieBanner.description',
                    'We use essential cookies to operate the platform and optional cookies for analytics and personalisation.'
                  )}{' '}
                  <a
                    href="/cookies"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    {t('legal.cookieBanner.learnMore', 'Learn more')}
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setCustomizeOpen(true)}
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t('legal.cookieBanner.customize', 'Customize')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleRejectNonEssential}
                disabled={recordConsent.isPending}
              >
                {t('legal.cookieBanner.rejectNonEssential', 'Reject non-essential')}
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleAcceptAll}
                disabled={recordConsent.isPending}
              >
                {t('legal.cookieBanner.acceptAll', 'Accept all')}
              </Button>

              {/* Close (equivalent to reject) */}
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('legal.cookieBanner.dismiss', 'Dismiss')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customize dialog */}
      <CustomizeDialog
        open={customizeOpen}
        prefs={prefs}
        onPrefsChange={setPrefs}
        onSave={handleSaveCustom}
        onClose={() => setCustomizeOpen(false)}
      />
    </>
  );
};

export default CookieBanner;
