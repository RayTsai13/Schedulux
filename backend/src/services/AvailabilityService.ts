/**
 * AvailabilityService - Calculate available appointment slots
 *
 * Database adapter for @schedulux/availability-engine: loads the storefront's
 * rules, drops, and bookings, maps them to engine inputs, and maps results back
 * to API shapes. Priority resolution and slot generation live in the engine.
 */

import { addDays, isAfter, isBefore } from 'date-fns';
import {
  computeSlots,
  checkSlot,
  addDaysToDateStr,
  startOfLocalDay,
  type Rule,
  type Window,
} from '@schedulux/availability-engine';

import { StorefrontModel } from '../models/Storefront';
import { ServiceModel } from '../models/Service';
import { ScheduleRuleModel } from '../models/ScheduleRule';
import { DropModel } from '../models/Drop';
import { AppointmentModel } from '../models/Appointment';
import { AvailabilityResponse, SlotAvailabilityResult } from '../types/availability';
import { ScheduleRule, Drop } from '../types';
import { toDateStr } from '../utils/dates';

/** Rules and drops for a slot's date, in engine form */
export interface SlotContext {
  timezone: string;
  rules: Rule[];
  windows: Window[];
}

export class AvailabilityService {
  /**
   * Get available appointment slots for a storefront/service over a date range
   *
   * @param storefrontId - The storefront to check
   * @param serviceId - The service to book (determines slot duration)
   * @param startDateStr - Start date (YYYY-MM-DD in storefront timezone)
   * @param endDateStr - End date (YYYY-MM-DD in storefront timezone)
   * @returns AvailabilityResponse with slots
   */
  static async getAvailableSlots(
    storefrontId: number,
    serviceId: number,
    startDateStr: string,
    endDateStr: string
  ): Promise<AvailabilityResponse> {
    // 1. Fetch storefront to get timezone
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    // 2. Fetch service to get duration and buffer
    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    if (service.storefront_id !== storefrontId) {
      throw new Error('Service does not belong to this storefront');
    }

    if (!service.is_active) {
      throw new Error('Service is not active');
    }

    const timezone = storefront.timezone || 'UTC';
    const slotDuration = service.duration_minutes + service.buffer_time_minutes;

    // 3. Parse dates in storefront timezone
    const startDate = this.parseLocalDate(startDateStr, timezone);
    const endDate = this.parseLocalDate(endDateStr, timezone);

    // Validate date range
    if (isAfter(startDate, endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 31) {
      throw new Error('Date range cannot exceed 31 days');
    }

    // 4. Fetch schedule rules and published drops for the date range.
    // The model queries compare calendar dates in the DB session timezone, which
    // can differ from the storefront's by a day, so pad the range on both sides.
    // Exact per-day matching happens in getEffectiveTimeBlocksForDate / getDropTimeBlocksForDate.
    const queryStart = addDays(startDate, -1);
    const queryEnd = addDays(endDate, 1);

    const rules = await ScheduleRuleModel.findByDateRange(
      storefrontId,
      serviceId,
      queryStart,
      queryEnd
    );

    // 4b. Fetch published drops for the date range
    const drops = await DropModel.findActiveByDateRange(
      storefrontId,
      queryStart,
      queryEnd
    );
    // Filter drops by service (null service_id = applies to all)
    const applicableDrops = drops.filter(
      d => d.service_id === null || d.service_id === serviceId
    );

    // 5. Fetch existing appointments from local midnight on the start date
    // to local midnight after the end date
    const rangeEnd = this.parseLocalDate(this.nextDateStr(endDateStr), timezone);
    const existingAppointments = await AppointmentModel.findActiveInRange(
      storefrontId,
      startDate,
      rangeEnd,
      null // Check all services for concurrent booking limits
    );

    // 6. Generate slots for each local calendar day in the range
    const slots = computeSlots({
      timezone,
      startDate: startDateStr,
      endDate: endDateStr,
      rules: this.toEngineRules(rules),
      windows: this.toEngineWindows(applicableDrops),
      bookings: existingAppointments.map((apt) => ({
        start: apt.requested_start_datetime,
        end: apt.requested_end_datetime,
      })),
      slotMinutes: slotDuration,
      displayMinutes: service.duration_minutes,
    });

    return {
      storefront_id: storefrontId,
      service_id: serviceId,
      timezone,
      service: {
        name: service.name,
        duration_minutes: service.duration_minutes,
        buffer_time_minutes: service.buffer_time_minutes,
        price: service.price ?? null,
      },
      slots: slots.map((slot) => ({
        start_datetime: slot.start,
        end_datetime: slot.end,
        local_date: slot.localDate,
        local_start_time: slot.localStart,
        local_end_time: slot.localEnd,
        available_capacity: slot.remaining,
      })),
    };
  }

  /**
   * Check if a specific time slot is available for booking
   *
   * @param storefrontId - Storefront to check
   * @param serviceId - Service being booked
   * @param startDatetime - Requested start time (UTC)
   * @param endDatetime - Requested end time (UTC)
   * @returns Availability result with reason if unavailable
   */
  static async isSlotAvailable(
    storefrontId: number,
    serviceId: number,
    startDatetime: Date,
    endDatetime: Date
  ): Promise<SlotAvailabilityResult> {
    const context = await this.loadSlotContext(storefrontId, serviceId, startDatetime);
    if ('available' in context) {
      return context;
    }

    // Count existing overlapping appointments (all services share capacity)
    const currentBookings = await AppointmentModel.countOverlappingAppointments(
      storefrontId,
      startDatetime,
      endDatetime,
      null
    );

    return this.evaluateSlot(context, startDatetime, endDatetime, currentBookings);
  }

  /**
   * Load everything needed to judge a slot except the live booking count:
   * timezone, rules, and drops for the slot's date.
   *
   * Booking writes call this *before* taking their lock, then count overlaps on
   * the transaction's own connection, so nothing inside the lock needs a second
   * pool connection (which could starve the pool under contention).
   */
  static async loadSlotContext(
    storefrontId: number,
    serviceId: number,
    startDatetime: Date
  ): Promise<SlotContext | SlotAvailabilityResult> {
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      return { available: false, reason: 'Storefront not found' };
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service || !service.is_active) {
      return { available: false, reason: 'Service not found or inactive' };
    }

    if (isBefore(startDatetime, new Date())) {
      return { available: false, reason: 'Cannot book slots in the past' };
    }

    // Padded a day each side; see getAvailableSlots
    const queryStart = addDays(startDatetime, -1);
    const queryEnd = addDays(startDatetime, 1);

    const rules = await ScheduleRuleModel.findByDateRange(storefrontId, serviceId, queryStart, queryEnd);
    const drops = await DropModel.findActiveByDateRange(storefrontId, queryStart, queryEnd);
    const applicableDrops = drops.filter((d) => d.service_id === null || d.service_id === serviceId);

    return {
      timezone: storefront.timezone || 'UTC',
      rules: this.toEngineRules(rules),
      windows: this.toEngineWindows(applicableDrops),
    };
  }

