import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateScheduleRule,
  useUpdateScheduleRule,
  useDeleteScheduleRule,
} from '../../hooks/useScheduleRules';
import Modal from '../ui/Modal';
import UniversalButton from '../universal/UniversalButton';
import type { ScheduleRule } from '../../services/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Priority defaults by rule type (higher = overrides lower)
const DEFAULT_PRIORITY: Record<string, number> = {
  weekly: 2,
  daily: 10,
  monthly: 5,
};

const ruleSchema = z.object({
  name: z.string().optional(),
  rule_type: z.enum(['weekly', 'daily', 'monthly']),
  day_of_week: z.number().min(0).max(6).nullable().optional(),
  specific_date: z.string().nullable().optional(),
  month: z.coerce.number().min(1).max(12).nullable().optional(),
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().min(2000).max(2100).nullable().optional()
  ),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  is_available: z.boolean(),
  max_concurrent_appointments: z.coerce.number().min(1, 'Must be at least 1'),
  notes: z.string().optional(),
}).refine(
  (d) => d.rule_type !== 'weekly' || (d.day_of_week !== null && d.day_of_week !== undefined),
  { message: 'Day of week is required', path: ['day_of_week'] }
).refine(
  (d) => d.rule_type !== 'daily' || !!d.specific_date,
  { message: 'Date is required', path: ['specific_date'] }
).refine(
  (d) => d.rule_type !== 'monthly' || (d.month !== null && d.month !== undefined),
  { message: 'Month is required', path: ['month'] }
);

type RuleFormData = z.infer<typeof ruleSchema>;

interface ScheduleRuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  storefrontId: number;
  rule?: ScheduleRule | null;
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary ' +
  'placeholder:text-v3-secondary/50 focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent';

const selectClass =
  'w-full px-4 py-3 rounded-xl border border-v3-border bg-v3-background text-v3-primary ' +
  'focus:outline-none focus:ring-2 focus:ring-v3-accent focus:border-transparent';

function buildDefaultValues(rule?: ScheduleRule | null): RuleFormData {
  if (rule) {
    return {
      name: rule.name || '',
      rule_type: rule.rule_type,
      day_of_week: rule.day_of_week ?? null,
      specific_date: rule.specific_date ?? null,
      month: rule.month ?? null,
      year: rule.year ?? null,
      start_time: rule.start_time.substring(0, 5),
      end_time: rule.end_time.substring(0, 5),
      is_available: rule.is_available,
      max_concurrent_appointments: rule.max_concurrent_appointments,
      notes: rule.notes || '',
    };
  }
  return {
    name: '',
    rule_type: 'weekly',
    day_of_week: 1, // Monday
    specific_date: null,
    month: null,
    year: null,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    max_concurrent_appointments: 1,
    notes: '',
  };
}

