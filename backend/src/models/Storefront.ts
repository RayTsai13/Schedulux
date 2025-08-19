import { query } from '../config/database';
import { Storefront, CreateStorefrontRequest } from '../types';

export class StorefrontModel {
  static async findById(id: number): Promise<Storefront | null> {
    const result = await query('SELECT * FROM storefronts WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0] || null;
  }

  static async findByVendorId(vendorId: number): Promise<Storefront[]> {
    const result = await query('SELECT * FROM storefronts WHERE vendor_id = $1 AND deleted_at IS NULL', [vendorId]);
    return result.rows;
  }

  static async create(vendorId: number, storefrontData: CreateStorefrontRequest): Promise<Storefront> {
    const {
      name,
      description,
      address,
      phone,
      email,
      timezone = 'UTC',
      business_hours
    } = storefrontData;

    const result = await query(`
      INSERT INTO storefronts (vendor_id, name, description, address, phone, email, timezone, business_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [vendorId, name, description, address, phone, email, timezone, business_hours]);

    return result.rows[0];
  }

  static async update(id: number, updates: Partial<Storefront>): Promise<Storefront | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await query(`
      UPDATE storefronts 
      SET ${setClause}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  static async softDelete(id: number): Promise<boolean> {
    const result = await query(`
      UPDATE storefronts 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    return result.rows.length > 0;
  }
}
