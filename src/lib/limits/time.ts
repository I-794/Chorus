/** Today's date in UTC as YYYY-MM-DD (the daily cap's "day"). */
export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The next 00:00 UTC, when the daily cap resets. */
export function nextUtcMidnight(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
}

/** Human-friendly "3h 12m" until a moment. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
