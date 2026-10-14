import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import UniversalCard from '../universal/UniversalCard';
import { useAvailability } from '../../hooks/useAvailability';
import type { AvailableSlot } from '../../services/api';

/** Restrict choices to one local time window, e.g. a drop */
export interface SlotWindow {
  date: string;  // YYYY-MM-DD
  start: string; // HH:MM[:SS]
  end: string;   // HH:MM[:SS]
}

interface BookingStepDateTimeProps {
  storefrontId: number;
  serviceId: number;
  selectedDate: Date | null;
  selectedSlot: AvailableSlot | null;
  onSelectDate: (date: Date) => void;
  onSelectSlot: (slot: AvailableSlot) => void;
  window?: SlotWindow;
}

const inWindow = (slot: AvailableSlot, w: SlotWindow) =>
  slot.local_date === w.date &&
  slot.local_start_time >= w.start.slice(0, 5) &&
  slot.local_end_time <= w.end.slice(0, 5);

/** Local Date at noon for a YYYY-MM-DD string (noon avoids DST edge cases in the picker) */
const dateFromStr = (date: string) => new Date(`${date}T12:00:00`);

export default function BookingStepDateTime({
  storefrontId,
  serviceId,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  window: slotWindow,
}: BookingStepDateTimeProps) {
  // Track the currently visible month in the calendar (independent of selected date)
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    slotWindow ? dateFromStr(slotWindow.date) : new Date()
  );

  // Fetch availability for the entire visible month
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);

  const { data: availabilityData, isLoading } = useAvailability({
    storefrontId,
    serviceId,
    startDate: format(monthStart, 'yyyy-MM-dd'),
    endDate: format(monthEnd, 'yyyy-MM-dd'),
  });

  const slots = (availabilityData?.slots ?? []).filter(
    (slot) => !slotWindow || inWindow(slot, slotWindow)
  );

  // A window pins the calendar to its one day
  const effectiveDate = slotWindow ? dateFromStr(slotWindow.date) : selectedDate;

  // Get slots for selected date
  const availableSlots = effectiveDate
    ? slots.filter((slot) => slot.local_date === format(effectiveDate, 'yyyy-MM-dd'))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Calendar */}
      <div>
        <h3 className="text-lg font-semibold text-on-surface mb-3">Select Date</h3>
        <div className="border border-outline-variant rounded-2xl p-4 bg-surface-container-lowest">
          <DatePicker
            selected={effectiveDate}
            onChange={(date) => { if (date) onSelectDate(date); }}
            onMonthChange={(date) => setVisibleMonth(date)}
            minDate={slotWindow ? dateFromStr(slotWindow.date) : new Date()}
            maxDate={slotWindow ? dateFromStr(slotWindow.date) : addDays(new Date(), 90)}
            inline
            highlightDates={[...new Set(slots.map((s) => s.local_date))].map(dateFromStr)}
            calendarClassName="custom-calendar"
          />
        </div>
      </div>

      {/* Right: Time Slots */}
      <div>
        <h3 className="text-lg font-semibold text-on-surface mb-3">Available Times</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !effectiveDate ? (
          <UniversalCard className="text-center py-12">
            <p className="text-on-surface-variant">
              Select a date to see available times
            </p>
          </UniversalCard>
        ) : availableSlots.length === 0 ? (
          <UniversalCard className="text-center py-12">
            <p className="text-on-surface-variant">
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
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  selectedSlot?.start_datetime === slot.start_datetime
                    ? 'bg-primary text-on-primary border-primary shadow-md'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:border-primary hover:shadow-sm'
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