  /**
   * Judge a slot against loaded context and a live overlap count (pure)
   */
  static evaluateSlot(
    context: SlotContext,
    startDatetime: Date,
    endDatetime: Date,
    currentBookings: number
  ): SlotAvailabilityResult {
    const result = checkSlot({
      timezone: context.timezone,
      start: startDatetime,
      end: endDatetime,
      rules: context.rules,
      windows: context.windows,
      overlapping: currentBookings,
    });

    if (!result.available) {
      if (result.reason === 'full') {
        return {
          available: false,
          reason: 'Maximum concurrent bookings reached',
          currentBookings,
          maxConcurrent: result.capacity,
        };
      }
      return {
        available: false,
        reason: result.reason === 'past' ? 'Cannot book slots in the past' : 'Slot is outside working hours',
      };
    }

    return {
      available: true,
      currentBookings,
      maxConcurrent: result.capacity,
    };
  }

  private static toEngineRules(rules: ScheduleRule[]): Rule[] {
    return rules.map((rule) => ({
      id: rule.id,
      type: rule.rule_type,
      dayOfWeek: rule.day_of_week,
      date: rule.specific_date ? toDateStr(rule.specific_date) : null,
      month: rule.month,
      year: rule.year,
      start: rule.start_time,
      end: rule.end_time,
      available: rule.is_available,
      capacity: rule.max_concurrent_appointments,
      priority: rule.priority,
    }));
  }

  static toEngineWindows(drops: Drop[]): Window[] {
    return drops.map((drop) => ({
      id: drop.id,
      date: toDateStr(drop.drop_date),
      start: drop.start_time,
      end: drop.end_time,
      capacity: drop.max_concurrent_appointments,
    }));
  }

  private static nextDateStr(dateStr: string): string {
    return addDaysToDateStr(dateStr, 1);
  }

  private static parseLocalDate(dateStr: string, timezone: string): Date {
    return startOfLocalDay(dateStr, timezone);
  }
}
