import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../models/Storefront', () => ({ StorefrontModel: { findById: vi.fn() } }));
vi.mock('../../models/Service', () => ({ ServiceModel: { findById: vi.fn() } }));
vi.mock('../../models/ScheduleRule', () => ({ ScheduleRuleModel: { findByDateRange: vi.fn() } }));
vi.mock('../../models/Drop', () => ({ DropModel: { findActiveByDateRange: vi.fn() } }));
vi.mock('../../models/Appointment', () => ({
  AppointmentModel: { findActiveInRange: vi.fn(), countOverlappingAppointments: vi.fn() },
}));

import { AvailabilityService } from '../AvailabilityService';
import { StorefrontModel } from '../../models/Storefront';
import { ServiceModel } from '../../models/Service';
import { ScheduleRuleModel } from '../../models/ScheduleRule';
import { DropModel } from '../../models/Drop';
import { AppointmentModel } from '../../models/Appointment';
import { makeStorefront, makeService, makeRule, makeDrop, makeBooking } from './fixtures';

// 2026-06-08 is a Monday (day_of_week = 1)
const MONDAY = '2026-06-08';

function setup({
  storefront = makeStorefront(),
  service = makeService(),
  rules = [makeRule()],
  drops = [] as ReturnType<typeof makeDrop>[],
  bookings = [] as ReturnType<typeof makeBooking>[],
  overlapping = 0,
} = {}) {
  vi.mocked(StorefrontModel.findById).mockResolvedValue(storefront);
  vi.mocked(ServiceModel.findById).mockResolvedValue(service);
  vi.mocked(ScheduleRuleModel.findByDateRange).mockResolvedValue(rules);
  vi.mocked(DropModel.findActiveByDateRange).mockResolvedValue(drops);
  vi.mocked(AppointmentModel.findActiveInRange).mockResolvedValue(bookings as never);
  vi.mocked(AppointmentModel.countOverlappingAppointments).mockResolvedValue(overlapping);
}

