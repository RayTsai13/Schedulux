import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Calendar Store - Manages calendar view state
 *
 * This store tracks the calendar's current view mode, selected date,
 * and filters. Persists user preferences to localStorage.
 *
 * Usage:
 * const { calendarView, setCalendarView, selectedDate } = useCalendarStore();
 */

type CalendarView = 'day' | 'week' | 'month';
type AppointmentStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface CalendarFilters {
  status: AppointmentStatus;
  serviceId: number | null;
  clientId: number | null;
}

interface CalendarStore {
  // Current calendar view mode
  calendarView: CalendarView;

  // Currently selected/viewed date
  selectedDate: Date;

  // Active filters
  filters: CalendarFilters;

  // Actions
  setCalendarView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  setFilters: (filters: Partial<CalendarFilters>) => void;
  resetFilters: () => void;

  // Navigation helpers
  goToToday: () => void;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
}

const defaultFilters: CalendarFilters = {
  status: 'all',
  serviceId: null,
  clientId: null,
};

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      calendarView: 'week',
      selectedDate: new Date(),
      filters: defaultFilters,

      setCalendarView: (view) => set({ calendarView: view }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      goToToday: () => set({ selectedDate: new Date() }),

      goToNextPeriod: () => {
        const { calendarView, selectedDate } = get();
        const newDate = new Date(selectedDate);

        if (calendarView === 'day') {
          newDate.setDate(newDate.getDate() + 1);
        } else if (calendarView === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else {
          // month
          newDate.setMonth(newDate.getMonth() + 1);
        }

        set({ selectedDate: newDate });
      },

      goToPreviousPeriod: () => {
        const { calendarView, selectedDate } = get();
        const newDate = new Date(selectedDate);

        if (calendarView === 'day') {
          newDate.setDate(newDate.getDate() - 1);
        } else if (calendarView === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else {
          // month
          newDate.setMonth(newDate.getMonth() - 1);
        }

        set({ selectedDate: newDate });
      },
    }),
    {
      name: 'schedulux-calendar', // localStorage key
      partialize: (state) => ({
        // Only persist these fields (not selectedDate - always start fresh)
        calendarView: state.calendarView,
        filters: state.filters,
      }),
    }
  )
);
