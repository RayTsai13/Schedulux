import { toast } from 'sonner';

/** Absolute URL of a vendor's public page, or one of its drops */
export function pageUrl(slug: string, dropId?: number): string {
  return `${window.location.origin}/@${slug}${dropId ? `/drops/${dropId}` : ''}`;
}

/** Absolute URL of a guest's manage-booking page */
export function manageUrl(token: string): string {
  return `${window.location.origin}/manage/${token}`;
}

export async function copyLink(url: string, label = 'Link'): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy — select the link and copy it manually');
  }
}

/**
 * Format an instant in a specific IANA timezone (the vendor's), independent of the viewer's.
 */
export function formatInZone(
  iso: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(undefined, { timeZone, ...options }).format(new Date(iso));
}

/** "Saturday, June 13" for a YYYY-MM-DD calendar date (no timezone shift) */
export function formatCalendarDate(date: string, options: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}): string {
  return new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(
    new Date(`${date.slice(0, 10)}T12:00:00Z`)
  );
}

/** "13:00:00" → "1:00 PM" */
export function formatClock(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, 0, 1, h, m))
  );
}
