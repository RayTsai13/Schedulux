import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const dbClient = { query: vi.fn(), release: vi.fn() };

vi.mock('../../config/database', () => ({
  getClient: vi.fn(async () => dbClient),
}));
vi.mock('../../models/Storefront', () => ({ StorefrontModel: { findById: vi.fn() } }));
vi.mock('../../models/Service', () => ({ ServiceModel: { findById: vi.fn() } }));
vi.mock('../../models/User', () => ({ UserModel: { findById: vi.fn() } }));
vi.mock('../../models/Appointment', () => ({
  AppointmentModel: {
    findById: vi.fn(),
    findByManageToken: vi.fn(),
    updateStatus: vi.fn(),
    updateStatusWithClient: vi.fn(),
    createWithClient: vi.fn(),
    countOverlappingAppointmentsWithClient: vi.fn(),
  },
}));
vi.mock('../EmailService', () => ({
  EmailService: {
    sendAppointmentConfirmation: vi.fn(),
    sendNewBookingNotification: vi.fn(),
    sendAppointmentStatusChange: vi.fn(),
  },
}));
vi.mock('../AvailabilityService', () => ({
  AvailabilityService: { loadSlotContext: vi.fn(), evaluateSlot: vi.fn() },
}));
vi.mock('../DropService', () => ({ DropService: { notifyWaitlist: vi.fn() } }));
vi.mock('../../models/Drop', () => ({ DropModel: { findById: vi.fn() } }));

import { AppointmentService } from '../AppointmentService';
import { StorefrontModel } from '../../models/Storefront';
import { ServiceModel } from '../../models/Service';
import { UserModel } from '../../models/User';
import { AppointmentModel } from '../../models/Appointment';
import { AvailabilityService } from '../AvailabilityService';
import { DropService } from '../DropService';
import { EmailService } from '../EmailService';
import { DropModel } from '../../models/Drop';
import { makeStorefront, makeService, makeAppointment, makeDrop } from './fixtures';

const VENDOR_ID = 100;
const STRANGER_ID = 300;
const GUEST = { name: 'Sam Lee', email: 'sam@example.com', phone: '555-0100' };
const TOKEN = 'a'.repeat(64);
const LOCK_SQL = 'SELECT pg_advisory_xact_lock($1, $2)';

/** Let fire-and-forget promise chains settle */
const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
  dbClient.query.mockReset().mockResolvedValue({ rows: [] });
  dbClient.release.mockReset();
  vi.mocked(StorefrontModel.findById).mockResolvedValue(makeStorefront({ vendor_id: VENDOR_ID }));
  vi.mocked(ServiceModel.findById).mockResolvedValue(makeService({ duration_minutes: 45, buffer_time_minutes: 15 }));
});

afterEach(() => {
  vi.useRealTimers();
});

const queries = () => dbClient.query.mock.calls.map(([sql]) => sql as string);

const CONTEXT = { timezone: 'UTC', rules: [], windows: [] };

/** Availability as judged inside the lock */
function slotIs(result: { available: boolean; reason?: string }) {
  vi.mocked(AvailabilityService.evaluateSlot).mockReturnValue(result);
}

beforeEach(() => {
  vi.mocked(AvailabilityService.loadSlotContext).mockResolvedValue(CONTEXT);
  vi.mocked(AppointmentModel.countOverlappingAppointmentsWithClient).mockResolvedValue(0);
  slotIs({ available: true });
});

