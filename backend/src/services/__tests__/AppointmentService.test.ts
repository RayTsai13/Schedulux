import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const dbClient = { query: vi.fn(), release: vi.fn() };

vi.mock('../../config/database', () => ({
  pool: {},
  getClient: vi.fn(async () => dbClient),
  withTransaction: vi.fn(),
}));
vi.mock('../../models/Storefront', () => ({ StorefrontModel: { findById: vi.fn() } }));
vi.mock('../../models/Service', () => ({ ServiceModel: { findById: vi.fn() } }));
vi.mock('../../models/User', () => ({ UserModel: { findById: vi.fn() } }));
vi.mock('../../models/Appointment', () => ({
  AppointmentModel: { findById: vi.fn(), updateStatus: vi.fn(), createWithClient: vi.fn() },
}));
vi.mock('../EmailService', () => ({
  EmailService: { sendAppointmentConfirmation: vi.fn(), sendNewBookingNotification: vi.fn() },
}));
vi.mock('../AvailabilityService', () => ({ AvailabilityService: { isSlotAvailable: vi.fn() } }));

import { AppointmentService } from '../AppointmentService';
import { StorefrontModel } from '../../models/Storefront';
import { ServiceModel } from '../../models/Service';
import { UserModel } from '../../models/User';
import { AppointmentModel } from '../../models/Appointment';
import { AvailabilityService } from '../AvailabilityService';
import { EmailService } from '../EmailService';
import { makeStorefront, makeService, makeAppointment } from './fixtures';

