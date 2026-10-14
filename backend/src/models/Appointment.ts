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
  storefront_id: number;
  service_id: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  manage_token: string;
  requested_start_datetime: Date;
  requested_end_datetime: Date;
  status?: 'pending' | 'confirmed';
  client_notes?: string | null;
  price_quoted?: number;
  drop_id?: number | null;
}

type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };

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
   * Find a booking by its manage token, with names needed to display it
   */
  static async findByManageToken(token: string): Promise<Appointment | null> {
    const result = await query(
      `
      SELECT a.*, s.name AS service_name, sf.name AS storefront_name,
             sf.slug AS storefront_slug, sf.timezone AS storefront_timezone
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN storefronts sf ON a.storefront_id = sf.id
      WHERE a.manage_token = $1 AND a.deleted_at IS NULL
    `,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all appointments for a specific storefront
   */
  static async findByStorefrontId(
    storefrontId: number,
    options?: AppointmentQueryOptions
  ): Promise<Appointment[]> {
    let sql = `
      SELECT a.*, s.name AS service_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.storefront_id = $1 AND a.deleted_at IS NULL
    `;
    const params: any[] = [storefrontId];
    let paramIndex = 2;

    if (options?.status) {
      sql += ` AND a.status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    if (options?.startDate) {
      sql += ` AND a.requested_start_datetime >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      sql += ` AND a.requested_start_datetime <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    sql += ' ORDER BY a.requested_start_datetime ASC';

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
    return this.insert({ query }, data);
  }

  /**
   * Create appointment using a transaction client
   * Used for atomic operations with locking
   */
  static async createWithClient(
    client: PoolClient,
    data: CreateAppointmentData
  ): Promise<Appointment> {
    return this.insert(client, data);
  }

  private static async insert(db: Queryable, data: CreateAppointmentData): Promise<Appointment> {
    const result = await db.query(
      `
      INSERT INTO appointments (
        storefront_id, service_id, guest_name, guest_email, guest_phone, manage_token,
        requested_start_datetime, requested_end_datetime,
        status, client_notes, price_quoted, drop_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
      [
        data.storefront_id,
        data.service_id,
        data.guest_name,
        data.guest_email,
        data.guest_phone ?? null,
        data.manage_token,
        data.requested_start_datetime,
        data.requested_end_datetime,
        data.status ?? 'pending',
        data.client_notes ?? null,
        data.price_quoted ?? null,
        data.drop_id ?? null,
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
   * Update appointment status using a transaction client
   * Used within transactions (e.g., reschedule)
   */
  static async updateStatusWithClient(
    client: PoolClient,
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

    const result = await client.query(sql, params);
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
