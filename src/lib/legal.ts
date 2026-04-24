/**
 * Legal constants — single source of truth for policy versions.
 * Bumping COOKIE_POLICY_VERSION triggers re-consent for all users.
 */

export const COOKIE_POLICY_VERSION = 'v1-2026-04-24';

export const COOKIE_CONSENT_LS_KEY = 'cookie-consent-recorded';

export const COOKIE_CONSENT_CHANGED_EVENT = 'cookie-consent-changed';

export interface CookieConsentPreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

export function buildDefaultConsent(): CookieConsentPreferences {
  return { essential: true, analytics: false, marketing: false };
}

export function buildFullConsent(): CookieConsentPreferences {
  return { essential: true, analytics: true, marketing: true };
}
