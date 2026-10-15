import { describe, it, expect } from 'vitest';
import { computeSlots, resolveDay, checkSlot } from '../index';
import type { Rule, Window } from '../index';

// 2026-06-08 is a Monday (dayOfWeek = 1)
const MONDAY = '2026-06-08';
const NOW = new Date('2026-06-01T00:00:00Z');

let nextId = 1;
const rule = (overrides: Partial<Rule> = {}): Rule => ({
  id: nextId++,
  type: 'weekly',
  dayOfWeek: 1,
  start: '09:00',
  end: '12:00',
  available: true,
  capacity: 1,
  priority: 1,
  ...overrides,
});
const window = (overrides: Partial<Window> = {}): Window => ({
  id: `w${nextId++}`,
  date: MONDAY,
  start: '13:00',
  end: '15:00',
  capacity: 1,
  ...overrides,
});

const slotsFor = (
  overrides: Partial<Parameters<typeof computeSlots>[0]> = {}
) =>
  computeSlots({
    timezone: 'UTC',
    startDate: MONDAY,
    endDate: MONDAY,
    rules: [rule()],
    slotMinutes: 60,
    now: NOW,
    ...overrides,
  });
const starts = (slots: { localStart: string }[]) => slots.map((s) => s.localStart);

describe('computeSlots', () => {
  it('generates back-to-back slots from a weekly rule', () => {
    const slots = slotsFor();
    expect(starts(slots)).toEqual(['09:00', '10:00', '11:00']);
    expect(slots[0]).toEqual({
      start: '2026-06-08T09:00:00.000Z',
      end: '2026-06-08T10:00:00.000Z',
      localDate: MONDAY,
      localStart: '09:00',
      localEnd: '10:00',
      remaining: 1,
    });
  });

  it('spaces slots by slotMinutes but reports localEnd from displayMinutes', () => {
    const slots = slotsFor({ slotMinutes: 75, displayMinutes: 60 });
    expect(starts(slots)).toEqual(['09:00', '10:15']);
    expect(slots[0].localEnd).toBe('10:00');
    expect(slots[0].end).toBe('2026-06-08T10:15:00.000Z');
  });

  it('produces nothing on days without a matching rule', () => {
    expect(slotsFor({ rules: [rule({ dayOfWeek: 2 })] })).toEqual([]);
  });

  it('lets a higher-priority daily closure carve out part of a weekly rule', () => {
    const slots = slotsFor({
      rules: [
        rule(),
        rule({ type: 'daily', date: MONDAY, start: '10:00', end: '11:00', available: false, priority: 10 }),
      ],
    });
    expect(starts(slots)).toEqual(['09:00', '11:00']);
  });

  it('applies monthly rules only to the matching month and year', () => {
    const slots = slotsFor({
      rules: [
        rule({ type: 'monthly', month: 6, year: 2026 }),
        rule({ type: 'monthly', month: 6, year: 2025, start: '14:00', end: '15:00' }),
      ],
    });
    expect(starts(slots)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('adds windows with their own capacity', () => {
    const slots = slotsFor({ windows: [window({ capacity: 3 })] });
    expect(starts(slots)).toEqual(['09:00', '10:00', '11:00', '13:00', '14:00']);
    expect(slots[slots.length - 1].remaining).toBe(3);
  });

  it('lets a window override a full-day closure', () => {
    const slots = slotsFor({
      rules: [rule({ type: 'daily', date: MONDAY, start: '00:00', end: '24:00', available: false, priority: 50 })],
      windows: [window({ start: '10:00', end: '12:00' })],
    });
    expect(starts(slots)).toEqual(['10:00', '11:00']);
  });

  it('reduces capacity for overlapping bookings and hides full slots', () => {
    const slots = slotsFor({
      rules: [rule({ capacity: 2 })],
      bookings: [
        { start: '2026-06-08T09:00:00Z', end: '2026-06-08T10:00:00Z' },
        { start: '2026-06-08T09:00:00Z', end: '2026-06-08T10:00:00Z' },
        { start: new Date('2026-06-08T10:30:00Z'), end: new Date('2026-06-08T11:00:00Z') },
      ],
    });
    expect(slots.map((s) => [s.localStart, s.remaining])).toEqual([
      ['10:00', 1],
      ['11:00', 2],
    ]);
  });

  it('omits slots that start before now', () => {
    expect(starts(slotsFor({ now: new Date('2026-06-08T10:30:00Z') }))).toEqual(['11:00']);
  });

  it('interprets rule times in the schedule timezone', () => {
    const slots = slotsFor({ timezone: 'America/Los_Angeles' });
    expect(starts(slots)).toEqual(['09:00', '10:00', '11:00']);
    expect(slots[0].start).toBe('2026-06-08T16:00:00.000Z'); // PDT = UTC-7
    expect(slots[0].localDate).toBe(MONDAY);
  });

  it('counts evening bookings that fall on the next UTC day', () => {
    // 17:00 PDT Monday is 00:00 UTC Tuesday
    const slots = slotsFor({
      timezone: 'America/Los_Angeles',
      rules: [rule({ start: '16:00', end: '19:00' })],
      bookings: [{ start: '2026-06-09T00:00:00Z', end: '2026-06-09T01:00:00Z' }],
    });
    expect(starts(slots)).toEqual(['16:00', '18:00']);
  });

  it('returns exactly one set of slots per local day across a DST change', () => {
    // US DST ends 2026-11-01 at 02:00 local
    const slots = computeSlots({
      timezone: 'America/Los_Angeles',
      startDate: '2026-10-31',
      endDate: '2026-11-02',
      rules: [0, 1, 6].map((d) => rule({ dayOfWeek: d, start: '09:00', end: '10:00' })),
      slotMinutes: 60,
      now: new Date('2026-10-01T00:00:00Z'),
    });
    expect(slots.map((s) => [s.localDate, s.localStart, s.start])).toEqual([
      ['2026-10-31', '09:00', '2026-10-31T16:00:00.000Z'], // PDT
      ['2026-11-01', '09:00', '2026-11-01T17:00:00.000Z'], // PST
      ['2026-11-02', '09:00', '2026-11-02T17:00:00.000Z'],
    ]);
  });

  it('skips the missing hour on a spring-forward day', () => {
    // US DST starts 2026-03-08: 02:00 local jumps to 03:00, so 01:00–04:00 is only 2 real hours
    const slots = computeSlots({
      timezone: 'America/New_York',
      startDate: '2026-03-08',
      endDate: '2026-03-08',
      rules: [rule({ dayOfWeek: 0, start: '01:00', end: '04:00' })],
      slotMinutes: 60,
      now: new Date('2026-03-01T00:00:00Z'),
    });
    expect(starts(slots)).toEqual(['01:00', '03:00']);
  });

  it('includes every day of a multi-day range', () => {
    const slots = computeSlots({
      timezone: 'UTC',
      startDate: '2026-06-08',
      endDate: '2026-06-14',
      rules: [0, 1, 2, 3, 4, 5, 6].map((d) => rule({ dayOfWeek: d, end: '10:00' })),
      slotMinutes: 60,
      now: NOW,
    });
    expect(slots.map((s) => s.localDate)).toEqual([
      '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14',
    ]);
  });

  it('rejects a non-positive slot length', () => {
    expect(() => slotsFor({ slotMinutes: 0 })).toThrow('slotMinutes must be positive');
  });
});

describe('resolveDay', () => {
  it('reports raw layers, ownership segments, and consolidated blocks', () => {
    const base = rule({ id: 'hours', start: '09:00', end: '17:00' });
    const lunch = rule({ id: 'lunch', type: 'daily', date: MONDAY, start: '12:00', end: '13:00', available: false, priority: 5 });
    const day = resolveDay({ date: MONDAY, timezone: 'UTC', rules: [base, lunch] });

    expect(day.layers.map((l) => l.source.id)).toEqual(['hours', 'lunch']);
    expect(day.segments.map((s) => [s.source.id, s.start.toISOString().slice(11, 16), s.end.toISOString().slice(11, 16)])).toEqual([
      ['hours', '09:00', '12:00'],
      ['lunch', '12:00', '13:00'],
      ['hours', '13:00', '17:00'],
    ]);
    expect(day.blocks).toHaveLength(3);
  });

  it('joins adjacent segments with equal settings into one block', () => {
    const day = resolveDay({
      date: MONDAY,
      timezone: 'UTC',
      rules: [rule({ start: '09:00', end: '12:00' }), rule({ start: '12:00', end: '14:00', priority: 2 })],
    });
    expect(day.segments).toHaveLength(2);
    expect(day.blocks).toHaveLength(1);
    expect(day.blocks[0].end.toISOString()).toBe('2026-06-08T14:00:00.000Z');
  });

  it('breaks priority ties in favour of the earlier-listed layer', () => {
    const day = resolveDay({
      date: MONDAY,
      timezone: 'UTC',
      rules: [rule({ id: 'first', capacity: 1 }), rule({ id: 'second', capacity: 5 })],
    });
    expect(day.segments.map((s) => s.source.id)).toEqual(['first']);
  });
});

describe('checkSlot', () => {
  const at = (iso: string) => new Date(iso);
  const base = { timezone: 'UTC', rules: [rule()], overlapping: 0, now: NOW };

  it('accepts a slot inside working hours with free capacity', () => {
    expect(checkSlot({ ...base, start: at('2026-06-08T09:00:00Z'), end: at('2026-06-08T10:00:00Z') })).toEqual({
      available: true,
      capacity: 1,
      overlapping: 0,
    });
  });

  it('rejects a slot in the past', () => {
    expect(checkSlot({ ...base, start: at('2026-05-01T09:00:00Z'), end: at('2026-05-01T10:00:00Z') })).toEqual({
      available: false,
      reason: 'past',
    });
  });

  it('rejects a slot that runs past closing time', () => {
    const res = checkSlot({ ...base, start: at('2026-06-08T11:30:00Z'), end: at('2026-06-08T12:30:00Z') });
    expect(res).toMatchObject({ available: false, reason: 'outside-hours' });
  });

  it('rejects a slot at capacity', () => {
    const res = checkSlot({
      ...base,
      rules: [rule({ capacity: 2 })],
      overlapping: 2,
      start: at('2026-06-08T09:00:00Z'),
      end: at('2026-06-08T10:00:00Z'),
    });
    expect(res).toEqual({ available: false, reason: 'full', capacity: 2, overlapping: 2 });
  });

  it('matches an evening slot to its local date, not its UTC date', () => {
    // 17:00 PDT Monday = 00:00 UTC Tuesday; the window is dated Monday
    const res = checkSlot({
      ...base,
      timezone: 'America/Los_Angeles',
      rules: [],
      windows: [window({ start: '16:00', end: '19:00', capacity: 4 })],
      start: at('2026-06-09T00:00:00Z'),
      end: at('2026-06-09T01:00:00Z'),
    });
    expect(res).toEqual({ available: true, capacity: 4, overlapping: 0 });
  });
});
