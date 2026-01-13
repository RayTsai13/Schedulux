/**
 * ScheduleRuleService - Business Logic Layer for Schedule Rule Operations
 *
 * This service handles business logic for schedule rules (vendor availability patterns).
 * It ensures ownership validation and validates rule-type-specific requirements.
 */

import { ScheduleRuleModel } from '../models/ScheduleRule';
import { StorefrontModel } from '../models/Storefront';
import { ScheduleRule, CreateScheduleRuleRequest, UpdateScheduleRuleRequest } from '../types';

export class ScheduleRuleService {

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
   * Verify that a schedule rule exists and belongs to a storefront owned by the vendor
   */
  private static async verifyRuleOwnership(ruleId: number, vendorId: number): Promise<ScheduleRule> {
    const rule = await ScheduleRuleModel.findById(ruleId);

    if (!rule) {
      throw new Error('Schedule rule not found');
    }

    await this.verifyStorefrontOwnership(rule.storefront_id, vendorId);

    return rule;
  }

  /**
   * Validate that start_time is before end_time
   */
  private static validateTimeRange(startTime: string, endTime: string): void {
    // Parse times (expected format: HH:MM or HH:MM:SS)
    const parseTime = (time: string): number => {
      const parts = time.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    if (startMinutes >= endMinutes) {
      throw new Error('start_time must be before end_time');
    }
  }

  /**
   * Validate rule-type-specific requirements
   */
  private static validateRuleTypeRequirements(data: CreateScheduleRuleRequest | UpdateScheduleRuleRequest): void {
    // For create requests, rule_type is required
    if ('rule_type' in data && data.rule_type !== undefined) {
      const ruleType = data.rule_type;

      if (ruleType === 'weekly') {
        if (data.day_of_week === undefined || data.day_of_week === null) {
          throw new Error('day_of_week is required for weekly rules (0=Sunday, 6=Saturday)');
        }
        if (data.day_of_week < 0 || data.day_of_week > 6) {
          throw new Error('day_of_week must be between 0 (Sunday) and 6 (Saturday)');
        }
      }

      if (ruleType === 'daily') {
        if (!data.specific_date) {
          throw new Error('specific_date is required for daily rules (format: YYYY-MM-DD)');
        }
        // Basic date format validation
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.specific_date)) {
          throw new Error('specific_date must be in YYYY-MM-DD format');
        }
      }

      if (ruleType === 'monthly') {
        if (data.month === undefined || data.month === null) {
          throw new Error('month is required for monthly rules (1-12)');
        }
        if (data.month < 1 || data.month > 12) {
          throw new Error('month must be between 1 and 12');
        }
      }
    }
  }

  /**
   * Get all schedule rules for a storefront (public - shows only active rules)
   */
  static async getPublicByStorefront(storefrontId: number): Promise<ScheduleRule[]> {
    const storefront = await StorefrontModel.findById(storefrontId);
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    return await ScheduleRuleModel.findActiveByStorefrontId(storefrontId);
  }

  /**
   * Get all schedule rules for a storefront (private - shows all rules including inactive)
   */
  static async getAllByStorefront(storefrontId: number, vendorId: number): Promise<ScheduleRule[]> {
    await this.verifyStorefrontOwnership(storefrontId, vendorId);
    return await ScheduleRuleModel.findByStorefrontId(storefrontId);
  }

  /**
   * Get a single schedule rule by ID
   */
  static async getById(ruleId: number): Promise<ScheduleRule> {
    const rule = await ScheduleRuleModel.findById(ruleId);

    if (!rule) {
      throw new Error('Schedule rule not found');
    }

    return rule;
  }

  /**
   * Create a new schedule rule
   */
  static async create(
    storefrontId: number,
    vendorId: number,
    data: CreateScheduleRuleRequest
  ): Promise<ScheduleRule> {
    // Verify vendor owns the storefront
    await this.verifyStorefrontOwnership(storefrontId, vendorId);

    // Validate required fields
    if (!data.rule_type) {
      throw new Error('rule_type is required (weekly, daily, or monthly)');
    }

    if (!data.start_time || !data.end_time) {
      throw new Error('start_time and end_time are required');
    }

    // Validate time range
    this.validateTimeRange(data.start_time, data.end_time);

    // Validate rule-type-specific requirements
    this.validateRuleTypeRequirements(data);

    return await ScheduleRuleModel.create(storefrontId, data);
  }

  /**
   * Update a schedule rule
   */
  static async update(
    ruleId: number,
    vendorId: number,
    data: UpdateScheduleRuleRequest
  ): Promise<ScheduleRule> {
    // Verify vendor owns the rule's storefront
    const existingRule = await this.verifyRuleOwnership(ruleId, vendorId);

    // If updating time range, validate it
    const newStartTime = data.start_time ?? existingRule.start_time;
    const newEndTime = data.end_time ?? existingRule.end_time;
    if (data.start_time || data.end_time) {
      this.validateTimeRange(newStartTime, newEndTime);
    }

    // If updating rule_type or related fields, validate requirements
    if (data.rule_type !== undefined) {
      // When changing rule type, validate the new type's requirements
      this.validateRuleTypeRequirements(data);
    }

    // Validate day_of_week range if provided
    if (data.day_of_week !== undefined && data.day_of_week !== null) {
      if (data.day_of_week < 0 || data.day_of_week > 6) {
        throw new Error('day_of_week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Validate month range if provided
    if (data.month !== undefined && data.month !== null) {
      if (data.month < 1 || data.month > 12) {
        throw new Error('month must be between 1 and 12');
      }
    }

    // Validate priority if provided
    if (data.priority !== undefined && data.priority <= 0) {
      throw new Error('priority must be greater than 0');
    }

    // Validate max_concurrent_appointments if provided
    if (data.max_concurrent_appointments !== undefined && data.max_concurrent_appointments <= 0) {
      throw new Error('max_concurrent_appointments must be greater than 0');
    }

    const updated = await ScheduleRuleModel.update(ruleId, data);

    if (!updated) {
      throw new Error('Failed to update schedule rule');
    }

    return updated;
  }

  /**
   * Soft delete a schedule rule
   */
  static async delete(ruleId: number, vendorId: number): Promise<boolean> {
    // Verify vendor owns the rule's storefront
    await this.verifyRuleOwnership(ruleId, vendorId);

    const deleted = await ScheduleRuleModel.softDelete(ruleId);

    if (!deleted) {
      throw new Error('Failed to delete schedule rule');
    }

    return deleted;
  }
}
