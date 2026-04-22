/**
 * lightweight-charts ignores the host timezone and always renders `Time` values
 * as UTC on the axis. To make the chart display wall-clock times that match the
 * user's browser timezone (and the page header, which uses `toLocaleString`),
 * shift every timestamp by the local UTC offset before feeding it to the chart.
 *
 * Example: in Paris (UTC+2 in DST), a candle stamped at `2026-04-21T16:30:00Z`
 * becomes `2026-04-21T18:30:00Z` after shifting. The chart still thinks it is
 * UTC, so it renders "18:30" — which is the user's local 18:30 CEST.
 *
 * This must be applied consistently to every time value passed to the chart:
 * candle timestamps, marker times, and visible-range bounds. Reverse the shift
 * when reading a time back from the chart (e.g., coordinateToTime).
 */
const MS_PER_SEC = 1000;

/**
 * Offset in seconds between the user's local wall-clock and UTC.
 * Positive when the user is east of UTC (e.g., +7200 for CEST).
 *
 * Recomputed each call so DST transitions are picked up without a reload.
 */
export function localTzOffsetSeconds(at: Date = new Date()): number {
  // getTimezoneOffset returns minutes from local to UTC (positive when behind UTC).
  return -at.getTimezoneOffset() * 60;
}

/** Shifts a UTC epoch-second timestamp so the chart renders it as local wall-clock time. */
export function utcToChartLocal(utcTs: number): number {
  return utcTs + localTzOffsetSeconds(new Date(utcTs * MS_PER_SEC));
}

/** Reverses {@link utcToChartLocal} — use when reading a time back from the chart. */
export function chartLocalToUtc(localTs: number): number {
  return localTs - localTzOffsetSeconds(new Date(localTs * MS_PER_SEC));
}
