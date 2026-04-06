import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Manages the journal reminder popup lifecycle.
 *
 * - `trigger()` shows the popup. It is safe to call multiple times — a
 *   snooze or dismiss clears any pending snooze timer.
 * - `dismiss()` hides the popup without scheduling a follow-up.
 * - `snooze(minutes)` hides the popup and re-triggers it after `minutes`.
 */
export function useJournalReminder() {
  const [showReminder, setShowReminder] = useState(false);
  const snoozeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSnoozeTimer = useCallback(() => {
    if (snoozeTimerRef.current !== null) {
      clearTimeout(snoozeTimerRef.current);
      snoozeTimerRef.current = null;
    }
  }, []);

  const trigger = useCallback(() => {
    clearSnoozeTimer();
    setShowReminder(true);
  }, [clearSnoozeTimer]);

  const dismiss = useCallback(() => {
    setShowReminder(false);
  }, []);

  const snooze = useCallback(
    (minutes: number) => {
      setShowReminder(false);
      clearSnoozeTimer();
      snoozeTimerRef.current = setTimeout(() => {
        setShowReminder(true);
      }, minutes * 60 * 1000);
    },
    [clearSnoozeTimer],
  );

  // Clean up any pending snooze timer on unmount
  useEffect(() => {
    return clearSnoozeTimer;
  }, [clearSnoozeTimer]);

  return { showReminder, trigger, dismiss, snooze };
}
