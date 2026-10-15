/** Identifier for a rule or window, echoed back on resolved blocks so callers can trace results. */
export type SourceId = string | number;

/**
 * A recurring or one-off block of working hours (or a closure).
 *
 * - `weekly` matches every `dayOfWeek` (0 = Sunday … 6 = Saturday)
 * - `daily` matches one calendar `date` (YYYY-MM-DD)
 * - `monthly` matches every day of `month` (1–12), optionally only in `year`
 *
 * When rules overlap, the highest `priority` wins for the overlapping time.
 */
export interface Rule {
  id: SourceId;
  type: 'weekly' | 'daily' | 'monthly';
  dayOfWeek?: number | null;
  date?: string | null;
  month?: number | null;
  year?: number | null;
  /** Local wall-clock time, "HH:mm" or "HH:mm:ss". "24:00" means end of day. */
  start: string;
  end: string;
  /** false = closure: blocks bookings for this period */
  available: boolean;
  /** Maximum overlapping bookings allowed */
  capacity: number;
  priority: number;
  label?: string;
}

/**
 * A one-off bookable window on a specific date (e.g. a limited "drop").
 * Windows default to priority 100 so they override ordinary rules, including closures.
 */
export interface Window {
  id: SourceId;
  date: string;
  start: string;
  end: string;
  capacity: number;
  priority?: number;
  label?: string;
}

/** An existing booking that consumes capacity. */
export interface Booking {
  start: Date | string;
  end: Date | string;
}

export interface BlockSource {
  kind: 'rule' | 'window';
  id: SourceId;
}

/** A span of time with the availability settings of the rule or window that owns it. */
export interface TimeBlock {
  start: Date;
  end: Date;
  available: boolean;
  capacity: number;
  priority: number;
  source: BlockSource;
}

/** A bookable slot. */
export interface Slot {
  /** UTC instant, ISO 8601. Covers duration + buffer. */
  start: string;
  end: string;
  /** Local calendar date in the schedule's timezone (YYYY-MM-DD) */
  localDate: string;
  /** Local "HH:mm" */
  localStart: string;
  /** Local end of the visible part of the slot (duration without buffer) */
  localEnd: string;
  /** Capacity left after overlapping bookings */
  remaining: number;
}

export interface ResolveDayInput {
  /** Local calendar date (YYYY-MM-DD) */
  date: string;
  /** IANA timezone, e.g. "America/New_York" */
  timezone: string;
  rules: Rule[];
  windows?: Window[];
}

export interface ResolvedDay {
  date: string;
  /** Each matching rule/window as its own block, before conflict resolution */
  layers: TimeBlock[];
  /** Non-overlapping spans, each owned by the highest-priority layer covering it */
  segments: TimeBlock[];
  /** Segments with adjacent equal settings joined; slots are generated from these */
  blocks: TimeBlock[];
}

export interface ComputeSlotsInput {
  timezone: string;
  /** First and last local dates, inclusive (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  rules: Rule[];
  windows?: Window[];
  bookings?: Booking[];
  /** Spacing between slot starts: service duration + buffer */
  slotMinutes: number;
  /** Visible duration used for `localEnd`; defaults to slotMinutes */
  displayMinutes?: number;
  /** Slots starting before this instant are omitted; defaults to the current time */
  now?: Date;
}

export interface CheckSlotInput {
  timezone: string;
  start: Date;
  end: Date;
  rules: Rule[];
  windows?: Window[];
  /** Bookings already overlapping [start, end) */
  overlapping: number;
  now?: Date;
}

export type CheckSlotResult =
  | { available: true; capacity: number; overlapping: number }
  | {
      available: false;
      reason: 'past' | 'outside-hours' | 'full';
      capacity?: number;
      overlapping?: number;
    };
