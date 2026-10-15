/**
 * Playground state and presets. Kept free of React so it can be serialized to the URL hash.
 */

export interface PgRule {
  id: string;
  label: string;
  /** weekly = every occurrence of this weekday; daily = only this date; monthly = every day this month */
  type: 'weekly' | 'daily' | 'monthly';
  start: string; // HH:MM
  end: string;   // HH:MM
  available: boolean;
  capacity: number;
  priority: number;
}

export interface PgWindow {
  id: string;
  label: string;
  start: string;
  end: string;
  capacity: number;
}

export interface PgBooking {
  id: string;
  start: string;
  end: string;
}

export interface PlaygroundState {
  timezone: string;
  date: string; // YYYY-MM-DD
  slotMinutes: number;
  rules: PgRule[];
  windows: PgWindow[];
  bookings: PgBooking[];
}

export interface Preset {
  name: string;
  blurb: string;
  state: PlaygroundState;
}

export const PRESETS: Preset[] = [
  {
    name: '9–5 with a lunch break',
    blurb: 'A weekly rule for open hours, and a higher-priority closure carving out lunch.',
    state: {
      timezone: 'America/Los_Angeles',
      date: '2026-06-09',
      slotMinutes: 60,
      rules: [
        { id: 'r1', label: 'Open hours', type: 'weekly', start: '09:00', end: '17:00', available: true, capacity: 1, priority: 1 },
        { id: 'r2', label: 'Lunch', type: 'weekly', start: '12:00', end: '13:00', available: false, capacity: 1, priority: 5 },
      ],
      windows: [],
      bookings: [{ id: 'b1', start: '10:00', end: '11:00' }],
    },
  },
  {
    name: 'Holiday closure override',
    blurb: 'A whole-month rule sets summer hours, and a one-day closure beats both it and the weekly rule.',
    state: {
      timezone: 'America/New_York',
      date: '2026-07-03',
      slotMinutes: 45,
      rules: [
        { id: 'r1', label: 'Weekday hours', type: 'weekly', start: '08:00', end: '18:00', available: true, capacity: 2, priority: 1 },
        { id: 'r2', label: 'Summer hours (July)', type: 'monthly', start: '10:00', end: '16:00', available: true, capacity: 2, priority: 5 },
        { id: 'r3', label: 'Closed for the holiday', type: 'daily', start: '13:00', end: '24:00', available: false, capacity: 1, priority: 10 },
      ],
      windows: [],
      bookings: [],
    },
  },
  {
    name: 'Drop overrides a closed day',
    blurb: 'The shop is closed all day, but a drop (priority 100) opens a limited window with extra capacity.',
    state: {
      timezone: 'America/Chicago',
      date: '2026-06-14',
      slotMinutes: 30,
      rules: [
        { id: 'r1', label: 'Closed Sundays', type: 'weekly', start: '00:00', end: '24:00', available: false, capacity: 1, priority: 50 },
      ],
      windows: [{ id: 'w1', label: 'Flash day', start: '12:00', end: '15:00', capacity: 3 }],
      bookings: [
        { id: 'b1', start: '12:00', end: '12:30' },
        { id: 'b2', start: '12:00', end: '12:30' },
        { id: 'b3', start: '12:00', end: '12:30' },
        { id: 'b4', start: '13:00', end: '13:30' },
      ],
    },
  },
  {
    name: 'DST spring-forward',
    blurb: 'On 2026-03-08 New York skips 02:00–03:00. A 01:00–05:00 rule yields three hourly slots, not four.',
    state: {
      timezone: 'America/New_York',
      date: '2026-03-08',
      slotMinutes: 60,
      rules: [
        { id: 'r1', label: 'Overnight shift', type: 'weekly', start: '01:00', end: '05:00', available: true, capacity: 1, priority: 1 },
      ],
      windows: [],
      bookings: [],
    },
  },
];

export const DEFAULT_STATE = PRESETS[0].state;

export function encodeState(state: PlaygroundState): string {
  return btoa(encodeURIComponent(JSON.stringify(state)));
}

export function decodeState(hash: string): PlaygroundState | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(hash)));
    if (parsed && typeof parsed.timezone === 'string' && Array.isArray(parsed.rules)) {
      return { windows: [], bookings: [], ...parsed } as PlaygroundState;
    }
  } catch {
    // fall through
  }
  return null;
}
