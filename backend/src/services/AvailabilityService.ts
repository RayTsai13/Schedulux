/**
 * AvailabilityService - Calculate available appointment slots
 *
 * This service implements the core availability calculation engine:
 * 1. Fetches schedule rules and applies priority resolution
 * 2. Builds working hours from rules for each day
 * 3. Subtracts existing appointments
 * 4. Generates bookable time slots
 */

import {
  parseISO,
  format,
  addMinutes,
  addDays,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isEqual,
  getDay,
  getMonth,
  getYear,
  differenceInMinutes,
  max as dateMax,
  min as dateMin,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

import { StorefrontModel } from '../models/Storefront';
import { ServiceModel } from '../models/Service';
import { ScheduleRuleModel } from '../models/ScheduleRule';
import { AppointmentModel } from '../models/Appointment';
import {
  AvailableSlot,
  AvailabilityResponse,
  TimeBlock,
  SlotAvailabilityResult,
} from '../types/availability';
import { ScheduleRule } from '../types';

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

    // 4. Fetch schedule rules for the date range
    const rules = await ScheduleRuleModel.findByDateRange(
      storefrontId,
      serviceId,
      startDate,
      endDate
    );

    // 5. Fetch existing appointments in the range
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);
    const existingAppointments = await AppointmentModel.findActiveInRange(
      storefrontId,
      rangeStart,
      rangeEnd,
      null // Check all services for concurrent booking limits
    );

    // 6. Generate slots for each day in the range
    const allSlots: AvailableSlot[] = [];
    let currentDate = startDate;

    while (!isAfter(currentDate, endDate)) {
      const daySlots = this.generateSlotsForDay(
        currentDate,
        timezone,
        rules,
        existingAppointments,
        slotDuration,
        service.duration_minutes,
        0 // V1: No travel buffer yet, V2: Calculate dynamically based on appointment locations
      );
      allSlots.push(...daySlots);
      currentDate = addDays(currentDate, 1);
    }

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
      slots: allSlots,
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
    // 1. Fetch storefront and service
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      return { available: false, reason: 'Storefront not found' };
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service || !service.is_active) {
      return { available: false, reason: 'Service not found or inactive' };
    }

    const timezone = storefront.timezone || 'UTC';

    // 2. Check if slot is in the past
    if (isBefore(startDatetime, new Date())) {
      return { available: false, reason: 'Cannot book slots in the past' };
    }

    // 3. Get effective rules for the date
    const rules = await ScheduleRuleModel.findByDateRange(
      storefrontId,
      serviceId,
      startDatetime,
      startDatetime
    );

    // 4. Check if slot falls within working hours
    const localStart = toZonedTime(startDatetime, timezone);
    const effectiveBlocks = this.getEffectiveTimeBlocksForDate(
      localStart,
      timezone,
      rules
    );

    const slotWithinWorkingHours = effectiveBlocks.some((block) => {
      return (
        block.isAvailable &&
        !isBefore(startDatetime, block.start) &&
        !isAfter(endDatetime, block.end)
      );
    });

    if (!slotWithinWorkingHours) {
      return { available: false, reason: 'Slot is outside working hours' };
    }

    // 5. Find the applicable rule for max_concurrent
    const applicableBlock = effectiveBlocks.find((block) => {
      return (
        block.isAvailable &&
        !isBefore(startDatetime, block.start) &&
        !isAfter(endDatetime, block.end)
      );
    });

    const maxConcurrent = applicableBlock?.maxConcurrent ?? 1;

    // 6. Count existing overlapping appointments
    const currentBookings = await AppointmentModel.countOverlappingAppointments(
      storefrontId,
      startDatetime,
      endDatetime,
      null // Check all services for concurrent limit
    );

    if (currentBookings >= maxConcurrent) {
      return {
        available: false,
        reason: 'Maximum concurrent bookings reached',
        currentBookings,
        maxConcurrent,
      };
    }

    return {
      available: true,
      currentBookings,
      maxConcurrent,
    };
  }

  /**
   * Generate available slots for a single day
   *
   * @param travelBuffer - Minutes to add for travel between appointments (default: 0)
   *                       V1: Always 0 (future-proofing for V2 dynamic travel time calculation)
   */
  private static generateSlotsForDay(
    date: Date,
    timezone: string,
    allRules: ScheduleRule[],
    allAppointments: any[],
    slotDuration: number,
    displayDuration: number,
    travelBuffer: number = 0
  ): AvailableSlot[] {
    // Get effective time blocks for this day
    const timeBlocks = this.getEffectiveTimeBlocksForDate(date, timezone, allRules);

    // Filter appointments for this day
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const dayAppointments = allAppointments.filter((apt) => {
      const aptStart = new Date(apt.requested_start_datetime);
      const aptEnd = new Date(apt.requested_end_datetime);
      return isBefore(aptStart, dayEnd) && isAfter(aptEnd, dayStart);
    });

    const slots: AvailableSlot[] = [];
    const now = new Date();

    // For each available time block, generate slots
    for (const block of timeBlocks) {
      if (!block.isAvailable) continue;

      let slotStart = block.start;

      while (true) {
        const slotEnd = addMinutes(slotStart, slotDuration);

        // Stop if slot would extend past block end
        if (isAfter(slotEnd, block.end)) break;

        // Skip slots in the past
        if (!isBefore(slotStart, now)) {
          // Count appointments that overlap with this slot
          const overlappingCount = dayAppointments.filter((apt) => {
            const aptStart = new Date(apt.requested_start_datetime);
            const aptEnd = new Date(apt.requested_end_datetime);
            return isBefore(aptStart, slotEnd) && isAfter(aptEnd, slotStart);
          }).length;

          const availableCapacity = block.maxConcurrent - overlappingCount;

          // Only include slot if there's capacity
          if (availableCapacity > 0) {
            const localStart = toZonedTime(slotStart, timezone);
            const displayEnd = addMinutes(slotStart, displayDuration);
            const localEnd = toZonedTime(displayEnd, timezone);

            slots.push({
              start_datetime: slotStart.toISOString(),
              end_datetime: slotEnd.toISOString(),
              local_date: format(localStart, 'yyyy-MM-dd'),
              local_start_time: format(localStart, 'HH:mm'),
              local_end_time: format(localEnd, 'HH:mm'),
              available_capacity: availableCapacity,
            });
          }
        }

        // Move to next slot
        slotStart = slotEnd;
      }
    }

    return slots;
  }

  /**
   * Get effective time blocks for a specific date
   * Applies priority resolution: daily > monthly > weekly
   */
  private static getEffectiveTimeBlocksForDate(
    date: Date,
    timezone: string,
    allRules: ScheduleRule[]
  ): TimeBlock[] {
    const localDate = toZonedTime(date, timezone);
    const dayOfWeek = getDay(localDate);
    const month = getMonth(localDate) + 1; // 1-12
    const year = getYear(localDate);
    const dateStr = format(localDate, 'yyyy-MM-dd');

    // Filter rules applicable to this date
    const applicableRules = allRules.filter((rule) => {
      if (rule.rule_type === 'weekly') {
        return rule.day_of_week === dayOfWeek;
      }
      if (rule.rule_type === 'daily') {
        // Compare date strings to handle timezone correctly
        const ruleDate = rule.specific_date;
        if (!ruleDate) return false;
        if (typeof ruleDate === 'string') {
          return ruleDate.substring(0, 10) === dateStr;
        }
        return format(new Date(ruleDate), 'yyyy-MM-dd') === dateStr;
      }
      if (rule.rule_type === 'monthly') {
        const monthMatch = rule.month === month;
        const yearMatch = rule.year === null || rule.year === year;
        return monthMatch && yearMatch;
      }
      return false;
    });

    // Sort by priority (higher first)
    applicableRules.sort((a, b) => b.priority - a.priority);

    // Convert rules to time blocks
    const blocks: TimeBlock[] = applicableRules.map((rule) => {
      const dayStart = startOfDay(localDate);

      // Parse start and end times
      const [startHour, startMin] = rule.start_time.split(':').map(Number);
      const [endHour, endMin] = rule.end_time.split(':').map(Number);

      const blockStartLocal = addMinutes(
        addMinutes(dayStart, startHour * 60),
        startMin
      );
      const blockEndLocal = addMinutes(
        addMinutes(dayStart, endHour * 60),
        endMin
      );

      // Convert to UTC for storage/comparison
      const blockStartUtc = fromZonedTime(blockStartLocal, timezone);
      const blockEndUtc = fromZonedTime(blockEndLocal, timezone);

      return {
        start: blockStartUtc,
        end: blockEndUtc,
        isAvailable: rule.is_available,
        maxConcurrent: rule.max_concurrent_appointments,
        priority: rule.priority,
        ruleId: rule.id,
      };
    });

    // Merge overlapping blocks (higher priority wins)
    return this.mergeTimeBlocks(blocks);
  }

  /**
   * Merge overlapping time blocks, with higher priority taking precedence
   */
  private static mergeTimeBlocks(blocks: TimeBlock[]): TimeBlock[] {
    if (blocks.length === 0) return [];

    // Sort by start time, then by priority (descending)
    const sorted = [...blocks].sort((a, b) => {
      const startDiff = a.start.getTime() - b.start.getTime();
      if (startDiff !== 0) return startDiff;
      return b.priority - a.priority;
    });

    const result: TimeBlock[] = [];
    const events: Array<{
      time: Date;
      type: 'start' | 'end';
      block: TimeBlock;
    }> = [];

    // Create events for each block
    for (const block of sorted) {
      events.push({ time: block.start, type: 'start', block });
      events.push({ time: block.end, type: 'end', block });
    }

    // Sort events by time
    events.sort((a, b) => {
      const timeDiff = a.time.getTime() - b.time.getTime();
      if (timeDiff !== 0) return timeDiff;
      // Process ends before starts at the same time
      if (a.type !== b.type) return a.type === 'end' ? -1 : 1;
      return 0;
    });

    // Process events using a sweep line algorithm
    const activeBlocks: TimeBlock[] = [];
    let lastTime: Date | null = null;

    for (const event of events) {
      // Emit segment if we have active blocks and time has advanced
      if (lastTime && activeBlocks.length > 0 && event.time > lastTime) {
        // Find highest priority active block
        const topBlock = activeBlocks.reduce((max, b) =>
          b.priority > max.priority ? b : max
        );

        result.push({
          start: lastTime,
          end: event.time,
          isAvailable: topBlock.isAvailable,
          maxConcurrent: topBlock.maxConcurrent,
          priority: topBlock.priority,
          ruleId: topBlock.ruleId,
        });
      }

      // Update active blocks
      if (event.type === 'start') {
        activeBlocks.push(event.block);
      } else {
        const idx = activeBlocks.findIndex((b) => b === event.block);
        if (idx !== -1) activeBlocks.splice(idx, 1);
      }

      lastTime = event.time;
    }

    // Merge adjacent blocks with same properties
    return this.consolidateBlocks(result);
  }

  /**
   * Consolidate adjacent blocks with same availability settings
   */
  private static consolidateBlocks(blocks: TimeBlock[]): TimeBlock[] {
    if (blocks.length === 0) return [];

    const result: TimeBlock[] = [blocks[0]];

    for (let i = 1; i < blocks.length; i++) {
      const prev = result[result.length - 1];
      const curr = blocks[i];

      // Merge if adjacent and same settings
      if (
        isEqual(prev.end, curr.start) &&
        prev.isAvailable === curr.isAvailable &&
        prev.maxConcurrent === curr.maxConcurrent
      ) {
        prev.end = curr.end;
      } else {
        result.push(curr);
      }
    }

    return result;
  }

  /**
   * Parse a local date string (YYYY-MM-DD) into a Date object at midnight in the given timezone
   */
  private static parseLocalDate(dateStr: string, timezone: string): Date {
    // Parse as local date and convert to UTC
    const localMidnight = parseISO(`${dateStr}T00:00:00`);
    return fromZonedTime(localMidnight, timezone);
  }
}
