import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../models/Drop', () => ({ DropModel: { findById: vi.fn(), findActiveByStorefrontId: vi.fn() } }));
vi.mock('../../models/DropWaitlist', () => ({
  DropWaitlistModel: { add: vi.fn(), claimUnnotified: vi.fn(), countByDropIds: vi.fn() },
}));
vi.mock('../../models/Storefront', () => ({ StorefrontModel: { findById: vi.fn() } }));
vi.mock('../../models/Service', () => ({ ServiceModel: { findActiveByStorefrontId: vi.fn() } }));
vi.mock('../../models/Appointment', () => ({ AppointmentModel: { findActiveInRange: vi.fn() } }));
vi.mock('../EmailService', () => ({
  EmailService: { sendWaitlistSpotOpened: vi.fn() },
  pageUrl: (slug: string, dropId?: number) => `https://example.test/@${slug}/drops/${dropId}`,
}));

import { DropService } from '../DropService';
import { DropModel } from '../../models/Drop';
import { DropWaitlistModel } from '../../models/DropWaitlist';
import { StorefrontModel } from '../../models/Storefront';
import { ServiceModel } from '../../models/Service';
import { AppointmentModel } from '../../models/Appointment';
import { EmailService } from '../EmailService';
import { makeStorefront, makeService, makeDrop, makeBooking } from './fixtures';

const MONDAY = '2026-06-08';
const storefront = makeStorefront();
const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
  vi.mocked(ServiceModel.findActiveByStorefrontId).mockResolvedValue([makeService({ duration_minutes: 60 })]);
  vi.mocked(AppointmentModel.findActiveInRange).mockResolvedValue([]);
  vi.mocked(StorefrontModel.findById).mockResolvedValue(storefront);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DropService.countSpots', () => {
  it('counts slots × capacity, and subtracts overlapping bookings', async () => {
    // 13:00-15:00 with 60-minute slots and capacity 3 → 2 slots × 3 = 6 spots
    const drop = makeDrop({ drop_date: MONDAY, max_concurrent_appointments: 3 });
    vi.mocked(AppointmentModel.findActiveInRange).mockResolvedValue([
      makeBooking('2026-06-08T13:00:00Z', '2026-06-08T14:00:00Z'),
      makeBooking('2026-06-08T13:00:00Z', '2026-06-08T14:00:00Z'),
      makeBooking('2026-06-08T14:00:00Z', '2026-06-08T15:00:00Z'),
    ] as never);

    const spots = await DropService.countSpots(storefront, [drop]);
    expect(spots.get(drop.id)).toEqual({ total_spots: 6, remaining_spots: 3 });
  });

  it("sizes slots by the drop's own service", async () => {
    vi.mocked(ServiceModel.findActiveByStorefrontId).mockResolvedValue([
      makeService({ id: 7, duration_minutes: 30 }),
      makeService({ id: 8, duration_minutes: 120 }),
    ]);
    const forLong = makeDrop({ drop_date: MONDAY, service_id: 8 });
    const forAll = makeDrop({ drop_date: MONDAY, service_id: null });

    const spots = await DropService.countSpots(storefront, [forLong, forAll]);
    expect(spots.get(forLong.id)?.total_spots).toBe(1); // one 2h slot in a 2h window
    expect(spots.get(forAll.id)?.total_spots).toBe(4); // shortest service: four 30m slots
  });

  it('loads bookings once for all drops', async () => {
    await DropService.countSpots(storefront, [makeDrop({ drop_date: MONDAY }), makeDrop({ drop_date: '2026-06-09' })]);
    expect(AppointmentModel.findActiveInRange).toHaveBeenCalledOnce();
  });

  it('reports zero spots when no matching service is active', async () => {
    const drop = makeDrop({ drop_date: MONDAY, service_id: 99 });
    const spots = await DropService.countSpots(storefront, [drop]);
    expect(spots.get(drop.id)).toEqual({ total_spots: 0, remaining_spots: 0 });
  });
});

describe('DropService.getPublicDrops', () => {
  it('hides drops that have already ended in the storefront timezone', async () => {
    vi.setSystemTime(new Date('2026-06-08T13:30:00Z'));
    const ended = makeDrop({ drop_date: MONDAY, start_time: '09:00:00', end_time: '10:00:00' });
    const running = makeDrop({ drop_date: MONDAY, start_time: '13:00:00', end_time: '15:00:00' });
    vi.mocked(DropModel.findActiveByStorefrontId).mockResolvedValue([ended, running]);

    const drops = await DropService.getPublicDrops(storefront);
    expect(drops.map((d) => d.id)).toEqual([running.id]);
    // Only the 14:00 slot is still in the future
    expect(drops[0]).toMatchObject({ total_spots: 2, remaining_spots: 1 });
  });
});

describe('DropService.joinWaitlist', () => {
  const drop = makeDrop({ drop_date: MONDAY, max_concurrent_appointments: 1 });

  beforeEach(() => {
    vi.mocked(DropModel.findById).mockResolvedValue(drop);
    vi.mocked(DropModel.findActiveByStorefrontId).mockResolvedValue([drop]);
  });

  it('adds the guest once the drop is sold out', async () => {
    vi.mocked(AppointmentModel.findActiveInRange).mockResolvedValue([
      makeBooking('2026-06-08T13:00:00Z', '2026-06-08T15:00:00Z'),
    ] as never);

    await DropService.joinWaitlist(drop.id, ' Ana ', 'Ana@Example.com ');
    expect(DropWaitlistModel.add).toHaveBeenCalledWith(drop.id, 'Ana', 'ana@example.com');
  });

  it('refuses while spots remain', async () => {
    await expect(DropService.joinWaitlist(drop.id, 'Ana', 'ana@example.com')).rejects.toThrow(
      'Drop still has open spots'
    );
    expect(DropWaitlistModel.add).not.toHaveBeenCalled();
  });

  it('refuses unpublished drops', async () => {
    vi.mocked(DropModel.findById).mockResolvedValue({ ...drop, is_published: false });
    await expect(DropService.joinWaitlist(drop.id, 'Ana', 'ana@example.com')).rejects.toThrow('Drop not found');
  });
});

describe('DropService.notifyWaitlist', () => {
  it('emails each newly claimed entry with a link to the drop', async () => {
    const drop = makeDrop({ title: 'Flash Day' });
    vi.mocked(DropModel.findById).mockResolvedValue(drop);
    vi.mocked(DropWaitlistModel.claimUnnotified).mockResolvedValue([
      { id: 1, drop_id: drop.id, name: 'Ana', email: 'ana@example.com', created_at: new Date(), notified_at: null },
      { id: 2, drop_id: drop.id, name: 'Bo', email: 'bo@example.com', created_at: new Date(), notified_at: null },
    ]);

    DropService.notifyWaitlist(drop.id);
    await flush();

    expect(EmailService.sendWaitlistSpotOpened).toHaveBeenCalledTimes(2);
    expect(EmailService.sendWaitlistSpotOpened).toHaveBeenCalledWith(
      'ana@example.com',
      expect.objectContaining({ dropTitle: 'Flash Day', dropUrl: `https://example.test/@test-storefront/drops/${drop.id}` })
    );
  });

  it('never throws, even when the lookup fails', async () => {
    vi.mocked(DropModel.findById).mockRejectedValue(new Error('db down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => DropService.notifyWaitlist(1)).not.toThrow();
    await flush();
    expect(spy).toHaveBeenCalled();
  });
});