const startTimes = (slots: { local_start_time: string }[]) => slots.map((s) => s.local_start_time);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AvailabilityService.getAvailableSlots', () => {
  it('generates back-to-back slots from a weekly rule', async () => {
    setup();
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);

    expect(startTimes(res.slots)).toEqual(['09:00', '10:00', '11:00']);
    expect(res.slots[0]).toMatchObject({
      start_datetime: '2026-06-08T09:00:00.000Z',
      end_datetime: '2026-06-08T10:00:00.000Z',
      local_date: MONDAY,
      available_capacity: 1,
    });
  });

  it('spaces slots by duration plus buffer, but displays only the service duration', async () => {
    setup({ service: makeService({ duration_minutes: 60, buffer_time_minutes: 15 }) });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);

    // 09:00-10:15, 10:15-11:30; 11:30-12:45 would overrun the 12:00 close
    expect(startTimes(res.slots)).toEqual(['09:00', '10:15']);
    expect(res.slots[0].local_end_time).toBe('10:00');
    expect(res.slots[0].end_datetime).toBe('2026-06-08T10:15:00.000Z');
  });

  it('produces no slots on days without a matching rule', async () => {
    setup({ rules: [makeRule({ day_of_week: 2 })] }); // Tuesday only
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(res.slots).toEqual([]);
  });

  it('lets a higher-priority daily closure carve out part of a weekly rule', async () => {
    setup({
      rules: [
        makeRule({ priority: 1 }),
        makeRule({
          rule_type: 'daily',
          day_of_week: null,
          specific_date: MONDAY,
          start_time: '10:00:00',
          end_time: '11:00:00',
          is_available: false,
          priority: 10,
        }),
      ],
    });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(startTimes(res.slots)).toEqual(['09:00', '11:00']);
  });

  it('applies monthly rules only to the matching month and year', async () => {
    setup({
      rules: [
        makeRule({ rule_type: 'monthly', day_of_week: null, month: 6, year: 2026 }),
        makeRule({ rule_type: 'monthly', day_of_week: null, month: 6, year: 2025, start_time: '14:00:00', end_time: '15:00:00' }),
      ],
    });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(startTimes(res.slots)).toEqual(['09:00', '10:00', '11:00']);
  });

  it('adds drop windows with their own capacity', async () => {
    setup({ drops: [makeDrop({ max_concurrent_appointments: 3 })] });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);

    expect(startTimes(res.slots)).toEqual(['09:00', '10:00', '11:00', '13:00', '14:00']);
    expect(res.slots[res.slots.length - 1].available_capacity).toBe(3);
  });

  it('lets a drop override a full-day closure', async () => {
    setup({
      rules: [
        makeRule({
          rule_type: 'daily',
          day_of_week: null,
          specific_date: MONDAY,
          start_time: '00:00:00',
          end_time: '23:59:00',
          is_available: false,
          priority: 50,
        }),
      ],
      drops: [makeDrop({ start_time: '10:00:00', end_time: '12:00:00' })],
    });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(startTimes(res.slots)).toEqual(['10:00', '11:00']);
  });

  it('ignores drops linked to a different service', async () => {
    setup({ rules: [], drops: [makeDrop({ service_id: 99 })] });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(res.slots).toEqual([]);
  });

  it('reduces capacity for overlapping bookings and hides full slots', async () => {
    setup({
      rules: [makeRule({ max_concurrent_appointments: 2 })],
      bookings: [
        makeBooking('2026-06-08T09:00:00Z', '2026-06-08T10:00:00Z'),
        makeBooking('2026-06-08T09:00:00Z', '2026-06-08T10:00:00Z'),
        makeBooking('2026-06-08T10:30:00Z', '2026-06-08T11:00:00Z'),
      ],
    });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);

    expect(res.slots.map((s) => [s.local_start_time, s.available_capacity])).toEqual([
      ['10:00', 1],
      ['11:00', 2],
    ]);
  });

  it('excludes slots that have already started', async () => {
    vi.setSystemTime(new Date('2026-06-08T10:30:00Z'));
    setup();
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(startTimes(res.slots)).toEqual(['11:00']);
  });

  it('interprets rule times in the storefront timezone', async () => {
    setup({ storefront: makeStorefront({ timezone: 'America/Los_Angeles' }) });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);

    expect(startTimes(res.slots)).toEqual(['09:00', '10:00', '11:00']);
    expect(res.slots[0].start_datetime).toBe('2026-06-08T16:00:00.000Z'); // PDT = UTC-7
    expect(res.slots[0].local_date).toBe(MONDAY);
  });

  it('counts evening bookings that fall on the next UTC day', async () => {
    // 17:00 PDT on Monday is 00:00 UTC on Tuesday
    setup({
      storefront: makeStorefront({ timezone: 'America/Los_Angeles' }),
      rules: [makeRule({ start_time: '16:00:00', end_time: '19:00:00' })],
      bookings: [makeBooking('2026-06-09T00:00:00Z', '2026-06-09T01:00:00Z')],
    });
    const res = await AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY);
    expect(startTimes(res.slots)).toEqual(['16:00', '18:00']);
  });

  it('returns exactly one set of slots per local day across a DST change', async () => {
    // US DST ends 2026-11-01 at 02:00 local
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    setup({
      storefront: makeStorefront({ timezone: 'America/Los_Angeles' }),
      rules: [0, 1, 6].map((day) => makeRule({ day_of_week: day, start_time: '09:00:00', end_time: '10:00:00' })),
    });
    const res = await AvailabilityService.getAvailableSlots(1, 7, '2026-10-31', '2026-11-02');

    expect(res.slots.map((s) => [s.local_date, s.local_start_time, s.start_datetime])).toEqual([
      ['2026-10-31', '09:00', '2026-10-31T16:00:00.000Z'], // PDT
      ['2026-11-01', '09:00', '2026-11-01T17:00:00.000Z'], // PST
      ['2026-11-02', '09:00', '2026-11-02T17:00:00.000Z'],
    ]);
  });

  it('includes every day of a multi-day range', async () => {
    setup({ rules: [0, 1, 2, 3, 4, 5, 6].map((day) => makeRule({ day_of_week: day, end_time: '10:00:00' })) });
    const res = await AvailabilityService.getAvailableSlots(1, 7, '2026-06-08', '2026-06-14');
    expect(res.slots.map((s) => s.local_date)).toEqual([
      '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14',
    ]);
  });

  describe('validation', () => {
    it('rejects ranges longer than 31 days', async () => {
      setup();
      await expect(AvailabilityService.getAvailableSlots(1, 7, '2026-06-01', '2026-07-15')).rejects.toThrow(
        'Date range cannot exceed 31 days'
      );
    });

    it('rejects a start date after the end date', async () => {
      setup();
      await expect(AvailabilityService.getAvailableSlots(1, 7, '2026-06-10', '2026-06-08')).rejects.toThrow(
        'Start date must be before or equal to end date'
      );
    });

    it('rejects a service from another storefront', async () => {
      setup({ service: makeService({ storefront_id: 2 }) });
      await expect(AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY)).rejects.toThrow(
        'Service does not belong to this storefront'
      );
    });

    it('rejects an inactive service', async () => {
      setup({ service: makeService({ is_active: false }) });
      await expect(AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY)).rejects.toThrow(
        'Service is not active'
      );
    });

    it('rejects an unknown storefront', async () => {
      setup();
      vi.mocked(StorefrontModel.findById).mockResolvedValue(null);
      await expect(AvailabilityService.getAvailableSlots(1, 7, MONDAY, MONDAY)).rejects.toThrow(
        'Storefront not found'
      );
    });
  });
});

