import { query } from '../config/database';
import { Drop, CreateDropRequest } from '../types';

export class DropModel {

  static async findById(id: number): Promise<Drop | null> {
    const result = await query(
      'SELECT * FROM drops WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByStorefrontId(storefrontId: number): Promise<Drop[]> {
    const result = await query(
      `SELECT * FROM drops
       WHERE storefront_id = $1 AND deleted_at IS NULL
       ORDER BY drop_date ASC, start_time ASC`,
      [storefrontId]
    );
    return result.rows;
  }

  static async findActiveByStorefrontId(storefrontId: number): Promise<Drop[]> {
    const result = await query(
      `SELECT * FROM drops
       WHERE storefront_id = $1
         AND is_published = TRUE
         AND is_active = TRUE
         AND deleted_at IS NULL
       ORDER BY drop_date ASC, start_time ASC`,
      [storefrontId]
    );
    return result.rows;
  }

  static async findActiveByDateRange(
    storefrontId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Drop[]> {
    const result = await query(
      `SELECT * FROM drops
       WHERE storefront_id = $1
         AND is_published = TRUE
         AND is_active = TRUE
         AND deleted_at IS NULL
         AND drop_date >= $2::date
         AND drop_date <= $3::date
       ORDER BY drop_date ASC, start_time ASC`,
      [storefrontId, startDate, endDate]
    );
    return result.rows;
  }

  static async create(storefrontId: number, data: CreateDropRequest): Promise<Drop> {
    const {
      service_id = null,
      title,
      description,
      drop_date,
      start_time,
      end_time,
      max_concurrent_appointments = 1,
      is_published = false,
    } = data;

    const result = await query(`
      INSERT INTO drops (
        storefront_id, service_id, title, description,
        drop_date, start_time, end_time,
        max_concurrent_appointments, is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      storefrontId, service_id, title, description ?? null,
      drop_date, start_time, end_time,
      max_concurrent_appointments, is_published,
    ]);

    return result.rows[0];
  }

  static async update(id: number, updates: Record<string, any>): Promise<Drop | null> {
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return this.findById(id);
    }

    const setClause = Object.keys(filteredUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(filteredUpdates)];

    const result = await query(`
      UPDATE drops
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  static async softDelete(id: number): Promise<boolean> {
    const result = await query(`
      UPDATE drops
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    return result.rows.length > 0;
  }
}
