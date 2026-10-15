/**
 * AppointmentService - Handle appointment booking with race condition prevention
 *
 * This service manages appointment lifecycle:
 * - Guest bookings with atomic availability checking
 * - Token-based self-service (view, cancel, reschedule) for guests
 * - Status transitions and approval workflow for vendors
 */

import { randomBytes } from 'crypto';
import { addMinutes, parseISO, isBefore } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { PoolClient } from 'pg';

import { getClient } from '../config/database';
import { localToUtc, parseClock } from '@schedulux/availability-engine';
import { AppointmentModel } from '../models/Appointment';
import { DropModel } from '../models/Drop';
import { StorefrontModel } from '../models/Storefront';
import { ServiceModel } from '../models/Service';
import { UserModel } from '../models/User';
import { AvailabilityService } from './AvailabilityService';
import { DropService } from './DropService';
import { EmailService } from './EmailService';
import { Appointment, Service, Storefront, GuestDetails, ManagedAppointment } from '../types';
import { AppointmentQueryOptions } from '../types/availability';
import { toDateStr } from '../utils/dates';

/** Namespace for this service's advisory locks (first key of the two-int form) */
const BOOKING_LOCK_NAMESPACE = 41_001;

export class AppointmentService {
  /**
   * Create a guest booking with atomic availability checking
   *
   * Uses a PostgreSQL advisory lock per storefront so concurrent requests
   * for overlapping times are serialized: the availability re-check and the
   * insert happen as one step, and only as many bookings as capacity allows
   * can succeed.
   *
   * @param guest - Name, email, and optional phone of the person booking
   * @param storefrontId - Storefront to book at
   * @param serviceId - Service being booked
   * @param startDatetimeStr - ISO 8601 datetime string for requested start
   * @param clientNotes - Optional notes from the guest
   * @param dropId - Optional drop this booking belongs to
   * @returns Created appointment (including its manage_token)
   * @throws Error if slot is unavailable or validation fails
   */
  static async createAppointment(
    guest: GuestDetails,
    storefrontId: number,
    serviceId: number,
    startDatetimeStr: string,
    clientNotes?: string,
    dropId?: number | null
  ): Promise<Appointment> {
    const startDatetime = parseISO(startDatetimeStr);

    if (isBefore(startDatetime, new Date())) {
      throw new Error('Cannot book appointments in the past');
    }

    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront || !storefront.is_active) {
      throw new Error('Storefront not found');
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    if (service.storefront_id !== storefrontId) {
      throw new Error('Service does not belong to this storefront');
    }

    if (!service.is_active) {
      throw new Error('Service is not active');
    }

    const totalDuration = service.duration_minutes + service.buffer_time_minutes;
    const endDatetime = addMinutes(startDatetime, totalDuration);

    // Always starts 'pending' for the approval workflow
    const appointment = await this.createWithLock(
      guest,
      storefront,
      service,
      startDatetime,
      endDatetime,
      clientNotes,
      dropId
    );

    // Fire-and-forget booking emails (post-transaction)
    const dateTimeStr = this.formatForStorefront(startDatetime, storefront);
    EmailService.sendAppointmentConfirmation(guest.email, {
      serviceName: service.name,
      storefrontName: storefront.name,
      dateTime: dateTimeStr,
      price: service.price ?? undefined,
      manageToken: appointment.manage_token,
    });

    UserModel.findById(storefront.vendor_id)
      .then((vendor) => {
        if (vendor) {
          EmailService.sendNewBookingNotification(vendor.email, {
            clientName: guest.name,
            serviceName: service.name,
            storefrontName: storefront.name,
            dateTime: dateTimeStr,
          });
        }
      })
      .catch((error) => console.error('[AppointmentService] Vendor lookup for email failed:', error));

    return appointment;
  }

