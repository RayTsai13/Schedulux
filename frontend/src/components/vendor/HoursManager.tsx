import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  useScheduleRules,
  useCreateScheduleRule,
  useUpdateScheduleRule,
  useDeleteScheduleRule,
  formatScheduleRule,
} from '../../hooks/useScheduleRules';
import type {
  ScheduleRule,
  CreateScheduleRuleRequest,
  UpdateScheduleRuleRequest,
  RuleType,
} from '../../services/api';

interface HoursManagerProps {
  storefrontId: number;
}

interface RuleFormData {
  rule_type: RuleType;
  day_of_week: string;
  specific_date: string;
  month: string;
  year: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string;
}

const initialFormData: RuleFormData = {
  rule_type: 'weekly',
  day_of_week: '1',
  specific_date: '',
  month: '1',
  year: '',
  start_time: '09:00',
  end_time: '17:00',
  is_available: true,
  notes: '',
};

const dayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const monthOptions = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function HoursManager({ storefrontId }: HoursManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScheduleRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Queries and mutations
  const { data: rules, isLoading, error } = useScheduleRules(storefrontId);
  const createMutation = useCreateScheduleRule();
  const updateMutation = useUpdateScheduleRule(storefrontId);
  const deleteMutation = useDeleteScheduleRule(storefrontId);

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: ScheduleRule) => {
    setEditingRule(rule);
    setFormData({
      rule_type: rule.rule_type,
      day_of_week: rule.day_of_week?.toString() || '1',
      specific_date: rule.specific_date || '',
      month: rule.month?.toString() || '1',
      year: rule.year?.toString() || '',
      start_time: rule.start_time.substring(0, 5),
      end_time: rule.end_time.substring(0, 5),
      is_available: rule.is_available,
      notes: rule.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateScheduleRuleRequest | UpdateScheduleRuleRequest = {
      rule_type: formData.rule_type,
      start_time: formData.start_time,
      end_time: formData.end_time,
      is_available: formData.is_available,
      notes: formData.notes.trim() || undefined,
    };

    // Add type-specific fields
    if (formData.rule_type === 'weekly') {
      data.day_of_week = parseInt(formData.day_of_week, 10);
    } else if (formData.rule_type === 'daily') {
      data.specific_date = formData.specific_date;
    } else if (formData.rule_type === 'monthly') {
      data.month = parseInt(formData.month, 10);
      if (formData.year) {
        data.year = parseInt(formData.year, 10);
      }
    }

    if (editingRule) {
      await updateMutation.mutateAsync({ id: editingRule.id, data });
    } else {
      await createMutation.mutateAsync({ storefrontId, data: data as CreateScheduleRuleRequest });
    }

    closeModal();
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const getRuleTypeIcon = (ruleType: RuleType) => {
    switch (ruleType) {
      case 'weekly':
        return <Clock className="w-4 h-4" />;
      case 'daily':
        return <Calendar className="w-4 h-4" />;
      case 'monthly':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getRuleTypeBadge = (ruleType: RuleType) => {
    const colors = {
      weekly: 'bg-blue-100 text-blue-700',
      daily: 'bg-orange-100 text-orange-700',
      monthly: 'bg-purple-100 text-purple-700',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[ruleType]}`}
      >
        {ruleType.charAt(0).toUpperCase() + ruleType.slice(1)}
      </span>
    );
  };

  // Group rules by type for display
  const weeklyRules = rules?.filter((r) => r.rule_type === 'weekly') || [];
  const dailyRules = rules?.filter((r) => r.rule_type === 'daily') || [];
  const monthlyRules = rules?.filter((r) => r.rule_type === 'monthly') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Failed to load schedule rules. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Hours</h2>
          <p className="text-sm text-gray-500 mt-1">
            Set your regular hours and special schedule overrides
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {rules && rules.length > 0 ? (
        <div className="space-y-6">
          {/* Weekly Rules */}
          {weeklyRules.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Weekly Schedule
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {weeklyRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onEdit={() => openEditModal(rule)}
                    onDelete={() =>
                      deleteConfirmId === rule.id
                        ? handleDelete(rule.id)
                        : setDeleteConfirmId(rule.id)
                    }
                    deleteConfirm={deleteConfirmId === rule.id}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Daily Rules (Date-specific) */}
          {dailyRules.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                  Date-Specific Rules
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {dailyRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onEdit={() => openEditModal(rule)}
                    onDelete={() =>
                      deleteConfirmId === rule.id
                        ? handleDelete(rule.id)
                        : setDeleteConfirmId(rule.id)
                    }
                    deleteConfirm={deleteConfirmId === rule.id}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Monthly Rules */}
          {monthlyRules.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Monthly Rules
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {monthlyRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onEdit={() => openEditModal(rule)}
                    onDelete={() =>
                      deleteConfirmId === rule.id
                        ? handleDelete(rule.id)
                        : setDeleteConfirmId(rule.id)
                    }
                    deleteConfirm={deleteConfirmId === rule.id}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No business hours set</h3>
          <p className="text-gray-500 mb-4">
            Add your first schedule rule to let customers know when you're available
          </p>
          <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700">
            Set Your Hours
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingRule ? 'Edit Schedule Rule' : 'Add Schedule Rule'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rule Type */}
          <div>
            <Label htmlFor="rule_type">Rule Type *</Label>
            <Select
              value={formData.rule_type}
              onValueChange={(value: RuleType) =>
                setFormData({ ...formData, rule_type: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly (Recurring)</SelectItem>
                <SelectItem value="daily">Specific Date</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type-specific fields */}
          {formData.rule_type === 'weekly' && (
            <div>
              <Label htmlFor="day_of_week">Day of Week *</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.rule_type === 'daily' && (
            <div>
              <Label htmlFor="specific_date">Date *</Label>
              <Input
                id="specific_date"
                type="date"
                value={formData.specific_date}
                onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          )}

          {formData.rule_type === 'monthly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Month *</Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) => setFormData({ ...formData, month: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year (optional)</Label>
                <Input
                  id="year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="Leave blank for recurring"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center space-x-3">
            <input
              id="is_available"
              type="checkbox"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
            />
            <Label htmlFor="is_available" className="cursor-pointer">
              Available for bookings
            </Label>
          </div>

          {!formData.is_available && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                This time slot will be marked as unavailable (e.g., for holidays or closures)
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Holiday hours, Special event"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingRule ? 'Save Changes' : 'Add Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Helper component for rule rows
interface RuleRowProps {
  rule: ScheduleRule;
  onEdit: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
  onCancelDelete: () => void;
  isDeleting: boolean;
}

function RuleRow({
  rule,
  onEdit,
  onDelete,
  deleteConfirm,
  onCancelDelete,
  isDeleting,
}: RuleRowProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <div
          className={`w-2 h-2 rounded-full ${
            rule.is_available ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatScheduleRule(rule)}
          </div>
          {rule.notes && <div className="text-xs text-gray-500">{rule.notes}</div>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!rule.is_active && (
          <span className="text-xs text-gray-400 mr-2">Inactive</span>
        )}
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          title="Edit rule"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {deleteConfirm ? (
          <div className="flex items-center space-x-1">
            <button
              onClick={onDelete}
              className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
              disabled={isDeleting}
            >
              Confirm
            </button>
            <button
              onClick={onCancelDelete}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
