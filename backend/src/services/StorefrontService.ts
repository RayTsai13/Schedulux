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
   * Validation rules based on location_type:
   * - 'fixed': Address is REQUIRED (brick-and-mortar business)
   * - 'mobile': Address is OPTIONAL, service_radius and service_area_city are REQUIRED
   * - 'hybrid': Both address (optional) and service_radius/service_area_city are applicable
   *
   * @param vendorId - The ID of the vendor creating the storefront
   * @param data - Storefront creation data
   * @returns Promise<Storefront> - The newly created storefront
   */
  static async create(vendorId: number, data: CreateStorefrontRequest): Promise<Storefront> {
    // Basic validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Storefront name is required');
    }

    // Determine effective location type (default to 'fixed')
    const locationType = data.location_type || 'fixed';

    // Validation based on location_type
    if (locationType === 'fixed') {
      // Fixed locations MUST have an address
      if (!data.address || data.address.trim().length === 0) {
        throw new Error('Address is required for fixed-location storefronts');
      }
    }

    if (locationType === 'mobile' || locationType === 'hybrid') {
      // Mobile/hybrid vendors MUST specify service area
      if (!data.service_radius || data.service_radius < 1) {
        throw new Error('Service radius is required for mobile/hybrid vendors');
      }
      if (!data.service_area_city || data.service_area_city.trim().length === 0) {
        throw new Error('Service area city is required for mobile/hybrid vendors');
      }
    }

    // Profile type validation (informational, name semantics)
    // If profile_type is 'individual', name represents the person's name
    // If profile_type is 'business', name represents the brand/business name
    // No enforcement needed, but could log for analytics

    // Remove is_verified if present (admin-only field)
    const sanitizedData = { ...data };
    delete (sanitizedData as any).is_verified;

    return await StorefrontModel.create(vendorId, sanitizedData);
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
   * Validation rules based on location_type (same as create):
   * - 'fixed': Address is REQUIRED
   * - 'mobile': service_radius and service_area_city are REQUIRED
   * - 'hybrid': service_radius and service_area_city are REQUIRED
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
    const storefront = await this.verifyOwnership(storefrontId, vendorId);

    // Determine the effective location type after update
    const newLocationType = data.location_type ?? storefront.location_type;

    // Validate based on location_type
    if (newLocationType === 'fixed') {
      // For fixed locations, address is required
      const newAddress = data.address ?? storefront.address;
      if (!newAddress || newAddress.trim().length === 0) {
        throw new Error('Address is required for fixed-location storefronts');
      }
    }

    if (newLocationType === 'mobile' || newLocationType === 'hybrid') {
      // For mobile/hybrid, service area is required
      const newRadius = data.service_radius ?? storefront.service_radius;
      const newCity = data.service_area_city ?? storefront.service_area_city;
      if (!newRadius || newRadius < 1) {
        throw new Error('Service radius is required for mobile/hybrid vendors');
      }
      if (!newCity || newCity.trim().length === 0) {
        throw new Error('Service area city is required for mobile/hybrid vendors');
      }
    }

    // Remove is_verified if present (admin-only field)
    const sanitizedData = { ...data };
    delete (sanitizedData as any).is_verified;

    // Perform the update
    const updated = await StorefrontModel.update(storefrontId, sanitizedData);

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
