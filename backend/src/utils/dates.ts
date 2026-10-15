import { format } from 'date-fns';

/**
 * Normalize a DATE column to YYYY-MM-DD.
 * node-postgres returns DATE as a Date at local midnight, so format in local time.
 */
export function toDateStr(value: Date | string): string {
  return typeof value === 'string' ? value.substring(0, 10) : format(value, 'yyyy-MM-dd');
}
