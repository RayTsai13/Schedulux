import { useState } from 'react';
import { Clock, Copy, Plus, Trash2 } from 'lucide-react';
import type { BusinessHours } from '../../services/api';

interface BusinessHoursEditorProps {
  value: BusinessHours | undefined;
  onChange: (hours: BusinessHours) => void;
}

interface TimePeriod {
  start: string;
  end: string;
}

const DAYS = [
  { key: 'sunday', label: 'Sunday', abbr: 'Sun' },
  { key: 'monday', label: 'Monday', abbr: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', abbr: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', abbr: 'Wed' },
  { key: 'thursday', label: 'Thursday', abbr: 'Thu' },
  { key: 'friday', label: 'Friday', abbr: 'Fri' },
  { key: 'saturday', label: 'Saturday', abbr: 'Sat' },
];

const BusinessHoursEditor = ({ value, onChange }: BusinessHoursEditorProps) => {
  const [copyFromDay, setCopyFromDay] = useState<string>('');

  // Initialize business hours if not provided
  const businessHours: BusinessHours = value || {
    sunday: { isOpen: false, periods: [] },
    monday: { isOpen: true, periods: [{ start: '09:00', end: '17:00' }] },
    tuesday: { isOpen: true, periods: [{ start: '09:00', end: '17:00' }] },
    wednesday: { isOpen: true, periods: [{ start: '09:00', end: '17:00' }] },
    thursday: { isOpen: true, periods: [{ start: '09:00', end: '17:00' }] },
    friday: { isOpen: true, periods: [{ start: '09:00', end: '17:00' }] },
    saturday: { isOpen: false, periods: [] },
  };

  const handleToggleDay = (day: string) => {
    const newHours = { ...businessHours };
    newHours[day] = {
      isOpen: !newHours[day].isOpen,
      periods: newHours[day].isOpen ? [] : [{ start: '09:00', end: '17:00' }],
    };
    onChange(newHours);
  };

  const handleAddPeriod = (day: string) => {
    const newHours = { ...businessHours };
    const lastPeriod = newHours[day].periods[newHours[day].periods.length - 1];
    const newStart = lastPeriod ? lastPeriod.end : '09:00';
    const newEnd = lastPeriod ? addHours(lastPeriod.end, 1) : '17:00';

    newHours[day].periods.push({ start: newStart, end: newEnd });
    onChange(newHours);
  };

  const handleRemovePeriod = (day: string, index: number) => {
    const newHours = { ...businessHours };
    newHours[day].periods.splice(index, 1);
    onChange(newHours);
  };

  const handleUpdatePeriod = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const newHours = { ...businessHours };
    newHours[day].periods[index][field] = value;
    onChange(newHours);
  };

  const handleCopyToDay = (targetDay: string) => {
    if (!copyFromDay || copyFromDay === targetDay) return;

    const newHours = { ...businessHours };
    newHours[targetDay] = {
      isOpen: businessHours[copyFromDay].isOpen,
      periods: businessHours[copyFromDay].periods.map((p) => ({ ...p })),
    };
    onChange(newHours);
  };

  const handleCopyToAllDays = (sourceDay: string) => {
    const newHours = { ...businessHours };
    const sourceConfig = businessHours[sourceDay];

    DAYS.forEach((day) => {
      if (day.key !== sourceDay) {
        newHours[day.key] = {
          isOpen: sourceConfig.isOpen,
          periods: sourceConfig.isOpen ? sourceConfig.periods.map((p) => ({ ...p })) : [],
        };
      }
    });

    onChange(newHours);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Business Hours
        </label>
        <span className="text-xs text-gray-500">Set your weekly schedule</span>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const dayData = businessHours[day.key];
          const isOpen = dayData?.isOpen || false;
          const periods = dayData?.periods || [];

          return (
            <div
              key={day.key}
              className="bg-gray-50 rounded-lg border border-gray-200 p-4"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* Open/Closed Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleDay(day.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isOpen ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isOpen ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Day Name */}
                  <span className="font-medium text-gray-900">{day.label}</span>

                  {/* Status Badge */}
                  {isOpen ? (
                    <span className="text-xs text-green-600 font-medium">Open</span>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">Closed</span>
                  )}
                </div>

                {/* Copy Actions */}
                {isOpen && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCopyToAllDays(day.key)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy to all</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Time Periods */}
              {isOpen && (
                <div className="space-y-2">
                  {periods.map((period, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {/* Start Time */}
                      <div className="flex items-center space-x-2 flex-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <input
                          type="time"
                          value={period.start}
                          onChange={(e) =>
                            handleUpdatePeriod(day.key, index, 'start', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                      </div>

                      <span className="text-gray-500">to</span>

                      {/* End Time */}
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="time"
                          value={period.end}
                          onChange={(e) =>
                            handleUpdatePeriod(day.key, index, 'end', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        />
                      </div>

                      {/* Remove Period */}
                      {periods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(day.key, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove time period"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Period Button */}
                  <button
                    type="button"
                    onClick={() => handleAddPeriod(day.key)}
                    className="w-full mt-2 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add split shift</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Copy Helper */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Copy className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Quick Copy</h4>
            <p className="text-sm text-blue-700 mb-3">
              Copy hours from one day to another day or all days at once
            </p>
            <div className="flex items-center space-x-2">
              <select
                value={copyFromDay}
                onChange={(e) => setCopyFromDay(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="">Select source day...</option>
                {DAYS.filter((d) => businessHours[d.key]?.isOpen).map((day) => (
                  <option key={day.key} value={day.key}>
                    {day.label}
                  </option>
                ))}
              </select>
              <span className="text-blue-700">→</span>
              <select
                disabled={!copyFromDay}
                onChange={(e) => handleCopyToDay(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                value=""
              >
                <option value="">Select target day...</option>
                {DAYS.filter((d) => d.key !== copyFromDay).map((day) => (
                  <option key={day.key} value={day.key}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Weekly Summary</h4>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const isOpen = businessHours[day.key]?.isOpen || false;
            const periods = businessHours[day.key]?.periods || [];

            return (
              <div
                key={day.key}
                className={`text-center p-2 rounded ${
                  isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                <div className="text-xs font-semibold mb-1">{day.abbr}</div>
                {isOpen ? (
                  <div className="text-xs">
                    {periods.length > 0 ? `${periods.length} shift${periods.length > 1 ? 's' : ''}` : 'Open'}
                  </div>
                ) : (
                  <div className="text-xs">Closed</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to add hours to a time string
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newHour = (h + hours) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default BusinessHoursEditor;