  /**
   * Create appointment with advisory lock for race condition prevention
   */
  private static async createWithLock(
    guest: GuestDetails,
    storefront: Storefront,
    service: Service,
    startDatetime: Date,
    endDatetime: Date,
    clientNotes?: string,
    dropId?: number | null
  ): Promise<Appointment> {
    // Load rules/drops before taking a connection, so the locked section needs only this client
    const context = await AvailabilityService.loadSlotContext(storefront.id, service.id, startDatetime);
    if ('available' in context) {
      throw new Error(context.reason || 'Slot is no longer available');
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');
      await this.lockStorefront(client, storefront.id);

      // Re-check capacity within the lock, counting on this transaction's connection
      const overlapping = await AppointmentModel.countOverlappingAppointmentsWithClient(
        client,
        storefront.id,
        startDatetime,
        endDatetime,
        null
      );
      const availabilityResult = AvailabilityService.evaluateSlot(context, startDatetime, endDatetime, overlapping);

      if (!availabilityResult.available) {
        throw new Error(
          availabilityResult.reason || 'Slot is no longer available'
        );
      }

      const appointment = await AppointmentModel.createWithClient(client, {
        storefront_id: storefront.id,
        service_id: service.id,
        guest_name: guest.name,
        guest_email: guest.email,
        guest_phone: guest.phone,
        manage_token: this.generateManageToken(),
        requested_start_datetime: startDatetime,
        requested_end_datetime: endDatetime,
        status: 'pending',
        client_notes: clientNotes,
        price_quoted: service.price ?? undefined,
        drop_id: dropId,
      });

      await client.query('COMMIT');
      return appointment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Take a transaction-scoped advisory lock on a storefront's bookings.
   *
   * Capacity is shared across all of a storefront's services and overlapping
   * bookings can start at different times, so the lock covers the whole
   * storefront rather than one service or time bucket. The lock is released
   * automatically at COMMIT or ROLLBACK.
   */
  private static async lockStorefront(client: PoolClient, storefrontId: number): Promise<void> {
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [BOOKING_LOCK_NAMESPACE, storefrontId]);
  }

  /** dropId if [start, end) lies within that drop's window, otherwise null */
  private static async dropContaining(
    dropId: number,
    storefront: Storefront,
    start: Date,
    end: Date
  ): Promise<number | null> {
    const drop = await DropModel.findById(dropId);
    if (!drop) return null;
    const tz = storefront.timezone || 'UTC';
    const date = toDateStr(drop.drop_date);
    const windowStart = localToUtc(date, parseClock(drop.start_time), tz);
    const windowEnd = localToUtc(date, parseClock(drop.end_time), tz);
    return start >= windowStart && end <= windowEnd ? dropId : null;
  }

  /** 256-bit random token, hex-encoded; possession grants access to one booking */
  private static generateManageToken(): string {
    return randomBytes(32).toString('hex');
  }

  /** Human-readable start time in the storefront's timezone, for emails */
  private static formatForStorefront(date: Date, storefront: Storefront): string {
    const tz = storefront.timezone || 'UTC';
    return formatInTimeZone(date, tz, "EEE, MMM d, yyyy 'at' h:mm a zzz");
  }

  /** Strip internal fields before returning a booking to a token holder */
  private static toManaged(appointment: Appointment): ManagedAppointment {
    return {
      id: appointment.id,
      storefront_id: appointment.storefront_id,
      service_id: appointment.service_id,
      status: appointment.status,
      requested_start_datetime: appointment.requested_start_datetime,
      requested_end_datetime: appointment.requested_end_datetime,
      guest_name: appointment.guest_name,
      guest_email: appointment.guest_email,
      guest_phone: appointment.guest_phone,
      client_notes: appointment.client_notes,
      vendor_notes: appointment.vendor_notes,
      price_quoted: appointment.price_quoted,
      drop_id: appointment.drop_id,
      manage_token: appointment.manage_token,
      service_name: appointment.service_name,
      storefront_name: appointment.storefront_name,
      storefront_slug: appointment.storefront_slug,
      storefront_timezone: appointment.storefront_timezone,
    };
  }

  // ============================================
  // GUEST SELF-SERVICE (manage token)
  // ============================================

  /**
   * Look up a booking by its manage token
   */
  static async getByManageToken(token: string): Promise<ManagedAppointment> {
    const appointment = await AppointmentModel.findByManageToken(token);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    return this.toManaged(appointment);
  }

  /**
   * Guest cancels their own pending or confirmed booking
   */
  static async cancelByManageToken(token: string): Promise<ManagedAppointment> {
    const appointment = await AppointmentModel.findByManageToken(token);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    this.validateStatusTransition(appointment.status, 'cancelled', true, false);

    const updated = await AppointmentModel.updateStatus(appointment.id, 'cancelled', {
      internal_notes: 'Cancelled by guest',
    });
    if (!updated) {
      throw new Error('Failed to update appointment status');
    }

    if (appointment.drop_id) {
      DropService.notifyWaitlist(appointment.drop_id);
    }

    return this.toManaged({ ...appointment, ...updated });
  }

  /**
   * Get appointments for a storefront (vendor access)
   */
  static async getStorefrontAppointments(
    storefrontId: number,
    vendorId: number,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    // Verify vendor owns the storefront
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    if (storefront.vendor_id !== vendorId) {
      throw new Error('Forbidden: You do not own this storefront');
    }

    const queryOptions: any = {};

    if (options?.status) {
      queryOptions.status = options.status;
    }

    if (options?.startDate) {
      queryOptions.startDate = options.startDate;
    }

    if (options?.endDate) {
      queryOptions.endDate = options.endDate;
    }

    return await AppointmentModel.findByStorefrontId(storefrontId, queryOptions);
  }

  /**
   * Get a single appointment by ID
   *
   * Only the vendor who owns the storefront may view it this way;
   * guests use their manage token instead.
   */
  static async getAppointmentById(
    appointmentId: number,
    userId: number
  ): Promise<Appointment | null> {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) {
      return null;
    }

    const storefront = await StorefrontModel.findById(appointment.storefront_id);
    if (storefront && storefront.vendor_id === userId) {
      return appointment;
    }

    // User doesn't have permission
    throw new Error('Forbidden: You do not have permission to view this appointment');
  }

