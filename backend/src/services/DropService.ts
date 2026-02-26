import { DropModel } from '../models/Drop';
import { StorefrontModel } from '../models/Storefront';
import { Drop, CreateDropRequest, UpdateDropRequest } from '../types';

export class DropService {

  private static async verifyStorefrontOwnership(storefrontId: number, vendorId: number): Promise<void> {
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      throw new Error('Storefront not found');
    }
    if (storefront.vendor_id !== vendorId) {
      throw new Error('Forbidden: You do not own this storefront');
    }
  }

  private static async verifyDropOwnership(dropId: number, vendorId: number): Promise<Drop> {
    const drop = await DropModel.findById(dropId);
    if (!drop) {
      throw new Error('Drop not found');
    }
    await this.verifyStorefrontOwnership(drop.storefront_id, vendorId);
    return drop;
  }

  private static validateTimeRange(startTime: string, endTime: string): void {
    const parseTime = (time: string): number => {
      const parts = time.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };
    if (parseTime(startTime) >= parseTime(endTime)) {
      throw new Error('start_time must be before end_time');
    }
  }

  static async getDropsByStorefront(storefrontId: number, userId: number): Promise<Drop[]> {
    await this.verifyStorefrontOwnership(storefrontId, userId);
    return await DropModel.findByStorefrontId(storefrontId);
  }

  static async getPublicDrops(storefrontId: number): Promise<Drop[]> {
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      throw new Error('Storefront not found');
    }
    // Return only future published drops
    const drops = await DropModel.findActiveByStorefrontId(storefrontId);
    const today = new Date().toISOString().substring(0, 10);
    return drops.filter(d => {
      const dropDate = typeof d.drop_date === 'string'
        ? d.drop_date.substring(0, 10)
        : new Date(d.drop_date).toISOString().substring(0, 10);
      return dropDate >= today;
    });
  }

  static async getDropById(id: number, userId: number): Promise<Drop> {
    return await this.verifyDropOwnership(id, userId);
  }

  static async createDrop(
    storefrontId: number,
    userId: number,
    data: CreateDropRequest
  ): Promise<Drop> {
    await this.verifyStorefrontOwnership(storefrontId, userId);

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('title is required');
    }

    if (!data.drop_date) {
      throw new Error('drop_date is required');
    }

    if (!data.start_time || !data.end_time) {
      throw new Error('start_time and end_time are required');
    }

    this.validateTimeRange(data.start_time, data.end_time);

    return await DropModel.create(storefrontId, data);
  }

  static async updateDrop(
    id: number,
    userId: number,
    data: UpdateDropRequest
  ): Promise<Drop> {
    const existingDrop = await this.verifyDropOwnership(id, userId);

    if (data.start_time || data.end_time) {
      const newStartTime = data.start_time ?? existingDrop.start_time;
      const newEndTime = data.end_time ?? existingDrop.end_time;
      this.validateTimeRange(newStartTime, newEndTime);
    }

    if (data.max_concurrent_appointments !== undefined && data.max_concurrent_appointments <= 0) {
      throw new Error('max_concurrent_appointments must be greater than 0');
    }

    const updated = await DropModel.update(id, data);
    if (!updated) {
      throw new Error('Failed to update drop');
    }

    return updated;
  }

  static async deleteDrop(id: number, userId: number): Promise<boolean> {
    await this.verifyDropOwnership(id, userId);

    const deleted = await DropModel.softDelete(id);
    if (!deleted) {
      throw new Error('Failed to delete drop');
    }

    return deleted;
  }
}
