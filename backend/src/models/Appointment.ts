/**
 * Appointment Data Access Layer (Repository Pattern)
 *
 * Handles all database operations for appointments.
 * Appointments represent bookings made by clients for services at storefronts.
 */

import { query } from '../config/database';
import { Appointment } from '../types';
import { PoolClient } from 'pg';

export interface CreateAppointmentData {
  client_id: number;
  storefront_id: number;
  service_id: number;
  slot_id?: number;
  requested_start_datetime: Date;
  requested_end_datetime: Date;
  status?: 'pending' | 'confirmed';
  client_notes?: string;
  price_quoted?: number;
}

export interface AppointmentQueryOptions {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AppointmentModel {
  /**
   * Find a single appointment by ID
   */
  static async findById(id: number): Promise<Appointment | null> {
    const result = await query(
      'SELECT * FROM appointments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all appointments for a specific client
   */
  static async findByClientId(
    clientId: number,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    let sql = `
      SELECT * FROM appointments
      WHERE client_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [clientId];
    let paramIndex = 2;

    if (options?.status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    if (options?.startDate) {
      sql += ` AND requested_start_datetime >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      sql += ` AND requested_start_datetime <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    sql += ' ORDER BY requested_start_datetime ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Find all appointments for a specific storefront
   */
  static async findByStorefrontId(
    storefrontId: number,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    let sql = `
      SELECT * FROM appointments
      WHERE storefront_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [storefrontId];
    let paramIndex = 2;

    if (options?.status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    if (options?.startDate) {
      sql += ` AND requested_start_datetime >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      sql += ` AND requested_start_datetime <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    sql += ' ORDER BY requested_start_datetime ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Count appointments that overlap with a given time range
   * Used for concurrent booking validation
   *
   * @param storefrontId - The storefront to check
   * @param startDatetime - Start of the time range
   * @param endDatetime - End of the time range
   * @param serviceId - Optional service filter (null checks all services)
   * @param excludeAppointmentId - Optional appointment to exclude (for updates)
   */
  static async countOverlappingAppointments(
    storefrontId: number,
    startDatetime: Date,
    endDatetime: Date,
    serviceId?: number | null,
    excludeAppointmentId?: number
  ): Promise<number> {
    let sql = `
      SELECT COUNT(*)::int as count
      FROM appointments
      WHERE storefront_id = $1
        AND status IN ('pending', 'confirmed')
        AND deleted_at IS NULL
        AND (requested_start_datetime, requested_end_datetime) OVERLAPS ($2::timestamp, $3::timestamp)
    `;
    const params: any[] = [storefrontId, startDatetime, endDatetime];
    let paramIndex = 4;

    if (serviceId !== undefined && serviceId !== null) {
      sql += ` AND service_id = $${paramIndex}`;
      params.push(serviceId);
      paramIndex++;
    }

    if (excludeAppointmentId) {
      sql += ` AND id != $${paramIndex}`;
      params.push(excludeAppointmentId);
    }

    const result = await query(sql, params);
    return result.rows[0]?.count || 0;
  }

  /**
   * Count overlapping appointments using a transaction client
   * Used within transactions for race condition prevention
   */
  static async countOverlappingAppointmentsWithClient(
    client: PoolClient,
    storefrontId: number,
    startDatetime: Date,
    endDatetime: Date,
    serviceId?: number | null
  ): Promise<number> {
    let sql = `
      SELECT COUNT(*)::int as count
      FROM appointments
      WHERE storefront_id = $1
        AND status IN ('pending', 'confirmed')
        AND deleted_at IS NULL
        AND (requested_start_datetime, requested_end_datetime) OVERLAPS ($2::timestamp, $3::timestamp)
    `;
    const params: any[] = [storefrontId, startDatetime, endDatetime];

    if (serviceId !== undefined && serviceId !== null) {
      sql += ` AND service_id = $4`;
      params.push(serviceId);
    }

    const result = await client.query(sql, params);
    return result.rows[0]?.count || 0;
  }

  /**
   * Get appointments in a date range for availability calculation
   * Returns only active (pending/confirmed) appointments
   */
  static async findActiveInRange(
    storefrontId: number,
    startDatetime: Date,
    endDatetime: Date,
    serviceId?: number | null
  ): Promise<Appointment[]> {
    let sql = `
      SELECT * FROM appointments
      WHERE storefront_id = $1
        AND status IN ('pending', 'confirmed')
        AND deleted_at IS NULL
        AND requested_start_datetime < $3
        AND requested_end_datetime > $2
    `;
    const params: any[] = [storefrontId, startDatetime, endDatetime];

    if (serviceId !== undefined && serviceId !== null) {
      sql += ` AND service_id = $4`;
      params.push(serviceId);
    }

    sql += ' ORDER BY requested_start_datetime ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Create a new appointment
   */
  static async create(data: CreateAppointmentData): Promise<Appointment> {
    const {
      client_id,
      storefront_id,
      service_id,
      slot_id,
      requested_start_datetime,
      requested_end_datetime,
      status = 'pending',
      client_notes,
      price_quoted,
    } = data;

    const result = await query(
      `
      INSERT INTO appointments (
        client_id, storefront_id, service_id, slot_id,
        requested_start_datetime, requested_end_datetime,
        status, client_notes, price_quoted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        client_id,
        storefront_id,
        service_id,
        slot_id ?? null,
        requested_start_datetime,
        requested_end_datetime,
        status,
        client_notes ?? null,
        price_quoted ?? null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Create appointment using a transaction client
   * Used for atomic operations with locking
   */
  static async createWithClient(
    client: PoolClient,
    data: CreateAppointmentData
  ): Promise<Appointment> {
    const {
      client_id,
      storefront_id,
      service_id,
      slot_id,
      requested_start_datetime,
      requested_end_datetime,
      status = 'pending',
      client_notes,
      price_quoted,
    } = data;

    const result = await client.query(
      `
      INSERT INTO appointments (
        client_id, storefront_id, service_id, slot_id,
        requested_start_datetime, requested_end_datetime,
        status, client_notes, price_quoted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        client_id,
        storefront_id,
        service_id,
        slot_id ?? null,
        requested_start_datetime,
        requested_end_datetime,
        status,
        client_notes ?? null,
        price_quoted ?? null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update appointment status and optional notes
   */
  static async updateStatus(
    id: number,
    status: string,
    notes?: { vendor_notes?: string; internal_notes?: string }
  ): Promise<Appointment | null> {
    let sql = `
      UPDATE appointments
      SET status = $2, updated_at = CURRENT_TIMESTAMP
    `;
    const params: any[] = [id, status];
    let paramIndex = 3;

    if (notes?.vendor_notes !== undefined) {
      sql += `, vendor_notes = $${paramIndex}`;
      params.push(notes.vendor_notes);
      paramIndex++;
    }

    if (notes?.internal_notes !== undefined) {
      sql += `, internal_notes = $${paramIndex}`;
      params.push(notes.internal_notes);
      paramIndex++;
    }

    sql += ` WHERE id = $1 AND deleted_at IS NULL RETURNING *`;

    const result = await query(sql, params);
    return result.rows[0] || null;
  }

  /**
   * Update confirmed datetime (when vendor confirms different time)
   */
  static async updateConfirmedTime(
    id: number,
    confirmedStart: Date,
    confirmedEnd: Date
  ): Promise<Appointment | null> {
    const result = await query(
      `
      UPDATE appointments
      SET confirmed_start_datetime = $2,
          confirmed_end_datetime = $3,
          status = 'confirmed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `,
      [id, confirmedStart, confirmedEnd]
    );

    return result.rows[0] || null;
  }

  /**
   * Update final price (after service completion)
   */
  static async updateFinalPrice(
    id: number,
    priceFinal: number
  ): Promise<Appointment | null> {
    const result = await query(
      `
      UPDATE appointments
      SET price_final = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `,
      [id, priceFinal]
    );

    return result.rows[0] || null;
  }

  /**
   * Soft delete an appointment
   */
  static async softDelete(id: number): Promise<boolean> {
    const result = await query(
      `
      UPDATE appointments
      SET deleted_at = CURRENT_TIMESTAMP, status = 'cancelled'
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `,
      [id]
    );

    return result.rows.length > 0;
  }
}
