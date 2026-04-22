export interface DteInfo {
  readonly days: number | null;
  readonly isExpired: boolean;
  readonly isExpiringSoon: boolean;
}

const MS_PER_DAY = 86_400_000;
const EXPIRING_SOON_THRESHOLD_DAYS = 7;

export function computeDte(
  expirationDate: string | null,
  now: Date = new Date(),
): DteInfo {
  if (!expirationDate) {
    return { days: null, isExpired: false, isExpiringSoon: false };
  }
  const expiry = new Date(expirationDate);
  if (Number.isNaN(expiry.getTime())) {
    return { days: null, isExpired: false, isExpiringSoon: false };
  }
  const diffMs = expiry.getTime() - now.getTime();
  const days = Math.ceil(diffMs / MS_PER_DAY);
  const isExpired = days < 0;
  const isExpiringSoon = !isExpired && days <= EXPIRING_SOON_THRESHOLD_DAYS;
  return { days, isExpired, isExpiringSoon };
}

export type DteBucket = 'lt7' | 'd7_30' | 'd30_60' | 'gt60' | 'none';

export function dteBucket(days: number | null): DteBucket {
  if (days == null) return 'none';
  if (days < 7) return 'lt7';
  if (days <= 30) return 'd7_30';
  if (days <= 60) return 'd30_60';
  return 'gt60';
}