  /**
   * Update appointment status
   *
   * Vendor only: confirm, decline, cancel, complete, mark no-show.
   * Guests cancel through cancelByManageToken.
   */
  static async updateStatus(
    appointmentId: number,
    userId: number,
    newStatus: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'declined',
    notes?: { vendor_notes?: string; internal_notes?: string }
  ): Promise<Appointment> {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const storefront = await StorefrontModel.findById(appointment.storefront_id);
    if (!storefront || storefront.vendor_id !== userId) {
      throw new Error('Forbidden: You do not have permission to modify this appointment');
    }

    this.validateStatusTransition(appointment.status, newStatus, false, true);

    const updated = await AppointmentModel.updateStatus(
      appointmentId,
      newStatus,
      notes
    );

    if (!updated) {
      throw new Error('Failed to update appointment status');
    }

    if (newStatus === 'cancelled') {
      this.notifyGuestOfStatus(updated, storefront, 'cancelled', notes?.vendor_notes);
      if (updated.drop_id) {
        DropService.notifyWaitlist(updated.drop_id);
      }
    }

    return updated;
  }

  /**
   * Fire-and-forget status email to the guest
   */
  private static notifyGuestOfStatus(
    appointment: Appointment,
    storefront: Storefront,
    newStatus: 'confirmed' | 'cancelled' | 'declined',
    vendorNotes?: string
  ): void {
    ServiceModel.findById(appointment.service_id)
      .then((service) => {
        if (!service) return;
        EmailService.sendAppointmentStatusChange(appointment.guest_email, {
          serviceName: service.name,
          storefrontName: storefront.name,
          dateTime: this.formatForStorefront(new Date(appointment.requested_start_datetime), storefront),
          newStatus,
          vendorNotes,
          manageToken: appointment.manage_token,
        });
      })
      .catch((error) => console.error('[AppointmentService] Status email failed:', error));
  }