describe('AppointmentService.updateStatus', () => {
  function withAppointment(status: string, overrides = {}) {
    const appointment = makeAppointment({ status: status as never, ...overrides });
    vi.mocked(AppointmentModel.findById).mockResolvedValue(appointment);
    vi.mocked(AppointmentModel.updateStatus).mockImplementation(async (_id, newStatus) => ({
      ...appointment,
      status: newStatus as never,
    }));
  }

  it.each([
    ['pending', 'confirmed'],
    ['pending', 'declined'],
    ['pending', 'cancelled'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'completed'],
    ['confirmed', 'no_show'],
  ] as const)('lets the vendor move %s → %s', async (from, to) => {
    withAppointment(from);
    const updated = await AppointmentService.updateStatus(500, VENDOR_ID, to);
    expect(updated.status).toBe(to);
    expect(AppointmentModel.updateStatus).toHaveBeenCalledWith(500, to, undefined);
  });

  it.each([
    ['pending', 'completed'],
    ['confirmed', 'confirmed'],
    ['confirmed', 'declined'],
    ['cancelled', 'confirmed'],
    ['declined', 'confirmed'],
    ['completed', 'cancelled'],
    ['no_show', 'completed'],
  ] as const)('rejects %s → %s', async (from, to) => {
    withAppointment(from);
    await expect(AppointmentService.updateStatus(500, VENDOR_ID, to)).rejects.toThrow(
      `Cannot transition from '${from}' to '${to}'`
    );
    expect(AppointmentModel.updateStatus).not.toHaveBeenCalled();
  });

  it('rejects anyone but the owning vendor', async () => {
    withAppointment('pending');
    await expect(AppointmentService.updateStatus(500, STRANGER_ID, 'cancelled')).rejects.toThrow('Forbidden');
  });

  it('emails the guest and frees the drop waitlist when the vendor cancels a drop booking', async () => {
    withAppointment('confirmed', { drop_id: 42 });
    await AppointmentService.updateStatus(500, VENDOR_ID, 'cancelled');
    await flush();
    expect(DropService.notifyWaitlist).toHaveBeenCalledWith(42);
    expect(EmailService.sendAppointmentStatusChange).toHaveBeenCalledWith(
      'sam@example.com',
      expect.objectContaining({ newStatus: 'cancelled', manageToken: TOKEN })
    );
  });

  it('reports a missing appointment', async () => {
    vi.mocked(AppointmentModel.findById).mockResolvedValue(null);
    await expect(AppointmentService.updateStatus(500, VENDOR_ID, 'confirmed')).rejects.toThrow(
      'Appointment not found'
    );
  });
});