describe('AvailabilityService.isSlotAvailable', () => {
  const at = (iso: string) => new Date(iso);

  it('accepts a slot inside working hours with free capacity', async () => {
    setup();
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-06-08T09:00:00Z'), at('2026-06-08T10:00:00Z'));
    expect(res).toEqual({ available: true, currentBookings: 0, maxConcurrent: 1 });
  });

  it('rejects a slot in the past', async () => {
    setup();
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-05-01T09:00:00Z'), at('2026-05-01T10:00:00Z'));
    expect(res).toMatchObject({ available: false, reason: 'Cannot book slots in the past' });
  });

  it('rejects a slot that runs past closing time', async () => {
    setup();
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-06-08T11:30:00Z'), at('2026-06-08T12:30:00Z'));
    expect(res).toMatchObject({ available: false, reason: 'Slot is outside working hours' });
  });

  it('rejects a slot inside a closure', async () => {
    setup({
      rules: [
        makeRule(),
        makeRule({ rule_type: 'daily', day_of_week: null, specific_date: MONDAY, is_available: false, priority: 10 }),
      ],
    });
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-06-08T09:00:00Z'), at('2026-06-08T10:00:00Z'));
    expect(res).toMatchObject({ available: false, reason: 'Slot is outside working hours' });
  });

  it('rejects a slot at maximum concurrency', async () => {
    setup({ rules: [makeRule({ max_concurrent_appointments: 2 })], overlapping: 2 });
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-06-08T09:00:00Z'), at('2026-06-08T10:00:00Z'));
    expect(res).toEqual({
      available: false,
      reason: 'Maximum concurrent bookings reached',
      currentBookings: 2,
      maxConcurrent: 2,
    });
  });

  it('accepts a slot inside a drop window', async () => {
    setup({ rules: [], drops: [makeDrop({ max_concurrent_appointments: 4 })] });
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-06-08T13:00:00Z'), at('2026-06-08T14:00:00Z'));
    expect(res).toEqual({ available: true, currentBookings: 0, maxConcurrent: 4 });
  });

  it('matches an early-morning slot to the correct local day', async () => {
    // 06:00 PDT Monday = 13:00 UTC Monday
    setup({
      storefront: makeStorefront({ timezone: 'America/Los_Angeles' }),
      rules: [makeRule({ start_time: '06:00:00', end_time: '08:00:00' })],
    });
    const res = await AvailabilityService.isSlotAvailable(1, 7, at('2026-06-08T13:00:00Z'), at('2026-06-08T14:00:00Z'));
    expect(res.available).toBe(true);
  });

  it('queries drops and daily rules for the local date of an evening slot', async () => {
    // 17:00 PDT Monday = 00:00 UTC Tuesday; the drop is dated Monday
    setup({
      storefront: makeStorefront({ timezone: 'America/Los_Angeles' }),
      rules: [],
      drops: [makeDrop({ drop_date: MONDAY, start_time: '16:00:00', end_time: '19:00:00' })],
    });
    const start = at('2026-06-09T00:00:00Z');
    const res = await AvailabilityService.isSlotAvailable(1, 7, start, at('2026-06-09T01:00:00Z'));
    expect(res.available).toBe(true);

    // The date-cast query range must include Monday (local) as well as Tuesday (UTC)
    const [, from, to] = vi.mocked(DropModel.findActiveByDateRange).mock.calls[0];
    expect(from.getTime()).toBeLessThanOrEqual(at('2026-06-08T00:00:00Z').getTime());
    expect(to.getTime()).toBeGreaterThanOrEqual(start.getTime());
  });
});
