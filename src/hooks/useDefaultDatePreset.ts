import { useCallback, useEffect, useRef } from 'react';
import { usePreferences } from '@/contexts/preferences-context';
import { usePageFilter } from '@/contexts/page-filters-context';

const STORAGE_KEY = 'ft_page_filters';
const APPLIED_PREF_KEY = 'ft_applied_date_pref';

function getAppliedPref(): string | null {
  try { return localStorage.getItem(APPLIED_PREF_KEY); }
  catch { return null; }
}

function setAppliedPref(value: string): void {
  try { localStorage.setItem(APPLIED_PREF_KEY, value); }
  catch { /* ignore */ }
}

/**
 * When the user's preference changes, clear ALL pages' stored datePreset
 * so every page picks up the new default on next mount.
 */
function clearAllDatePresets(): void {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let changed = false;
    for (const pageKey of Object.keys(stored)) {
      if (stored[pageKey]?.datePreset) {
        delete stored[pageKey].datePreset;
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  } catch { /* ignore */ }
}

/**
 * Like usePageFilter for datePreset, but respects the user's
 * `defaultDateRange` preference.
 *
 * - On first visit (no stored value): applies the user's preference
 * - When the preference changes in Settings: clears ALL stored page
 *   filters and applies the new default everywhere
 * - Manual filter changes on a page persist until the preference changes
 */
export function useDefaultDatePreset(
  pageKey: string,
  fallback = 'all'
): [string, (v: string) => void] {
  const { preferences } = usePreferences();
  const [datePreset, rawSetDatePreset] = usePageFilter(pageKey, 'datePreset', fallback);
  const applied = useRef(false);

  useEffect(() => {
    if (!preferences?.defaultDateRange || applied.current) return;
    applied.current = true;

    const prefValue = preferences.defaultDateRange;
    const lastApplied = getAppliedPref();

    if (lastApplied === prefValue) {
      // Preference unchanged — only apply if this page has no stored value
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (!stored?.[pageKey]?.datePreset) {
          rawSetDatePreset(prefValue);
        }
      } catch { /* ignore */ }
    } else {
      // Preference changed — clear all pages and apply new default
      clearAllDatePresets();
      setAppliedPref(prefValue);
      rawSetDatePreset(prefValue);
    }
  }, [preferences?.defaultDateRange, pageKey, rawSetDatePreset]);

  const setDatePreset = useCallback((v: string) => {
    rawSetDatePreset(v);
  }, [rawSetDatePreset]);

  return [datePreset, setDatePreset];
}
