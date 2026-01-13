/**
 * StorefrontService - Business Logic Layer for Storefront Operations
 *
 * This service implements the Service Layer pattern, which:
 * - Encapsulates business logic and rules for storefront management
 * - Handles ownership validation to ensure vendors can only access their own storefronts
 * - Provides a clean interface for API controllers to use
 *
 * Key responsibilities:
 * - Storefront CRUD operations with ownership verification
 * - Business rule enforcement (ownership, active status)
 * - Data validation before passing to the repository layer
 */

import { StorefrontModel } from '../models/Storefront';
import { Storefront, CreateStorefrontRequest, UpdateStorefrontRequest } from '../types';

export class StorefrontService {

  /**
   * Verify that a storefront exists and belongs to the specified vendor
   *
   * @param storefrontId - The ID of the storefront to verify
   * @param vendorId - The ID of the vendor who should own the storefront
   * @returns Promise<Storefront> - The storefront if ownership is verified
   * @throws Error if storefront not found or vendor doesn't own it
   */
  private static async verifyOwnership(storefrontId: number, vendorId: number): Promise<Storefront> {
    const storefront = await StorefrontModel.findById(storefrontId);

    if (!storefront) {
      throw new Error('Storefront not found');
    }

    if (storefront.vendor_id !== vendorId) {
      throw new Error('Forbidden: You do not own this storefront');
    }

    return storefront;
  }

  /**
   * Create a new storefront for a vendor
   *
   * @param vendorId - The ID of the vendor creating the storefront
   * @param data - Storefront creation data
   * @returns Promise<Storefront> - The newly created storefront
   */
  static async create(vendorId: number, data: CreateStorefrontRequest): Promise<Storefront> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Storefront name is required');
    }

    return await StorefrontModel.create(vendorId, data);
  }

  /**
   * Get all storefronts owned by a vendor
   *
   * @param vendorId - The ID of the vendor
   * @returns Promise<Storefront[]> - Array of storefronts owned by the vendor
   */
  static async getAllByVendor(vendorId: number): Promise<Storefront[]> {
    return await StorefrontModel.findByVendorId(vendorId);
  }

  /**
   * Get a single storefront by ID with ownership verification
   *
   * @param storefrontId - The ID of the storefront to retrieve
   * @param vendorId - The ID of the vendor requesting the storefront
   * @returns Promise<Storefront> - The storefront if found and owned by vendor
   * @throws Error if storefront not found or not owned by vendor
   */
  static async getById(storefrontId: number, vendorId: number): Promise<Storefront> {
    return await this.verifyOwnership(storefrontId, vendorId);
  }

  /**
   * Update a storefront with ownership verification
   *
   * @param storefrontId - The ID of the storefront to update
   * @param vendorId - The ID of the vendor requesting the update
   * @param data - Partial storefront data to update
   * @returns Promise<Storefront> - The updated storefront
   * @throws Error if storefront not found, not owned by vendor, or update fails
   */
  static async update(
    storefrontId: number,
    vendorId: number,
    data: UpdateStorefrontRequest
  ): Promise<Storefront> {
    // Verify ownership before allowing update
    await this.verifyOwnership(storefrontId, vendorId);

    // Perform the update
    const updated = await StorefrontModel.update(storefrontId, data);

    if (!updated) {
      throw new Error('Failed to update storefront');
    }

    return updated;
  }

  /**
   * Soft delete a storefront with ownership verification
   *
   * @param storefrontId - The ID of the storefront to delete
   * @param vendorId - The ID of the vendor requesting the deletion
   * @returns Promise<boolean> - True if deletion was successful
   * @throws Error if storefront not found or not owned by vendor
   */
  static async delete(storefrontId: number, vendorId: number): Promise<boolean> {
    // Verify ownership before allowing deletion
    await this.verifyOwnership(storefrontId, vendorId);

    // Perform soft delete
    const deleted = await StorefrontModel.softDelete(storefrontId);

    if (!deleted) {
      throw new Error('Failed to delete storefront');
    }

    return deleted;
  }
}
