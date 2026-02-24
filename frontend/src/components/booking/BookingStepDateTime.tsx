import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import UniversalCard from '../universal/UniversalCard';
import { useAvailability } from '../../hooks/useAvailability';
import type { AvailableSlot } from '../../services/api';

interface BookingStepDateTimeProps {
  storefrontId: number;
  serviceId: number;
  selectedDate: Date | null;
  selectedSlot: AvailableSlot | null;
  onSelectDate: (date: Date) => void;
  onSelectSlot: (slot: AvailableSlot) => void;
}

export default function BookingStepDateTime({
  storefrontId,
  serviceId,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
}: BookingStepDateTimeProps) {
  // Track the currently visible month in the calendar (independent of selected date)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());

  // Fetch availability for the entire visible month
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);

  const { data: availabilityData, isLoading } = useAvailability({
    storefrontId,
    serviceId,
    startDate: format(monthStart, 'yyyy-MM-dd'),
    endDate: format(monthEnd, 'yyyy-MM-dd'),
  });

  // Helper: Get slots for a specific date
  const getSlotsForDate = (date: Date): AvailableSlot[] => {
    if (!availabilityData?.slots) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilityData.slots.filter(slot => slot.local_date === dateStr);
  };

  // Get slots for selected date
  const availableSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Calendar */}
      <div>
        <h3 className="text-lg font-semibold text-v3-primary mb-3">Select Date</h3>
        <div className="border border-v3-border rounded-2xl p-4 bg-white">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => { if (date) onSelectDate(date); }}
            onMonthChange={(date) => setVisibleMonth(date)}
            minDate={new Date()}
            maxDate={addDays(new Date(), 90)}
            inline
            highlightDates={availabilityData?.slots
              ? [...new Set(availabilityData.slots.map(s => s.local_date))].map(d => new Date(d + 'T12:00:00'))
              : []
            }
            calendarClassName="custom-calendar"
          />
        </div>
      </div>

      {/* Right: Time Slots */}
      <div>
        <h3 className="text-lg font-semibold text-v3-primary mb-3">Available Times</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-v3-accent" />
          </div>
        ) : !selectedDate ? (
          <UniversalCard className="text-center py-12">
            <p className="text-v3-secondary">
              Select a date to see available times
            </p>
          </UniversalCard>
        ) : availableSlots.length === 0 ? (
          <UniversalCard className="text-center py-12">
            <p className="text-v3-secondary">
              No availability on this date. Please select another day.
            </p>
          </UniversalCard>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
            {availableSlots.map(slot => (
              <button
                key={slot.start_datetime}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  'py-3 px-3 rounded-xl border-2 text-sm transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-v3-accent focus:ring-offset-2',
                  selectedSlot?.start_datetime === slot.start_datetime
                    ? 'bg-v3-accent text-white border-v3-accent shadow-md'
                    : 'bg-white text-v3-primary border-v3-border hover:border-v3-accent hover:shadow-sm'
                )}
              >
                <div className="font-semibold">{slot.local_start_time}</div>
                <div className="text-xs mt-1 opacity-90">
                  {slot.available_capacity} {slot.available_capacity === 1 ? 'spot' : 'spots'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
