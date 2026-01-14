/**
 * AppointmentService - Handle appointment booking with race condition prevention
 *
 * This service manages appointment lifecycle:
 * - Creating bookings with atomic availability checking
 * - Status transitions (confirm, cancel, complete)
 * - Ownership validation for vendor operations
 */

import { addMinutes, parseISO, isBefore } from 'date-fns';
import { PoolClient } from 'pg';

import { pool, getClient, withTransaction } from '../config/database';
import { AppointmentModel, CreateAppointmentData } from '../models/Appointment';
import { StorefrontModel } from '../models/Storefront';
import { ServiceModel } from '../models/Service';
import { AvailabilityService } from './AvailabilityService';
import { Appointment, Service, Storefront, CreateAppointmentRequest } from '../types';
import { AppointmentQueryOptions } from '../types/availability';

export class AppointmentService {
  /**
   * Create a new appointment with atomic availability checking
   *
   * Uses PostgreSQL advisory locks to prevent race conditions when
   * multiple users attempt to book the same slot simultaneously.
   *
   * @param clientId - The user making the booking
   * @param storefrontId - Storefront to book at
   * @param serviceId - Service being booked
   * @param startDatetimeStr - ISO 8601 datetime string for requested start
   * @param clientNotes - Optional notes from the client
   * @returns Created appointment
   * @throws Error if slot is unavailable or validation fails
   */
  static async createAppointment(
    clientId: number,
    storefrontId: number,
    serviceId: number,
    startDatetimeStr: string,
    clientNotes?: string
  ): Promise<Appointment> {
    // Parse the start datetime
    const startDatetime = parseISO(startDatetimeStr);

    // Validate datetime is in the future
    if (isBefore(startDatetime, new Date())) {
      throw new Error('Cannot book appointments in the past');
    }

    // Fetch storefront and service for validation
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
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

    // Calculate end datetime
    const totalDuration = service.duration_minutes + service.buffer_time_minutes;
    const endDatetime = addMinutes(startDatetime, totalDuration);

    // Execute booking within a transaction with advisory lock
    return await this.createWithLock(
      clientId,
      storefront,
      service,
      startDatetime,
      endDatetime,
      clientNotes
    );
  }

  /**
   * Create appointment with advisory lock for race condition prevention
   */
  private static async createWithLock(
    clientId: number,
    storefront: Storefront,
    service: Service,
    startDatetime: Date,
    endDatetime: Date,
    clientNotes?: string
  ): Promise<Appointment> {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Acquire advisory lock based on storefront, service, and time bucket (15-min)
      // This prevents concurrent bookings from racing
      const lockKey = this.generateLockKey(
        storefront.id,
        service.id,
        startDatetime
      );
      await client.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

      // Re-check availability within the lock
      const availabilityResult = await AvailabilityService.isSlotAvailable(
        storefront.id,
        service.id,
        startDatetime,
        endDatetime
      );

      if (!availabilityResult.available) {
        throw new Error(
          availabilityResult.reason || 'Slot is no longer available'
        );
      }

      // Create the appointment
      const appointmentData: CreateAppointmentData = {
        client_id: clientId,
        storefront_id: storefront.id,
        service_id: service.id,
        requested_start_datetime: startDatetime,
        requested_end_datetime: endDatetime,
        status: 'pending',
        client_notes: clientNotes,
        price_quoted: service.price ?? undefined,
      };

      const appointment = await AppointmentModel.createWithClient(
        client,
        appointmentData
      );

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
   * Generate a lock key for advisory locking
   *
   * Creates a unique integer key from storefront, service, and 15-minute time bucket
   * to allow concurrent bookings for different time slots while preventing
   * race conditions for the same slot.
   */
  private static generateLockKey(
    storefrontId: number,
    serviceId: number,
    datetime: Date
  ): number {
    // Create 15-minute time buckets
    const timeBucket = Math.floor(datetime.getTime() / (15 * 60 * 1000));

    // Combine into a hash (using simple string hash)
    const combined = `${storefrontId}-${serviceId}-${timeBucket}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get appointments for a client
   */
  static async getClientAppointments(
    clientId: number,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    const queryOptions: any = {};

    if (options?.status) {
      queryOptions.status = options.status;
    }

    if (options?.upcoming) {
      queryOptions.startDate = new Date();
    }

    if (options?.startDate) {
      queryOptions.startDate = options.startDate;
    }

    if (options?.endDate) {
      queryOptions.endDate = options.endDate;
    }

    return await AppointmentModel.findByClientId(clientId, queryOptions);
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
   * Validates that the requester has permission to view the appointment
   * (either the client who booked it or the vendor who owns the storefront)
   */
  static async getAppointmentById(
    appointmentId: number,
    userId: number
  ): Promise<Appointment | null> {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) {
      return null;
    }

    // Check if user is the client
    if (appointment.client_id === userId) {
      return appointment;
    }

    // Check if user is the vendor
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
   * Permissions:
   * - Client can: cancel their own pending/confirmed appointments
   * - Vendor can: confirm, cancel, complete, mark no-show
   */
  static async updateStatus(
    appointmentId: number,
    userId: number,
    newStatus: 'confirmed' | 'cancelled' | 'completed' | 'no_show',
    notes?: { vendor_notes?: string; internal_notes?: string }
  ): Promise<Appointment> {
    const appointment = await AppointmentModel.findById(appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Determine user role
    const isClient = appointment.client_id === userId;
    const storefront = await StorefrontModel.findById(appointment.storefront_id);
    const isVendor = storefront?.vendor_id === userId;

    if (!isClient && !isVendor) {
      throw new Error('Forbidden: You do not have permission to modify this appointment');
    }

    // Validate status transition
    this.validateStatusTransition(
      appointment.status,
      newStatus,
      isClient,
      isVendor
    );

    const updated = await AppointmentModel.updateStatus(
      appointmentId,
      newStatus,
      notes
    );

    if (!updated) {
      throw new Error('Failed to update appointment status');
    }

    return updated;
  }

  /**
   * Validate that a status transition is allowed
   */
  private static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    isClient: boolean,
    isVendor: boolean
  ): void {
    // Define allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['cancelled', 'completed', 'no_show'],
      cancelled: [],
      completed: [],
      no_show: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Cannot transition from '${currentStatus}' to '${newStatus}'`
      );
    }

    // Client restrictions
    if (isClient && !isVendor) {
      if (newStatus !== 'cancelled') {
        throw new Error('Clients can only cancel appointments');
      }
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
}