const VENDOR_ID = 100;
const CLIENT_ID = 200;
const STRANGER_ID = 300;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
  dbClient.query.mockReset().mockResolvedValue({ rows: [] });
  dbClient.release.mockReset();
  vi.mocked(StorefrontModel.findById).mockResolvedValue(makeStorefront({ vendor_id: VENDOR_ID }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AppointmentService.updateStatus', () => {
  function withAppointment(status: string) {
    const appointment = makeAppointment({ status: status as never, client_id: CLIENT_ID });
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

  it('lets the client cancel their own appointment', async () => {
    withAppointment('confirmed');
    const updated = await AppointmentService.updateStatus(500, CLIENT_ID, 'cancelled');
    expect(updated.status).toBe('cancelled');
  });

  it.each(['confirmed', 'declined'] as const)('stops the client from setting %s', async (to) => {
    withAppointment('pending');
    await expect(AppointmentService.updateStatus(500, CLIENT_ID, to)).rejects.toThrow(
      'Clients can only cancel appointments'
    );
  });

  it('rejects users who are neither the client nor the vendor', async () => {
    withAppointment('pending');
    await expect(AppointmentService.updateStatus(500, STRANGER_ID, 'cancelled')).rejects.toThrow('Forbidden');
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
    vi.mocked(ServiceModel.findById).mockResolvedValue(
      makeService({ duration_minutes: 45, buffer_time_minutes: 15 })
    );
    vi.mocked(UserModel.findById).mockImplementation(async (id) =>
      ({ id, email: `user${id}@example.com`, first_name: 'Sam', last_name: 'Lee' }) as never
    );
    vi.mocked(AvailabilityService.isSlotAvailable).mockResolvedValue({ available: true });
    vi.mocked(AppointmentModel.createWithClient).mockImplementation(async (_client, data) =>
      makeAppointment({ ...data, id: 900 } as never)
    );
  });

  const queries = () => dbClient.query.mock.calls.map(([sql]) => sql as string);

  it('books inside a transaction after taking the advisory lock', async () => {
    const appointment = await AppointmentService.createAppointment(CLIENT_ID, 1, 7, START);

    expect(appointment.id).toBe(900);
    expect(queries()).toEqual(['BEGIN', 'SELECT pg_advisory_xact_lock($1)', 'COMMIT']);

    // Availability is re-checked while holding the lock, for duration + buffer
    const lockOrder = dbClient.query.mock.invocationCallOrder[1];
    const checkOrder = vi.mocked(AvailabilityService.isSlotAvailable).mock.invocationCallOrder[0];
    const insertOrder = vi.mocked(AppointmentModel.createWithClient).mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(checkOrder);
    expect(checkOrder).toBeLessThan(insertOrder);
    expect(AvailabilityService.isSlotAvailable).toHaveBeenCalledWith(
      1, 7, new Date(START), new Date('2026-06-08T10:00:00Z')
    );

    expect(AppointmentModel.createWithClient).toHaveBeenCalledWith(
      dbClient,
      expect.objectContaining({ client_id: CLIENT_ID, status: 'pending', price_quoted: 40 })
    );
    expect(dbClient.release).toHaveBeenCalledOnce();
  });

  it('uses the same lock key for the same slot and a different one for another slot', async () => {
    await AppointmentService.createAppointment(CLIENT_ID, 1, 7, START);
    await AppointmentService.createAppointment(CLIENT_ID, 1, 7, START);
    await AppointmentService.createAppointment(CLIENT_ID, 1, 7, '2026-06-08T11:00:00Z');

    const keys = dbClient.query.mock.calls
      .filter(([sql]) => sql === 'SELECT pg_advisory_xact_lock($1)')
      .map(([, params]) => params[0]);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('rolls back without inserting when the slot is taken', async () => {
    vi.mocked(AvailabilityService.isSlotAvailable).mockResolvedValue({
      available: false,
      reason: 'Maximum concurrent bookings reached',
    });

    await expect(AppointmentService.createAppointment(CLIENT_ID, 1, 7, START)).rejects.toThrow(
      'Maximum concurrent bookings reached'
    );
    expect(queries()).toEqual(['BEGIN', 'SELECT pg_advisory_xact_lock($1)', 'ROLLBACK']);
    expect(AppointmentModel.createWithClient).not.toHaveBeenCalled();
    expect(dbClient.release).toHaveBeenCalledOnce();
    expect(EmailService.sendAppointmentConfirmation).not.toHaveBeenCalled();
  });

  it('sends confirmation and vendor emails after booking', async () => {
    await AppointmentService.createAppointment(CLIENT_ID, 1, 7, START);
    expect(EmailService.sendAppointmentConfirmation).toHaveBeenCalledWith(
      `user${CLIENT_ID}@example.com`,
      expect.objectContaining({ serviceName: 'Haircut' })
    );
    expect(EmailService.sendNewBookingNotification).toHaveBeenCalledWith(
      `user${VENDOR_ID}@example.com`,
      expect.objectContaining({ clientName: 'Sam Lee' })
    );
  });

  it('rejects bookings in the past', async () => {
    await expect(AppointmentService.createAppointment(CLIENT_ID, 1, 7, '2026-05-01T09:00:00Z')).rejects.toThrow(
      'Cannot book appointments in the past'
    );
    expect(dbClient.query).not.toHaveBeenCalled();
  });

  it('rejects a service from another storefront', async () => {
    vi.mocked(ServiceModel.findById).mockResolvedValue(makeService({ storefront_id: 2 }));
    await expect(AppointmentService.createAppointment(CLIENT_ID, 1, 7, START)).rejects.toThrow(
      'Service does not belong to this storefront'
    );
  });

  it('requires an address for at-client bookings with mobile vendors', async () => {
    vi.mocked(StorefrontModel.findById).mockResolvedValue(makeStorefront({ location_type: 'mobile' }));
    await expect(
      AppointmentService.createAppointment(CLIENT_ID, 1, 7, START, undefined, 'at_client', '  ')
    ).rejects.toThrow('Client address is required for at-client appointments');
  });

  it('stores the address for at-client bookings with mobile vendors', async () => {
    vi.mocked(StorefrontModel.findById).mockResolvedValue(makeStorefront({ location_type: 'mobile' }));
    await AppointmentService.createAppointment(CLIENT_ID, 1, 7, START, undefined, 'at_client', '1 Main St');
    expect(AppointmentModel.createWithClient).toHaveBeenCalledWith(
      dbClient,
      expect.objectContaining({ service_location_type: 'at_client', client_address: '1 Main St' })
    );
  });

  it('forces at-vendor and drops the address for fixed-location storefronts', async () => {
    await AppointmentService.createAppointment(CLIENT_ID, 1, 7, START, undefined, 'at_client', '1 Main St');
    expect(AppointmentModel.createWithClient).toHaveBeenCalledWith(
      dbClient,
      expect.objectContaining({ service_location_type: 'at_vendor', client_address: undefined })
    );
  });
});
