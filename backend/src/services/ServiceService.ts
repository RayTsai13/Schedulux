/**
 * ServiceService - Business Logic Layer for Service Operations
 *
 * This service handles business logic for services (vendor offerings like "Haircut - 30min").
 * It ensures ownership validation: vendors can only manage services in their own storefronts.
 */

import { ServiceModel } from '../models/Service';
import { StorefrontModel } from '../models/Storefront';
import { Service, CreateServiceRequest, UpdateServiceRequest } from '../types';

export class ServiceService {

  /**
   * Verify that a storefront exists and belongs to the specified vendor
   */
  private static async verifyStorefrontOwnership(storefrontId: number, vendorId: number): Promise<void> {
    const storefront = await StorefrontModel.findById(storefrontId);

    if (!storefront) {
      throw new Error('Storefront not found');
    }

    if (storefront.vendor_id !== vendorId) {
      throw new Error('Forbidden: You do not own this storefront');
    }
  }

  /**
   * Verify that a service exists and belongs to a storefront owned by the vendor
   */
  private static async verifyServiceOwnership(serviceId: number, vendorId: number): Promise<Service> {
    const service = await ServiceModel.findById(serviceId);

    if (!service) {
      throw new Error('Service not found');
    }

    // Verify the storefront this service belongs to is owned by the vendor
    await this.verifyStorefrontOwnership(service.storefront_id, vendorId);

    return service;
  }

  /**
   * Get all services for a storefront (public - shows only active services)
   */
  static async getPublicByStorefront(storefrontId: number): Promise<Service[]> {
    // Verify storefront exists (but don't check ownership - this is public)
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    return await ServiceModel.findActiveByStorefrontId(storefrontId);
  }

  /**
   * Get all services for a storefront (private - shows all services including inactive)
   */
  static async getAllByStorefront(storefrontId: number, vendorId: number): Promise<Service[]> {
    await this.verifyStorefrontOwnership(storefrontId, vendorId);
    return await ServiceModel.findByStorefrontId(storefrontId);
  }

  /**
   * Get a single service by ID
   */
  static async getById(serviceId: number): Promise<Service> {
    const service = await ServiceModel.findById(serviceId);

    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  /**
   * Create a new service in a storefront
   */
  static async create(
    storefrontId: number,
    vendorId: number,
    data: CreateServiceRequest
  ): Promise<Service> {
    // Verify vendor owns the storefront
    await this.verifyStorefrontOwnership(storefrontId, vendorId);

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Service name is required');
    }

    if (!data.duration_minutes || data.duration_minutes <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    return await ServiceModel.create(storefrontId, data);
  }

  /**
   * Update a service
   */
  static async update(
    serviceId: number,
    vendorId: number,
    data: UpdateServiceRequest
  ): Promise<Service> {
    // Verify vendor owns the service's storefront
    await this.verifyServiceOwnership(serviceId, vendorId);

    // Validate duration if provided
    if (data.duration_minutes !== undefined && data.duration_minutes <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    const updated = await ServiceModel.update(serviceId, data);

    if (!updated) {
      throw new Error('Failed to update service');
    }

    return updated;
  }

  /**
   * Soft delete a service
   */
  static async delete(serviceId: number, vendorId: number): Promise<boolean> {
    // Verify vendor owns the service's storefront
    await this.verifyServiceOwnership(serviceId, vendorId);

    const deleted = await ServiceModel.softDelete(serviceId);

    if (!deleted) {
      throw new Error('Failed to delete service');
    }

    return deleted;
  }
}
