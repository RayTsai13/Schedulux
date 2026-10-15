import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Calendar-date helpers that never touch the host timezone.
 * Dates are "YYYY-MM-DD" strings; arithmetic is done on a UTC anchor.
 */

export function addDaysToDateStr(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** "HH:mm[:ss]" → minutes after midnight ("24:00" → 1440) */
export function parseClock(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The UTC instant of a local wall-clock time on a local date.
 * Minutes past 1440 roll into following days. Wall times skipped by a DST
 * jump resolve forward, matching how a clock on the wall would read.
 */
export function localToUtc(date: string, minutes: number, timezone: string): Date {
  const dayOffset = Math.floor(minutes / 1440);
  const rem = minutes - dayOffset * 1440;
  const d = addDaysToDateStr(date, dayOffset);
  return fromZonedTime(`${d}T${pad(Math.floor(rem / 60))}:${pad(rem % 60)}:00`, timezone);
}

/** Local midnight at the start of `date`, as a UTC instant */
export function startOfLocalDay(date: string, timezone: string): Date {
  return localToUtc(date, 0, timezone);
}

export function formatLocal(instant: Date, timezone: string, pattern: string): string {
  return formatInTimeZone(instant, timezone, pattern);
}

export function localDateOf(instant: Date, timezone: string): string {
  return formatInTimeZone(instant, timezone, 'yyyy-MM-dd');
}

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}
