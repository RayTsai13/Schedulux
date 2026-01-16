/**
 * Storefront Data Access Layer (Repository Pattern)
 * 
 * This class handles all database operations for storefronts using the Repository pattern.
 * Storefronts represent business locations where vendors offer services and appointments.
 * 
 * Key Features:
 * - Uses parameterized queries to prevent SQL injection
 * - Implements soft deletion (sets deleted_at instead of removing records)
 * - Returns typed TypeScript objects for type safety
 * - Filters out deleted records automatically in all queries
 * 
 * Design Pattern: Repository Pattern
 * - Separates business logic from data access logic
 * - Provides a clean interface for database operations
 * - Makes testing easier by allowing mock implementations
 */

// Import database query helper function
import { query } from '../config/database';
// Import TypeScript interfaces for type safety
import { Storefront, CreateStorefrontRequest } from '../types';

/**
 * StorefrontModel - Repository class for storefront database operations
 * 
 * This class contains static methods for CRUD operations on the storefronts table.
 * All methods are static because we don't need to maintain instance state.
 */
export class StorefrontModel {
  
  /**
   * Find a single storefront by its unique ID
   * 
   * @param id - The unique identifier of the storefront
   * @returns Promise<Storefront | null> - The storefront object if found, null if not found or deleted
   * 
   * Example usage:
   * const storefront = await StorefrontModel.findById(123);
   * if (storefront) {
   *   console.log(`Found: ${storefront.name}`);
   * }
   */
  static async findById(id: number): Promise<Storefront | null> {
    // Use parameterized query ($1) to prevent SQL injection
    // Only return storefronts that haven't been soft-deleted (deleted_at IS NULL)
    const result = await query('SELECT * FROM storefronts WHERE id = $1 AND deleted_at IS NULL', [id]);
    
    // Return the first row if found, otherwise null
    // result.rows[0] gets the first database row, || null ensures we return null if no rows
    return result.rows[0] || null;
  }

  /**
   * Find all storefronts owned by a specific vendor
   * 
   * @param vendorId - The ID of the vendor who owns the storefronts
   * @returns Promise<Storefront[]> - Array of storefronts owned by the vendor (empty array if none)
   * 
   * Business Logic: A vendor can own multiple storefronts (one-to-many relationship)
   * 
   * Example usage:
   * const myStorefronts = await StorefrontModel.findByVendorId(vendorUserId);
   * console.log(`You have ${myStorefronts.length} storefronts`);
   */
  static async findByVendorId(vendorId: number): Promise<Storefront[]> {
    // Find all storefronts for this vendor, excluding soft-deleted ones
    const result = await query('SELECT * FROM storefronts WHERE vendor_id = $1 AND deleted_at IS NULL', [vendorId]);
    
    // Return all rows (could be empty array if vendor has no storefronts)
    return result.rows;
  }

  /**
   * Create a new storefront in the database
   * 
   * @param vendorId - The ID of the vendor who will own this storefront
   * @param storefrontData - Object containing all the storefront information
   * @returns Promise<Storefront> - The newly created storefront with database-generated fields (id, timestamps)
   * 
   * Business Logic: 
   * - Each storefront must be owned by a vendor
   * - Timezone defaults to 'UTC' if not provided
   * - Database automatically sets created_at and updated_at timestamps
   * 
   * Example usage:
   * const newStorefront = await StorefrontModel.create(vendorId, {
   *   name: "Downtown Hair Salon",
   *   address: "123 Main St",
   *   phone: "555-1234"
   * });
   */
  static async create(vendorId: number, storefrontData: CreateStorefrontRequest): Promise<Storefront> {
    // Destructure the incoming data object to extract individual fields
    const {
      name,
      description,
      address,
      phone,
      email,
      timezone = 'UTC',  // Default timezone to UTC if not specified
      business_hours,
      // Marketplace fields with defaults
      profile_type = 'business',
      location_type = 'fixed',
      service_radius,
      service_area_city,
      avatar_url
    } = storefrontData;

    // Insert new storefront and return the complete record (RETURNING *)
    // PostgreSQL's RETURNING clause gives us the inserted row with auto-generated fields
    // Note: is_verified is NOT included - defaults to false, admin-only field
    const result = await query(`
      INSERT INTO storefronts (
        vendor_id, name, description, address, phone, email, timezone, business_hours,
        profile_type, location_type, service_radius, service_area_city, avatar_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      vendorId, name, description, address, phone, email, timezone, business_hours,
      profile_type, location_type, service_radius ?? null, service_area_city ?? null, avatar_url ?? null
    ]);

    // Return the newly created storefront (first and only row from INSERT)
    return result.rows[0];
  }

  /**
   * Update an existing storefront with partial data
   * 
   * @param id - The ID of the storefront to update
   * @param updates - Object containing only the fields to update (partial update)
   * @returns Promise<Storefront | null> - Updated storefront object, or null if not found
   * 
   * Key Features:
   * - Dynamic SQL generation based on which fields are provided
   * - Only updates the fields that are provided (partial updates)
   * - Returns the updated record to confirm changes
   * 
   * Example usage:
   * const updated = await StorefrontModel.update(123, { 
   *   name: "New Name", 
   *   phone: "555-9999" 
   * });
   */
  static async update(id: number, updates: Partial<Storefront>): Promise<Storefront | null> {
    // Dynamically build the SET clause based on provided fields
    // Example: if updates = {name: "New Name", phone: "555-1234"}
    // This creates: "name = $2, phone = $3"
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)  // Start at $2 because $1 is the ID
      .join(', ');  // Join with commas for valid SQL
    
    // Create array of values: [id, ...update values]
    // Example: [123, "New Name", "555-1234"]
    const values = [id, ...Object.values(updates)];
    
    // Execute the dynamic UPDATE query
    // RETURNING * gives us back the updated record to confirm changes
    const result = await query(`
      UPDATE storefronts 
      SET ${setClause}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    // Return updated storefront or null if not found/already deleted
    return result.rows[0] || null;
  }

  /**
   * Soft delete a storefront (mark as deleted without removing from database)
   * 
   * @param id - The ID of the storefront to delete
   * @returns Promise<boolean> - true if storefront was deleted, false if not found
   * 
   * Soft Delete Pattern:
   * - Sets deleted_at timestamp instead of removing the record
   * - Preserves data for audit trails and data recovery
   * - All other queries automatically exclude deleted records
   * - Allows for "undelete" functionality if needed later
   * 
   * Example usage:
   * const wasDeleted = await StorefrontModel.softDelete(123);
   * if (wasDeleted) {
   *   console.log("Storefront successfully deleted");
   * }
   */
  static async softDelete(id: number): Promise<boolean> {
    // Set deleted_at to current timestamp (marks as deleted)
    // CURRENT_TIMESTAMP is a PostgreSQL function for the current date/time
    const result = await query(`
      UPDATE storefronts 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    // Return true if we actually deleted something (result has rows)
    // If the storefront was already deleted or didn't exist, result.rows.length will be 0
    return result.rows.length > 0;
  }
}
