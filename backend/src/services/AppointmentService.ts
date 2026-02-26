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
   * @param serviceLocationType - Where the service happens ('at_vendor' or 'at_client')
   * @param clientAddress - Client's address (required if serviceLocationType is 'at_client')
   * @returns Created appointment
   * @throws Error if slot is unavailable or validation fails
   */
  static async createAppointment(
    clientId: number,
    storefrontId: number,
    serviceId: number,
    startDatetimeStr: string,
    clientNotes?: string,
    serviceLocationType: 'at_vendor' | 'at_client' = 'at_vendor',
    clientAddress?: string,
    dropId?: number | null
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

    // Determine effective service location type based on storefront capabilities
    let effectiveLocationType = serviceLocationType;

    // If storefront is fixed-location only, force service_location_type to 'at_vendor'
    if (storefront.location_type === 'fixed') {
      if (serviceLocationType === 'at_client') {
        // Silently correct to 'at_vendor' for fixed-location storefronts
        // This handles cases where client accidentally selects wrong option
        effectiveLocationType = 'at_vendor';
      }
    }

    // Validate client address if service is at client location
    if (effectiveLocationType === 'at_client') {
      if (!clientAddress || clientAddress.trim().length === 0) {
        throw new Error('Client address is required for at-client appointments');
      }
    }

    // Calculate end datetime
    const totalDuration = service.duration_minutes + service.buffer_time_minutes;
    const endDatetime = addMinutes(startDatetime, totalDuration);

    // Execute booking within a transaction with advisory lock
    // Note: Always starts with status 'pending' for approval workflow
    return await this.createWithLock(
      clientId,
      storefront,
      service,
      startDatetime,
      endDatetime,
      clientNotes,
      effectiveLocationType,
      effectiveLocationType === 'at_client' ? clientAddress : undefined,
      dropId
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
    clientNotes?: string,
    serviceLocationType: 'at_vendor' | 'at_client' = 'at_vendor',
    clientAddress?: string,
    dropId?: number | null
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
        // Marketplace location fields
        service_location_type: serviceLocationType,
        client_address: clientAddress,
        drop_id: dropId,
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
   * - Vendor can: confirm, decline, cancel, complete, mark no-show
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

    // Client restrictions - clients can only cancel their appointments
    if (isClient && !isVendor) {
      if (newStatus !== 'cancelled') {
        throw new Error('Clients can only cancel appointments');
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

    // TODO: Trigger notification to client about approval

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

    // TODO: Trigger notification to client about decline

    return updated;
  }
}
