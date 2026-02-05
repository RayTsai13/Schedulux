/**
 * Service Data Access Layer (Repository Pattern)
 *
 * This class handles all database operations for services using the Repository pattern.
 * Services represent the offerings a vendor provides (e.g., "Haircut - 30min").
 */

import { query } from '../config/database';
import { Service, CreateServiceRequest } from '../types';

export class ServiceModel {

  /**
   * Find a single service by its unique ID
   */
  static async findById(id: number): Promise<Service | null> {
    const result = await query(
      'SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all services for a specific storefront
   */
  static async findByStorefrontId(storefrontId: number): Promise<Service[]> {
    const result = await query(
      'SELECT * FROM services WHERE storefront_id = $1 AND deleted_at IS NULL ORDER BY name ASC',
      [storefrontId]
    );
    return result.rows;
  }

  /**
   * Find all active services for a storefront (for public display)
   */
  static async findActiveByStorefrontId(storefrontId: number): Promise<Service[]> {
    const result = await query(
      'SELECT * FROM services WHERE storefront_id = $1 AND is_active = TRUE AND deleted_at IS NULL ORDER BY name ASC',
      [storefrontId]
    );
    return result.rows;
  }

  /**
   * Create a new service
   */
  static async create(storefrontId: number, serviceData: CreateServiceRequest): Promise<Service> {
    const {
      name,
      description,
      duration_minutes,
      buffer_time_minutes = 0,
      price,
      category
    } = serviceData;

    const result = await query(`
      INSERT INTO services (storefront_id, name, description, duration_minutes, buffer_time_minutes, price, category)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [storefrontId, name, description, duration_minutes, buffer_time_minutes, price, category]);

    return result.rows[0];
  }

  /**
   * Update an existing service with partial data
   */
  static async update(id: number, updates: Partial<Service>): Promise<Service | null> {
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
      UPDATE services
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Soft delete a service
   */
  static async softDelete(id: number): Promise<boolean> {
    const result = await query(`
      UPDATE services
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    return result.rows.length > 0;
  }

  /**
   * Get price summary and category information for a storefront's services
   *
   * Used by MarketplaceService to display price ranges and service counts
   * in search results.
   *
   * @param storefrontId - The storefront ID
   * @returns Promise with min/max prices, service count, and unique categories
   */
  static async getPriceSummary(storefrontId: number): Promise<{
    min_price: number | null;
    max_price: number | null;
    categories: string[];
    count: number;
  }> {
    const result = await query(`
      SELECT
        MIN(price) as min_price,
        MAX(price) as max_price,
        COUNT(*) as count,
        ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories
      FROM services
      WHERE storefront_id = $1
        AND is_active = TRUE
        AND deleted_at IS NULL
    `, [storefrontId]);

    return result.rows[0];
  }
}
