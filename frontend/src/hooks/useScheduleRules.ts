import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  scheduleRuleApi,
  type ScheduleRule,
  type CreateScheduleRuleRequest,
  type UpdateScheduleRuleRequest,
} from '../services/api';
import { toast } from 'sonner';

/**
 * TanStack Query Hooks for Schedule Rule Management
 */

// Query Keys
export const scheduleRuleKeys = {
  all: (storefrontId: number) => ['scheduleRules', storefrontId] as const,
  detail: (id: number) => ['scheduleRules', 'detail', id] as const,
};

/**
 * Fetch all schedule rules for a storefront (including inactive)
 */
export function useScheduleRules(storefrontId: number | null) {
  return useQuery({
    queryKey: scheduleRuleKeys.all(storefrontId!),
    queryFn: async () => {
      const response = await scheduleRuleApi.getAllByStorefront(storefrontId!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch schedule rules');
      }
      return response.data || [];
    },
    enabled: !!storefrontId,
  });
}

/**
 * Fetch a single schedule rule by ID
 */
export function useScheduleRule(id: number | null) {
  return useQuery({
    queryKey: scheduleRuleKeys.detail(id!),
    queryFn: async () => {
      const response = await scheduleRuleApi.getById(id!);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch schedule rule');
      }
      return response.data!;
    },
    enabled: !!id,
  });
}

/**
 * Create a new schedule rule
 */
export function useCreateScheduleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storefrontId, data }: { storefrontId: number; data: CreateScheduleRuleRequest }) =>
      scheduleRuleApi.create(storefrontId, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: scheduleRuleKeys.all(variables.storefrontId) });
        toast.success('Schedule rule created successfully!');
      } else {
        toast.error(response.message || 'Failed to create schedule rule');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create schedule rule');
    },
  });
}

/**
 * Update a schedule rule
 */
export function useUpdateScheduleRule(storefrontId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateScheduleRuleRequest }) =>
      scheduleRuleApi.update(id, data),

    onSuccess: (response, variables) => {
      if (response.success) {
        if (storefrontId) {
          queryClient.invalidateQueries({ queryKey: scheduleRuleKeys.all(storefrontId) });
        }
        queryClient.invalidateQueries({ queryKey: scheduleRuleKeys.detail(variables.id) });
        toast.success('Schedule rule updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update schedule rule');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update schedule rule');
    },
  });
}

/**
 * Delete a schedule rule
 */
export function useDeleteScheduleRule(storefrontId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => scheduleRuleApi.delete(id),

    onSuccess: (response) => {
      if (response.success) {
        if (storefrontId) {
          queryClient.invalidateQueries({ queryKey: scheduleRuleKeys.all(storefrontId) });
        }
        toast.success('Schedule rule deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete schedule rule');
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete schedule rule');
    },
  });
}

// Helper function to format rule for display
export function formatScheduleRule(rule: ScheduleRule): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const timeRange = `${formatTime(rule.start_time)} - ${formatTime(rule.end_time)}`;
  const availability = rule.is_available ? '' : ' (Closed)';

  switch (rule.rule_type) {
    case 'weekly':
      return `${dayNames[rule.day_of_week!]} ${timeRange}${availability}`;
    case 'daily':
      return `${rule.specific_date} ${timeRange}${availability}`;
    case 'monthly':
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[rule.month! - 1]}${rule.year ? ` ${rule.year}` : ''} ${timeRange}${availability}`;
    default:
      return timeRange;
  }
}
