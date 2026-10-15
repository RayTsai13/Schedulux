import { computeSlots, localToUtc, parseClock } from '@schedulux/availability-engine';
import { DropModel } from '../models/Drop';
import { DropWaitlistModel } from '../models/DropWaitlist';
import { StorefrontModel } from '../models/Storefront';
import { ServiceModel } from '../models/Service';
import { AppointmentModel } from '../models/Appointment';
import { AvailabilityService } from './AvailabilityService';
import { EmailService, pageUrl } from './EmailService';
import {
  Drop,
  CreateDropRequest,
  UpdateDropRequest,
  DropSpots,
  PublicDrop,
  VendorDrop,
  Storefront,
} from '../types';
import { toDateStr } from '../utils/dates';

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

  /**
   * Count total and remaining spots for each drop.
   *
   * A drop's spots are the back-to-back slots in its window times its capacity,
   * sized by the drop's service (or the shortest active service when the drop
   * applies to all). Remaining spots subtract every overlapping booking, since
   * capacity is shared across services. One bookings query covers all drops.
   */
  static async countSpots(storefront: Storefront, drops: Drop[]): Promise<Map<number, DropSpots>> {
    const spots = new Map<number, DropSpots>();
    if (drops.length === 0) return spots;

    const services = await ServiceModel.findActiveByStorefrontId(storefront.id);
    const tz = storefront.timezone || 'UTC';
    const windowOf = (d: Drop) => {
      const date = toDateStr(d.drop_date);
      return {
        date,
        start: localToUtc(date, parseClock(d.start_time), tz),
        end: localToUtc(date, parseClock(d.end_time), tz),
      };
    };

    const windows = drops.map(windowOf);
    const rangeStart = new Date(Math.min(...windows.map((w) => w.start.getTime())));
    const rangeEnd = new Date(Math.max(...windows.map((w) => w.end.getTime())));
    const bookings = (await AppointmentModel.findActiveInRange(storefront.id, rangeStart, rangeEnd, null)).map(
      (apt) => ({ start: apt.requested_start_datetime, end: apt.requested_end_datetime })
    );

    drops.forEach((drop, i) => {
      const candidates = drop.service_id === null ? services : services.filter((s) => s.id === drop.service_id);
      if (candidates.length === 0) {
        spots.set(drop.id, { total_spots: 0, remaining_spots: 0 });
        return;
      }
      const slotMinutes = Math.min(...candidates.map((s) => s.duration_minutes + s.buffer_time_minutes));
      const base = {
        timezone: tz,
        startDate: windows[i].date,
        endDate: windows[i].date,
        rules: [],
        windows: AvailabilityService.toEngineWindows([drop]),
        slotMinutes,
      };
      const sum = (slots: { remaining: number }[]) => slots.reduce((n, s) => n + s.remaining, 0);

      spots.set(drop.id, {
        total_spots: sum(computeSlots({ ...base, now: new Date(0) })),
        remaining_spots: sum(computeSlots({ ...base, bookings })),
      });
    });

    return spots;
  }

  static async getDropsByStorefront(storefrontId: number, userId: number): Promise<VendorDrop[]> {
    await this.verifyStorefrontOwnership(storefrontId, userId);
    const storefront = (await StorefrontModel.findById(storefrontId))!;
    const drops = await DropModel.findByStorefrontId(storefrontId);
    const [spots, waitlists] = await Promise.all([
      this.countSpots(storefront, drops),
      DropWaitlistModel.countByDropIds(drops.map((d) => d.id)),
    ]);
    return drops.map((d) => ({
      ...d,
      total_spots: spots.get(d.id)?.total_spots ?? 0,
      remaining_spots: spots.get(d.id)?.remaining_spots ?? 0,
      waitlist_count: waitlists.get(d.id) ?? 0,
    }));
  }

  /**
   * Published drops that haven't ended yet, with spot counts
   */
  static async getPublicDrops(storefront: Storefront): Promise<PublicDrop[]> {
    const now = Date.now();
    const tz = storefront.timezone || 'UTC';
    const drops = (await DropModel.findActiveByStorefrontId(storefront.id)).filter(
      (d) => localToUtc(toDateStr(d.drop_date), parseClock(d.end_time), tz).getTime() > now
    );
    const spots = await this.countSpots(storefront, drops);
    return drops.map((d) => ({
      ...d,
      total_spots: spots.get(d.id)?.total_spots ?? 0,
      remaining_spots: spots.get(d.id)?.remaining_spots ?? 0,
    }));
  }

  /**
   * Join the waitlist for a sold-out drop
   */
  static async joinWaitlist(dropId: number, name: string, email: string): Promise<void> {
    const drop = await DropModel.findById(dropId);
    if (!drop || !drop.is_published || !drop.is_active) {
      throw new Error('Drop not found');
    }
    const storefront = await StorefrontModel.findById(drop.storefront_id);
    if (!storefront) {
      throw new Error('Drop not found');
    }

    const publicDrop = (await this.getPublicDrops(storefront)).find((d) => d.id === dropId);
    if (!publicDrop) {
      throw new Error('Drop has already ended');
    }
    if (publicDrop.remaining_spots > 0) {
      throw new Error('Drop still has open spots');
    }

    await DropWaitlistModel.add(dropId, name.trim(), email.trim().toLowerCase());
  }

  /**
   * Email everyone waiting on a drop that a spot has opened.
   * Fire-and-forget: never throws, never awaited by callers.
   */
  static notifyWaitlist(dropId: number): void {
    (async () => {
      const drop = await DropModel.findById(dropId);
      if (!drop || !drop.is_published || !drop.is_active) return;
      const storefront = await StorefrontModel.findById(drop.storefront_id);
      if (!storefront) return;

      const entries = await DropWaitlistModel.claimUnnotified(dropId);
      for (const entry of entries) {
        EmailService.sendWaitlistSpotOpened(entry.email, {
          name: entry.name,
          dropTitle: drop.title,
          storefrontName: storefront.name,
          dropUrl: pageUrl(storefront.slug, drop.id),
        });
      }
    })().catch((error) => console.error('[DropService] Waitlist notification failed:', error));
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