describe('AppointmentService.createAppointment', () => {
  const START = '2026-06-08T09:00:00Z';

  beforeEach(() => {
    vi.mocked(UserModel.findById).mockResolvedValue({ id: VENDOR_ID, email: 'vendor@example.com' } as never);
    vi.mocked(AppointmentModel.createWithClient).mockImplementation(async (_client, data) =>
      makeAppointment({ ...data, id: 900 } as never)
    );
  });

  it('books inside a transaction after taking the storefront lock', async () => {
    const appointment = await AppointmentService.createAppointment(GUEST, 1, 7, START);

    expect(appointment.id).toBe(900);
    expect(queries()).toEqual(['BEGIN', LOCK_SQL, 'COMMIT']);

    // Rules load before the lock; capacity is re-counted on the transaction's
    // own connection while holding it, for duration + buffer
    const loadOrder = vi.mocked(AvailabilityService.loadSlotContext).mock.invocationCallOrder[0];
    const lockOrder = dbClient.query.mock.invocationCallOrder[1];
    const countOrder = vi.mocked(AppointmentModel.countOverlappingAppointmentsWithClient).mock.invocationCallOrder[0];
    const insertOrder = vi.mocked(AppointmentModel.createWithClient).mock.invocationCallOrder[0];
    expect(loadOrder).toBeLessThan(lockOrder);
    expect(lockOrder).toBeLessThan(countOrder);
    expect(countOrder).toBeLessThan(insertOrder);
    expect(AppointmentModel.countOverlappingAppointmentsWithClient).toHaveBeenCalledWith(
      dbClient, 1, new Date(START), new Date('2026-06-08T10:00:00Z'), null
    );
    expect(AvailabilityService.evaluateSlot).toHaveBeenCalledWith(
      CONTEXT, new Date(START), new Date('2026-06-08T10:00:00Z'), 0
    );
    expect(dbClient.release).toHaveBeenCalledOnce();
  });

  it('stores guest details and a fresh 64-char hex manage token', async () => {
    await AppointmentService.createAppointment(GUEST, 1, 7, START);
    await AppointmentService.createAppointment(GUEST, 1, 7, START);

    const [first, second] = vi.mocked(AppointmentModel.createWithClient).mock.calls.map(([, data]) => data);
    expect(first).toMatchObject({
      guest_name: 'Sam Lee',
      guest_email: 'sam@example.com',
      guest_phone: '555-0100',
      status: 'pending',
      price_quoted: 40,
    });
    expect(first.manage_token).toMatch(/^[0-9a-f]{64}$/);
    expect(second.manage_token).not.toBe(first.manage_token);
  });

  it('locks the whole storefront, so overlapping slots at different times serialize', async () => {
    await AppointmentService.createAppointment(GUEST, 1, 7, START);
    await AppointmentService.createAppointment(GUEST, 1, 7, '2026-06-08T09:30:00Z');

    const lockParams = dbClient.query.mock.calls.filter(([sql]) => sql === LOCK_SQL).map(([, params]) => params);
    expect(lockParams).toHaveLength(2);
    expect(lockParams[0]).toEqual(lockParams[1]);
    expect(lockParams[0][1]).toBe(1);
  });

  it('rolls back without inserting when the slot is taken', async () => {
    slotIs({ available: false, reason: 'Maximum concurrent bookings reached' });

    await expect(AppointmentService.createAppointment(GUEST, 1, 7, START)).rejects.toThrow(
      'Maximum concurrent bookings reached'
    );
    expect(queries()).toEqual(['BEGIN', LOCK_SQL, 'ROLLBACK']);
    expect(AppointmentModel.createWithClient).not.toHaveBeenCalled();
    expect(dbClient.release).toHaveBeenCalledOnce();
    expect(EmailService.sendAppointmentConfirmation).not.toHaveBeenCalled();
  });

  it('emails the guest their manage link and notifies the vendor', async () => {
    const appointment = await AppointmentService.createAppointment(GUEST, 1, 7, START);
    await flush();
    expect(EmailService.sendAppointmentConfirmation).toHaveBeenCalledWith(
      'sam@example.com',
      expect.objectContaining({ serviceName: 'Haircut', manageToken: appointment.manage_token })
    );
    expect(EmailService.sendNewBookingNotification).toHaveBeenCalledWith(
      'vendor@example.com',
      expect.objectContaining({ clientName: 'Sam Lee' })
    );
  });

  it('fails before taking a connection when the slot is outside hours', async () => {
    vi.mocked(AvailabilityService.loadSlotContext).mockResolvedValue({
      available: false,
      reason: 'Service not found or inactive',
    });
    await expect(AppointmentService.createAppointment(GUEST, 1, 7, START)).rejects.toThrow('Service not found or inactive');
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  it('rejects bookings in the past', async () => {
    await expect(AppointmentService.createAppointment(GUEST, 1, 7, '2026-05-01T09:00:00Z')).rejects.toThrow(
      'Cannot book appointments in the past'
    );
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  it('rejects a service from another storefront', async () => {
    vi.mocked(ServiceModel.findById).mockResolvedValue(makeService({ storefront_id: 2 }));
    await expect(AppointmentService.createAppointment(GUEST, 1, 7, START)).rejects.toThrow(
      'Service does not belong to this storefront'
    );
  });

  it('rejects an inactive storefront', async () => {
    vi.mocked(StorefrontModel.findById).mockResolvedValue(makeStorefront({ is_active: false }));
    await expect(AppointmentService.createAppointment(GUEST, 1, 7, START)).rejects.toThrow('Storefront not found');
  });
});

describe('AppointmentService manage-token actions', () => {
  it('returns the booking without internal fields', async () => {
    vi.mocked(AppointmentModel.findByManageToken).mockResolvedValue(
      makeAppointment({ internal_notes: 'secret', client_id: 7, service_name: 'Haircut' })
    );
    const booking = await AppointmentService.getByManageToken(TOKEN);
    expect(booking).toMatchObject({ id: 500, guest_email: 'sam@example.com', service_name: 'Haircut' });
    expect(booking).not.toHaveProperty('internal_notes');
    expect(booking).not.toHaveProperty('client_id');
  });

  it('treats an unknown token as not found', async () => {
    vi.mocked(AppointmentModel.findByManageToken).mockResolvedValue(null);
    await expect(AppointmentService.getByManageToken(TOKEN)).rejects.toThrow('Appointment not found');
    await expect(AppointmentService.cancelByManageToken(TOKEN)).rejects.toThrow('Appointment not found');
    await expect(AppointmentService.rescheduleByManageToken(TOKEN, '2026-06-09T09:00:00Z')).rejects.toThrow(
      'Appointment not found'
    );
  });

  it('cancels and frees the drop waitlist', async () => {
    const appointment = makeAppointment({ status: 'confirmed', drop_id: 42 });
    vi.mocked(AppointmentModel.findByManageToken).mockResolvedValue(appointment);
    vi.mocked(AppointmentModel.updateStatus).mockResolvedValue({ ...appointment, status: 'cancelled' });

    const result = await AppointmentService.cancelByManageToken(TOKEN);
    expect(result.status).toBe('cancelled');
    expect(DropService.notifyWaitlist).toHaveBeenCalledWith(42);
  });

  it.each(['cancelled', 'completed', 'declined'] as const)('refuses to cancel a %s booking', async (status) => {
    vi.mocked(AppointmentModel.findByManageToken).mockResolvedValue(makeAppointment({ status }));
    await expect(AppointmentService.cancelByManageToken(TOKEN)).rejects.toThrow('Cannot transition');
  });

  describe('reschedule', () => {
    const NEW_START = '2026-06-09T09:00:00Z';

    beforeEach(() => {
      vi.mocked(AppointmentModel.findByManageToken).mockResolvedValue(
        makeAppointment({ status: 'confirmed', service_name: 'Haircut' })
      );
      // Rows as stored: updates return the latest version of the row they touch
      const rows = new Map<number, ReturnType<typeof makeAppointment>>([[500, makeAppointment({ status: 'confirmed' })]]);
      vi.mocked(AppointmentModel.updateStatusWithClient).mockImplementation(async (_c, id, status) => {
        rows.set(id, { ...rows.get(id)!, status: status as never });
        return rows.get(id)!;
      });
      vi.mocked(AppointmentModel.createWithClient).mockImplementation(async (_client, data) => {
        rows.set(901, makeAppointment({ ...data, id: 901 } as never));
        return rows.get(901)!;
      });
    });

    it('cancels and rebooks atomically under the storefront lock with a new token', async () => {
      const result = await AppointmentService.rescheduleByManageToken(TOKEN, NEW_START);

      expect(queries()).toEqual(['BEGIN', LOCK_SQL, 'COMMIT']);
      expect(result.cancelled.status).toBe('cancelled');
      expect(result.new.id).toBe(901);
      expect(result.new.manage_token).toMatch(/^[0-9a-f]{64}$/);
      expect(result.new.manage_token).not.toBe(TOKEN);
      expect(result.new.service_name).toBe('Haircut');
    });

    it('rolls back when the new slot is unavailable', async () => {
      slotIs({ available: false, reason: 'Slot is outside working hours' });

      await expect(AppointmentService.rescheduleByManageToken(TOKEN, NEW_START)).rejects.toThrow(
        'Slot is outside working hours'
      );
      expect(queries()).toEqual(['BEGIN', LOCK_SQL, 'ROLLBACK']);
      expect(AppointmentModel.createWithClient).not.toHaveBeenCalled();
    });

    it('keeps the drop link only when the new time is inside the drop window, and frees the drop otherwise', async () => {      vi.mocked(AppointmentModel.findByManageToken).mockResolvedValue(
        makeAppointment({ status: 'confirmed', drop_id: 42 })
      );
      // Drop runs 13:00-15:00 UTC on 06-08
      vi.mocked(DropModel.findById).mockResolvedValue(makeDrop({ id: 42, drop_date: '2026-06-08' }));

      const inside = await AppointmentService.rescheduleByManageToken(TOKEN, '2026-06-08T14:00:00Z');
      expect(inside.new.drop_id).toBe(42);
      expect(DropService.notifyWaitlist).not.toHaveBeenCalled();

      const outside = await AppointmentService.rescheduleByManageToken(TOKEN, '2026-06-09T09:00:00Z');
      expect(outside.new.drop_id).toBeNull();
      expect(DropService.notifyWaitlist).toHaveBeenCalledWith(42);
    });

    it('cancels the original before counting, so its own spot counts as free', async () => {
      await AppointmentService.rescheduleByManageToken(TOKEN, '2026-06-08T09:30:00Z');

      const cancelOrder = vi.mocked(AppointmentModel.updateStatusWithClient).mock.invocationCallOrder[0];
      const countOrder = vi.mocked(AppointmentModel.countOverlappingAppointmentsWithClient).mock.invocationCallOrder[0];
      expect(vi.mocked(AppointmentModel.updateStatusWithClient).mock.calls[0][2]).toBe('cancelled');
      expect(cancelOrder).toBeLessThan(countOrder);
      expect(vi.mocked(AppointmentModel.countOverlappingAppointmentsWithClient).mock.calls[0][0]).toBe(dbClient);
    });
  });
});