  /**
   * Validate that a status transition is allowed
   *
   * Approval Workflow:
   * - 'pending' is the initial "Request" state
   * - Vendor can 'confirm' (approve) or 'decline' the request
   * - Both client and vendor can 'cancel' pending or confirmed appointments
   * - Only vendor can 'complete' or mark 'no_show'
   */
  private static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    isClient: boolean,
    isVendor: boolean
  ): void {
    // Define allowed transitions for the approval workflow
    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'declined', 'cancelled'],  // Request can be approved, declined, or cancelled
      confirmed: ['cancelled', 'completed', 'no_show'],  // Confirmed can be cancelled, completed, or no-show
      declined: [],  // Terminal state - no further transitions
      cancelled: [], // Terminal state
      completed: [], // Terminal state
      no_show: [],   // Terminal state
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition from '${currentStatus}' to '${newStatus}'`
      );
    }

    // Guest restrictions - guests can only cancel their appointments
    if (isClient && !isVendor) {
      if (newStatus !== 'cancelled') {
        throw new Error('Guests can only cancel appointments');
      }
    }

    // Vendor-only actions: decline, complete, no_show
    if (!isVendor && ['declined', 'completed', 'no_show'].includes(newStatus)) {
      throw new Error(`Only vendors can ${newStatus === 'declined' ? 'decline' : newStatus} appointments`);
    }
  }

  /**
   * Cancel an appointment (convenience method)
   */
  static async cancelAppointment(
    appointmentId: number,
    userId: number,
    reason?: string
  ): Promise<Appointment> {
    return await this.updateStatus(appointmentId, userId, 'cancelled', {
      internal_notes: reason,
    });
  }

  /**
   * Confirm an appointment (vendor only)
   */
  static async confirmAppointment(
    appointmentId: number,
    vendorId: number,
    vendorNotes?: string
  ): Promise<Appointment> {
    return await this.updateStatus(appointmentId, vendorId, 'confirmed', {
      vendor_notes: vendorNotes,
    });
  }

  /**
   * Complete an appointment (vendor only)
   */
  static async completeAppointment(
    appointmentId: number,
    vendorId: number,
    internalNotes?: string
  ): Promise<Appointment> {
    return await this.updateStatus(appointmentId, vendorId, 'completed', {
      internal_notes: internalNotes,
    });
  }

  /**
   * Reschedule a booking atomically (cancel old + create new in one transaction)
   *
   * Authorized by the guest's manage token. If the new slot is unavailable,
   * the transaction rolls back and the original booking is untouched. The new
   * booking gets a fresh manage token, returned to the caller and emailed.
   */
  static async rescheduleByManageToken(
    token: string,
    newStartDatetimeStr: string
  ): Promise<{ cancelled: ManagedAppointment; new: ManagedAppointment }> {
    const original = await AppointmentModel.findByManageToken(token);
    if (!original) {
      throw new Error('Appointment not found');
    }

    if (original.status !== 'pending' && original.status !== 'confirmed') {
      throw new Error(`Cannot reschedule: appointment is '${original.status}'`);
    }

    const newStart = parseISO(newStartDatetimeStr);
    if (isBefore(newStart, new Date())) {
      throw new Error('Cannot reschedule to a time in the past');
    }

    const service = await ServiceModel.findById(original.service_id);
    if (!service) {
      throw new Error('Service not found');
    }

    const storefront = await StorefrontModel.findById(original.storefront_id);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    const totalDuration = service.duration_minutes + service.buffer_time_minutes;
    const newEnd = addMinutes(newStart, totalDuration);

    // The new booking stays linked to the drop only if it still falls inside the drop's window
    const newDropId = original.drop_id
      ? await this.dropContaining(original.drop_id, storefront, newStart, newEnd)
      : null;

    const context = await AvailabilityService.loadSlotContext(storefront.id, service.id, newStart);
    if ('available' in context) {
      throw new Error(context.reason || 'New time slot is not available');
    }

    const client = await getClient();
    let cancelled: Appointment;
    let created: Appointment;
    try {
      await client.query('BEGIN');
      await this.lockStorefront(client, storefront.id);

      // Cancel the old booking first; the count below runs in this transaction, so it no
      // longer includes the original and moving within its own time works at full capacity
      const cancelledRow = await AppointmentModel.updateStatusWithClient(
        client,
        original.id,
        'cancelled',
        { internal_notes: 'Rescheduled by guest' }
      );
      if (!cancelledRow) {
        throw new Error('Failed to cancel original appointment');
      }

      const overlapping = await AppointmentModel.countOverlappingAppointmentsWithClient(
        client,
        storefront.id,
        newStart,
        newEnd,
        null
      );
      const availability = AvailabilityService.evaluateSlot(context, newStart, newEnd, overlapping);
      if (!availability.available) {
        throw new Error(availability.reason || 'New time slot is not available');
      }

      const newRow = await AppointmentModel.createWithClient(client, {
        storefront_id: original.storefront_id,
        service_id: original.service_id,
        guest_name: original.guest_name,
        guest_email: original.guest_email,
        guest_phone: original.guest_phone,
        manage_token: this.generateManageToken(),
        requested_start_datetime: newStart,
        requested_end_datetime: newEnd,
        status: 'pending',
        client_notes: original.client_notes,
        price_quoted: service.price ?? undefined,
        drop_id: newDropId,
      });

      // Cross-reference the pair for the vendor
      cancelled = (await AppointmentModel.updateStatusWithClient(client, cancelledRow.id, 'cancelled', {
        internal_notes: `Rescheduled to #${newRow.id}`,
      }))!;
      created = (await AppointmentModel.updateStatusWithClient(client, newRow.id, 'pending', {
        internal_notes: `Rescheduled from #${cancelledRow.id}`,
      }))!;

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    EmailService.sendAppointmentConfirmation(created.guest_email, {
      serviceName: service.name,
      storefrontName: storefront.name,
      dateTime: this.formatForStorefront(newStart, storefront),
      price: service.price ?? undefined,
      manageToken: created.manage_token,
    });

    // Moving out of a drop window frees a spot there
    if (original.drop_id && created.drop_id !== original.drop_id) {
      DropService.notifyWaitlist(original.drop_id);
    }

    const joined = {
      service_name: original.service_name,
      storefront_name: original.storefront_name,
      storefront_slug: original.storefront_slug,
      storefront_timezone: original.storefront_timezone,
    };
    return {
      cancelled: this.toManaged({ ...cancelled, ...joined }),
      new: this.toManaged({ ...created, ...joined }),
    };
  }

  // ============================================
  // APPROVAL WORKFLOW METHODS
  // ============================================

  /**
   * Approve a booking request (vendor only)
   *
   * Transitions an appointment from 'pending' to 'confirmed'.
   * This is the semantic approval action for the "Request to Book" workflow.
   *
   * @param appointmentId - The appointment to approve
   * @param vendorId - The vendor approving the request (must own the storefront)
   * @param vendorNotes - Optional notes to send to the client
   * @returns The updated appointment with 'confirmed' status
   * @throws Error if appointment not found, vendor doesn't own it, or invalid transition
   */
  static async approveRequest(
    appointmentId: number,
    vendorId: number,
    vendorNotes?: string
  ): Promise<Appointment> {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Verify vendor owns the storefront
    const storefront = await StorefrontModel.findById(appointment.storefront_id);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    if (storefront.vendor_id !== vendorId) {
      throw new Error('Forbidden: You do not own this storefront');
    }

    // Verify appointment is in 'pending' state
    if (appointment.status !== 'pending') {
      throw new Error(`Cannot approve: appointment is already '${appointment.status}'`);
    }

    // Transition to confirmed
    const updated = await AppointmentModel.updateStatus(appointmentId, 'confirmed', {
      vendor_notes: vendorNotes,
    });

    if (!updated) {
      throw new Error('Failed to approve appointment');
    }

    this.notifyGuestOfStatus(updated, storefront, 'confirmed', vendorNotes);

    return updated;
  }

  /**
   * Decline a booking request (vendor only)
   *
   * Transitions an appointment from 'pending' to 'declined'.
   * This is used when a vendor cannot fulfill a booking request.
   *
   * @param appointmentId - The appointment to decline
   * @param vendorId - The vendor declining the request (must own the storefront)
   * @param reason - Optional reason for declining (stored in vendor_notes)
   * @returns The updated appointment with 'declined' status
   * @throws Error if appointment not found, vendor doesn't own it, or invalid transition
   */
  static async declineRequest(
    appointmentId: number,
    vendorId: number,
    reason?: string
  ): Promise<Appointment> {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Verify vendor owns the storefront
    const storefront = await StorefrontModel.findById(appointment.storefront_id);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    if (storefront.vendor_id !== vendorId) {
      throw new Error('Forbidden: You do not own this storefront');
    }

    // Verify appointment is in 'pending' state
    if (appointment.status !== 'pending') {
      throw new Error(`Cannot decline: appointment is already '${appointment.status}'`);
    }

    // Transition to declined
    const updated = await AppointmentModel.updateStatus(appointmentId, 'declined', {
      vendor_notes: reason,
    });

    if (!updated) {
      throw new Error('Failed to decline appointment');
    }

    this.notifyGuestOfStatus(updated, storefront, 'declined', reason);

    if (updated.drop_id) {
      DropService.notifyWaitlist(updated.drop_id);
    }

    return updated;
  }
}
