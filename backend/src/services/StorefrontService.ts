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
import { ServiceModel } from '../models/Service';
import {
  Storefront,
  Service,
  CreateStorefrontRequest,
  UpdateStorefrontRequest,
  UPDATABLE_STOREFRONT_FIELDS,
  SLUG_PATTERN,
  RESERVED_SLUGS,
} from '../types';

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
   * Validate a requested slug: format, reserved words, and uniqueness
   */
  private static async assertSlugAvailable(slug: string, excludeId?: number): Promise<void> {
    if (!SLUG_PATTERN.test(slug)) {
      throw new Error('Invalid slug: use 3-30 lowercase letters, numbers, or dashes');
    }
    if (RESERVED_SLUGS.has(slug) || (await StorefrontModel.slugExists(slug, excludeId))) {
      throw new Error('Slug is already taken');
    }
  }

  /**
   * Whether a slug can be claimed (used by onboarding as the vendor types)
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      await this.assertSlugAvailable(slug.toLowerCase());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create the vendor's booking page. Each vendor has exactly one.
   *
   * @param vendorId - The ID of the vendor creating the storefront
   * @param data - Storefront creation data
   * @returns Promise<Storefront> - The newly created storefront
   */
  static async create(vendorId: number, data: CreateStorefrontRequest): Promise<Storefront> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Storefront name is required');
    }

    const existing = await StorefrontModel.findByVendorId(vendorId);
    if (existing.length > 0) {
      throw new Error('You already have a booking page');
    }

    const slug = (data.slug || '').toLowerCase();
    await this.assertSlugAvailable(slug);

    return await StorefrontModel.create(vendorId, { ...data, slug });
  }

  /**
   * Get the vendor's booking page, or null if they haven't created one yet
   */
  static async getForVendor(vendorId: number): Promise<Storefront | null> {
    const storefronts = await StorefrontModel.findByVendorId(vendorId);
    return storefronts[0] ?? null;
  }

  /**
   * Public view of a booking page: storefront plus active services
   */
  static async getPublicBySlug(
    slug: string
  ): Promise<{ storefront: Storefront; services: Service[] } | null> {
    const storefront = await StorefrontModel.findPublicBySlug(slug.toLowerCase());
    if (!storefront) {
      return null;
    }
    const services = await ServiceModel.findActiveByStorefrontId(storefront.id);
    return { storefront, services };
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
    const storefront = await this.verifyOwnership(storefrontId, vendorId);

    // Only pass through fields vendors may change (keys become SQL column names)
    const sanitizedData: Record<string, unknown> = {};
    for (const field of UPDATABLE_STOREFRONT_FIELDS) {
      if (data[field] !== undefined) {
        sanitizedData[field] = data[field];
      }
    }

    if (typeof sanitizedData.slug === 'string') {
      sanitizedData.slug = sanitizedData.slug.toLowerCase();
      if (sanitizedData.slug !== storefront.slug) {
        await this.assertSlugAvailable(sanitizedData.slug as string, storefrontId);
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return storefront;
    }

    // Perform the update
    const updated = await StorefrontModel.update(storefrontId, sanitizedData as Partial<Storefront>);

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