export default function ScheduleRuleFormModal({
  isOpen,
  onClose,
  storefrontId,
  rule,
}: ScheduleRuleFormModalProps) {
  const isEditing = !!rule;

  const createRule = useCreateScheduleRule();
  const updateRule = useUpdateScheduleRule(storefrontId);
  const deleteRule = useDeleteScheduleRule(storefrontId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: buildDefaultValues(rule),
  });

  const ruleType = useWatch({ control, name: 'rule_type' });
  const isAvailable = useWatch({ control, name: 'is_available' });

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(rule));
    }
  }, [isOpen, rule, reset]);

  // When rule_type changes, reset the type-specific fields and set default priority
  const handleRuleTypeChange = (newType: 'weekly' | 'daily' | 'monthly') => {
    setValue('rule_type', newType);
    setValue('day_of_week', newType === 'weekly' ? 1 : null);
    setValue('specific_date', null);
    setValue('month', newType === 'monthly' ? 1 : null);
    setValue('year', null);
  };

  const onSubmit = async (data: RuleFormData) => {
    try {
      const priority = DEFAULT_PRIORITY[data.rule_type];
      const payload = {
        name: data.name || undefined,
        rule_type: data.rule_type,
        priority,
        day_of_week: data.rule_type === 'weekly' ? data.day_of_week ?? undefined : undefined,
        specific_date: data.rule_type === 'daily' ? data.specific_date ?? undefined : undefined,
        month: data.rule_type === 'monthly' ? data.month ?? undefined : undefined,
        year: data.rule_type === 'monthly' && data.year ? data.year : undefined,
        start_time: data.start_time,
        end_time: data.end_time,
        is_available: data.is_available,
        max_concurrent_appointments: data.max_concurrent_appointments,
        notes: data.notes || undefined,
      };

      if (isEditing) {
        await updateRule.mutateAsync({ id: rule.id, data: payload });
      } else {
        await createRule.mutateAsync({ storefrontId, data: payload });
      }
      onClose();
    } catch {
      // errors surfaced via toast in the hooks
    }
  };

  const handleDelete = async () => {
    if (!rule) return;
    if (!confirm('Delete this availability rule?')) return;
    await deleteRule.mutateAsync(rule.id);
    onClose();
  };

  const isLoading = createRule.isPending || updateRule.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Availability Rule' : 'Add Availability Rule'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Rule Type */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Rule Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['weekly', 'daily', 'monthly'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleRuleTypeChange(type)}
                className={
                  'py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ' +
                  (ruleType === type
                    ? 'border-v3-accent bg-v3-accent/10 text-v3-accent'
                    : 'border-v3-border text-v3-secondary hover:border-v3-accent/50')
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-v3-secondary">
            {ruleType === 'weekly' && 'Repeats every week on a chosen day (e.g. regular hours)'}
            {ruleType === 'daily' && 'One-off override for a specific date (e.g. holiday closure)'}
            {ruleType === 'monthly' && 'Applies to an entire month'}
          </p>
        </div>

        {/* Type-specific fields */}
        {ruleType === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              Day of Week <span className="text-red-500">*</span>
            </label>
            <Controller
              name="day_of_week"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => field.onChange(idx)}
                      className={
                        'py-2 rounded-lg border text-xs font-medium transition-all ' +
                        (field.value === idx
                          ? 'border-v3-accent bg-v3-accent text-white'
                          : 'border-v3-border text-v3-secondary hover:border-v3-accent/50')
                      }
                    >
                      {day.slice(0, 2)}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.day_of_week && (
              <p className="mt-1 text-sm text-red-500">{errors.day_of_week.message}</p>
            )}
          </div>
        )}

        {ruleType === 'daily' && (
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              Specific Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('specific_date')}
              className={inputClass}
            />
            {errors.specific_date && (
              <p className="mt-1 text-sm text-red-500">{errors.specific_date.message}</p>
            )}
          </div>
        )}

        {ruleType === 'monthly' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-v3-primary mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <Controller
                name="month"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    className={selectClass}
                  >
                    <option value="">Select month</option>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                )}
              />
              {errors.month && (
                <p className="mt-1 text-sm text-red-500">{errors.month.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-v3-primary mb-2">
                Year (optional)
              </label>
              <input
                type="number"
                {...register('year')}
                placeholder="Leave blank for every year"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input type="time" {...register('start_time')} className={inputClass} />
            {errors.start_time && (
              <p className="mt-1 text-sm text-red-500">{errors.start_time.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              End Time <span className="text-red-500">*</span>
            </label>
            <input type="time" {...register('end_time')} className={inputClass} />
            {errors.end_time && (
              <p className="mt-1 text-sm text-red-500">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        {/* Availability toggle */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">Status</label>
          <Controller
            name="is_available"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={
                    'py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all ' +
                    (field.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-v3-border text-v3-secondary hover:border-green-300')
                  }
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={
                    'py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all ' +
                    (!field.value
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-v3-border text-v3-secondary hover:border-red-300')
                  }
                >
                  Closed / Blocked
                </button>
              </div>
            )}
          />
          {!isAvailable && (
            <p className="mt-1 text-xs text-v3-secondary">
              This rule will block bookings during these hours, overriding regular weekly hours.
            </p>
          )}
        </div>

        {/* Max concurrent (only shown when open) */}
        {isAvailable && (
          <div>
            <label className="block text-sm font-medium text-v3-primary mb-2">
              Max Simultaneous Bookings
            </label>
            <Controller
              name="max_concurrent_appointments"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  className={inputClass}
                />
              )}
            />
            {errors.max_concurrent_appointments && (
              <p className="mt-1 text-sm text-red-500">{errors.max_concurrent_appointments.message}</p>
            )}
          </div>
        )}

        {/* Optional name */}
        <div>
          <label className="block text-sm font-medium text-v3-primary mb-2">
            Label (optional)
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g., Regular hours, Holiday closure"
            className={inputClass}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {isEditing && (
            <UniversalButton
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteRule.isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Delete
            </UniversalButton>
          )}
          <div className="flex-1" />
          <UniversalButton type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </UniversalButton>
          <UniversalButton type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Rule'}
          </UniversalButton>
        </div>
      </form>
    </Modal>
  );
}
