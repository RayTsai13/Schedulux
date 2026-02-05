// Schedule Rule types - defines vendor availability patterns
// Rule types: weekly (recurring), daily (specific date), monthly (recurring monthly)

export type RuleType = 'weekly' | 'daily' | 'monthly';

export interface ScheduleRule {
  id: number;
  storefront_id: number;
  service_id: number | null; // null = applies to all services

  // Rule type and priority
  rule_type: RuleType;
  priority: number; // Higher priority rules take precedence

  // Time specifications (only relevant fields filled based on rule_type)
  day_of_week: number | null; // 0=Sunday, 6=Saturday (for weekly)
  specific_date: string | null; // ISO date string (for daily)
  month: number | null; // 1-12 (for monthly)
  year: number | null; // Optional year (for monthly)

  // Time slots
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format

  // Availability settings
  is_available: boolean;
  max_concurrent_appointments: number;

  // Metadata
  name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateScheduleRuleRequest {
  service_id?: number | null; // null = applies to all services
  rule_type: RuleType;
  priority?: number;

  // Time specifications
  day_of_week?: number; // Required for weekly
  specific_date?: string; // Required for daily (YYYY-MM-DD format)
  month?: number; // Required for monthly
  year?: number; // Optional for monthly

  // Time slots (required)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format

  // Availability settings
  is_available?: boolean;
  max_concurrent_appointments?: number;

  // Metadata
  name?: string;
  notes?: string;
}

export interface UpdateScheduleRuleRequest {
  service_id?: number | null;
  rule_type?: RuleType;
  priority?: number;

  // Time specifications
  day_of_week?: number | null;
  specific_date?: string | null;
  month?: number | null;
  year?: number | null;

  // Time slots
  start_time?: string;
  end_time?: string;

  // Availability settings
  is_available?: boolean;
  max_concurrent_appointments?: number;

  // Metadata
  name?: string | null;
  notes?: string | null;
  is_active?: boolean;
}