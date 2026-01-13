/**
 * ScheduleRule Data Access Layer (Repository Pattern)
 *
 * This class handles all database operations for schedule rules.
 * Schedule rules define vendor availability patterns (weekly hours, specific date closures, etc.)
 */

import { query } from '../config/database';
import { ScheduleRule, CreateScheduleRuleRequest } from '../types';

export class ScheduleRuleModel {

  /**
   * Find a single schedule rule by its unique ID
   */
  static async findById(id: number): Promise<ScheduleRule | null> {
    const result = await query(
      'SELECT * FROM schedule_rules WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all schedule rules for a specific storefront (ordered by priority DESC)
   */
  static async findByStorefrontId(storefrontId: number): Promise<ScheduleRule[]> {
    const result = await query(
      `SELECT * FROM schedule_rules
       WHERE storefront_id = $1 AND deleted_at IS NULL
       ORDER BY priority DESC, rule_type ASC, id ASC`,
      [storefrontId]
    );
    return result.rows;
  }

  /**
   * Find all active schedule rules for a storefront (for public display)
   */
  static async findActiveByStorefrontId(storefrontId: number): Promise<ScheduleRule[]> {
    const result = await query(
      `SELECT * FROM schedule_rules
       WHERE storefront_id = $1 AND is_active = TRUE AND deleted_at IS NULL
       ORDER BY priority DESC, rule_type ASC, id ASC`,
      [storefrontId]
    );
    return result.rows;
  }

  /**
   * Find schedule rules for a specific service
   */
  static async findByServiceId(serviceId: number): Promise<ScheduleRule[]> {
    const result = await query(
      `SELECT * FROM schedule_rules
       WHERE service_id = $1 AND is_active = TRUE AND deleted_at IS NULL
       ORDER BY priority DESC`,
      [serviceId]
    );
    return result.rows;
  }

  /**
   * Create a new schedule rule
   */
  static async create(storefrontId: number, ruleData: CreateScheduleRuleRequest): Promise<ScheduleRule> {
    const {
      service_id = null,
      rule_type,
      priority = 1,
      day_of_week,
      specific_date,
      month,
      year,
      start_time,
      end_time,
      is_available = true,
      max_concurrent_appointments = 1,
      notes
    } = ruleData;

    const result = await query(`
      INSERT INTO schedule_rules (
        storefront_id, service_id, rule_type, priority,
        day_of_week, specific_date, month, year,
        start_time, end_time,
        is_available, max_concurrent_appointments, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      storefrontId, service_id, rule_type, priority,
      day_of_week ?? null, specific_date ?? null, month ?? null, year ?? null,
      start_time, end_time,
      is_available, max_concurrent_appointments, notes ?? null
    ]);

    return result.rows[0];
  }

  /**
   * Update an existing schedule rule with partial data
   */
  static async update(id: number, updates: Partial<ScheduleRule>): Promise<ScheduleRule | null> {
    // Filter out undefined values and build dynamic SET clause
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
      UPDATE schedule_rules
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Soft delete a schedule rule
   */
  static async softDelete(id: number): Promise<boolean> {
    const result = await query(`
      UPDATE schedule_rules
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    return result.rows.length > 0;
  }
}
