import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  getDay,
  getMonth,
  getYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { useStorefrontAppointments } from '../../hooks/useAppointments';
import { formatScheduleRule } from '../../hooks/useScheduleRules';
import UniversalButton from '../universal/UniversalButton';
import UniversalCard from '../universal/UniversalCard';
import type { ScheduleRule, Appointment } from '../../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Minutes past midnight for a "HH:MM" time string */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Rules that apply to a given calendar day (raw, no priority resolution) */
function rulesForDay(day: Date, rules: ScheduleRule[]): ScheduleRule[] {
  const dow = getDay(day);
  const month = getMonth(day) + 1; // 1-12
  const year = getYear(day);
  const dateStr = format(day, 'yyyy-MM-dd');

  return rules.filter((r) => {
    if (r.rule_type === 'weekly') return r.day_of_week === dow;
    if (r.rule_type === 'daily')
      return r.specific_date != null && r.specific_date.substring(0, 10) === dateStr;
    if (r.rule_type === 'monthly') {
      return r.month === month && (r.year === null || r.year === year);
    }
    return false;
  });
}

/** A bar to render inside a calendar cell representing one rule's time window */
interface TimeBar {
  topPct: number;
  heightPct: number;
  isAvailable: boolean;
}

function timeBarsForRules(rules: ScheduleRule[]): TimeBar[] {
  return rules.map((r) => {
    const startMin = toMinutes(r.start_time);
    const endMin = toMinutes(r.end_time);
    return {
      topPct: (startMin / 1440) * 100,
      heightPct: ((endMin - startMin) / 1440) * 100,
      isAvailable: r.is_available,
    };
  });
}

/** Format "HH:MM:SS" or "HH:MM" to "h:mm AM/PM" */
function fmt12(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
  declined: 'bg-zinc-100 text-zinc-500',
  no_show: 'bg-red-100 text-red-600',
};

// ─── component ──────────────────────────────────────────────────────────────

interface AvailabilityTabProps {
  storefrontId: number;
  scheduleRules: ScheduleRule[] | undefined;
  onAddRule: () => void;
  onEditRule: (rule: ScheduleRule) => void;
  onDeleteRule: (ruleId: number) => void;
}

export default function AvailabilityTab({
  storefrontId,
  scheduleRules,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: AvailabilityTabProps) {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: appointments } = useStorefrontAppointments(storefrontId);

  // ── calendar grid ──────────────────────────────────────────────────────────
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);

  const calendarDays = useMemo(() => {
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [monthStart, monthEnd]);

  // ── day click ─────────────────────────────────────────────────────────────
  const handleDayClick = useCallback(
    (day: Date, e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isSameMonth(day, calendarMonth)) return;
      if (selectedDay && isSameDay(day, selectedDay)) {
        setSelectedDay(null);
        setPopoverAnchor(null);
        return;
      }
      setSelectedDay(day);
      setPopoverAnchor(e.currentTarget.getBoundingClientRect());
    },
    [calendarMonth, selectedDay]
  );

  // ── close popover on outside click ────────────────────────────────────────
  useEffect(() => {
    if (!selectedDay) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
        setPopoverAnchor(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedDay]);

  // ── popover data ──────────────────────────────────────────────────────────
  const popoverRules = useMemo(() => {
    if (!selectedDay || !scheduleRules) return [];
    return rulesForDay(selectedDay, scheduleRules);
  }, [selectedDay, scheduleRules]);

  const popoverAppointments = useMemo<Appointment[]>(() => {
    if (!selectedDay || !appointments) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return appointments.filter((apt) => {
      const aptDay = format(new Date(apt.requested_start_datetime), 'yyyy-MM-dd');
      return (
        aptDay === key &&
        apt.status !== 'cancelled' &&
        apt.status !== 'declined'
      );
    });
  }, [selectedDay, appointments]);

  // ── popover position (fixed, viewport-aware) ──────────────────────────────
  const popoverStyle = useMemo(() => {
    if (!popoverAnchor) return {};
    const popoverWidth = 288; // w-72
    let left = popoverAnchor.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = popoverAnchor.right - popoverWidth;
    }
    return {
      position: 'fixed' as const,
      top: popoverAnchor.bottom + 8,
      left: Math.max(8, left),
      zIndex: 50,
      width: popoverWidth,
    };
  }, [popoverAnchor]);

  const today = startOfDay(new Date());

  return (
    <div className="space-y-6">

      {/* ── Rules strip ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-v3-primary">
            Availability Rules
            {scheduleRules && scheduleRules.length > 0 && (
              <span className="ml-2 font-normal text-v3-secondary">
                ({scheduleRules.length})
              </span>
            )}
          </h3>
          <UniversalButton variant="primary" size="sm" onClick={onAddRule}>
            <Plus className="w-4 h-4 mr-1" />
            Add Rule
          </UniversalButton>
        </div>

        {!scheduleRules || scheduleRules.length === 0 ? (
          <UniversalCard className="p-5 text-center">
            <p className="text-sm font-semibold text-v3-primary mb-1">No rules yet</p>
            <p className="text-xs text-v3-secondary mb-4">
              Add weekly recurring hours, one-off drops, or monthly blocks to define when
              you're open.
            </p>
            <UniversalButton variant="primary" size="sm" onClick={onAddRule}>
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </UniversalButton>
          </UniversalCard>
        ) : (
          <div className="flex flex-wrap gap-2">
            {scheduleRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-v3-surface border border-v3-border rounded-2xl text-xs"
              >
                {/* availability dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    rule.is_available ? 'bg-green-500' : 'bg-red-400'
                  }`}
                />
                {/* label */}
                <span className="text-v3-primary font-medium">
                  {rule.name ? `${rule.name} · ` : ''}
                  {formatScheduleRule(rule)}
                </span>
                {/* type badge */}
                <span className="px-1.5 py-0.5 bg-v3-accent/10 text-v3-accent rounded-full font-medium">
                  {rule.rule_type}
                </span>
                {/* actions */}
                <button
                  onClick={() => onEditRule(rule)}
                  className="p-0.5 text-v3-secondary hover:text-v3-primary transition-colors"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-0.5 text-v3-secondary hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <UniversalCard className="p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-5">
          <UniversalButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setCalendarMonth((d) => subMonths(d, 1));
              setSelectedDay(null);
              setPopoverAnchor(null);
            }}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </UniversalButton>
          <span className="text-base font-semibold text-v3-primary">
            {format(calendarMonth, 'MMMM yyyy')}
          </span>
          <UniversalButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setCalendarMonth((d) => addMonths(d, 1));
              setSelectedDay(null);
              setPopoverAnchor(null);
            }}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </UniversalButton>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-v3-secondary py-1.5"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const inMonth = isSameMonth(day, calendarMonth);
            const isPast = isBefore(day, today);
            const todayDay = isToday(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const applicable = inMonth && !isPast && scheduleRules
              ? rulesForDay(day, scheduleRules)
              : [];
            const bars = timeBarsForRules(applicable);
            const hasRules = bars.length > 0;

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={(e) => handleDayClick(day, e)}
                disabled={!inMonth || isPast}
                className={`
                  relative rounded-xl border transition-all text-left overflow-hidden
                  h-20
                  ${!inMonth
                    ? 'border-transparent bg-transparent cursor-default'
                    : isPast
                    ? 'border-v3-border bg-v3-background cursor-default opacity-40'
                    : isSelected
                    ? 'border-v3-accent bg-v3-accent/5 ring-1 ring-v3-accent'
                    : 'border-v3-border bg-v3-surface hover:border-v3-accent/50 hover:bg-v3-accent/5 cursor-pointer'
                  }
                `}
              >
                {/* Day number */}
                <span
                  className={`
                    absolute top-2 left-2.5 text-xs font-semibold leading-none z-10
                    ${!inMonth ? 'text-v3-border' : ''}
                    ${inMonth && isPast ? 'text-v3-secondary' : ''}
                    ${inMonth && !isPast && !todayDay ? 'text-v3-primary' : ''}
                    ${todayDay ? 'text-v3-accent' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {/* Today ring */}
                {todayDay && (
                  <span className="absolute top-1.5 left-2 w-5 h-5 rounded-full ring-2 ring-v3-accent" />
                )}

                {/* Time-window bars */}
                {inMonth && !isPast && bars.map((bar, i) => (
                  <span
                    key={i}
                    className={`absolute right-1 w-1.5 rounded-full ${
                      bar.isAvailable ? 'bg-green-400' : 'bg-red-300'
                    }`}
                    style={{
                      top: `${bar.topPct}%`,
                      height: `${bar.heightPct}%`,
                      minHeight: '4px',
                    }}
                  />
                ))}

                {/* "has rules" dot when bars are too thin to see */}
                {inMonth && !isPast && hasRules && bars.every((b) => b.heightPct < 5) && (
                  <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-v3-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-5 pt-4 border-t border-v3-border">
          <div className="flex items-center gap-1.5 text-xs text-v3-secondary">
            <span className="w-1.5 h-4 rounded-full bg-green-400 inline-block" />
            Open window
          </div>
          <div className="flex items-center gap-1.5 text-xs text-v3-secondary">
            <span className="w-1.5 h-4 rounded-full bg-red-300 inline-block" />
            Closed / blocked
          </div>
          <div className="flex items-center gap-1.5 text-xs text-v3-secondary">
            <span className="w-4 h-4 rounded-md ring-2 ring-v3-accent inline-block" />
            Today
          </div>
          <p className="ml-auto text-xs text-v3-secondary italic">
            Bar height reflects time of day. Click a day for details.
          </p>
        </div>
      </UniversalCard>

      {/* ── Popover ──────────────────────────────────────────────────────── */}
      {selectedDay && popoverAnchor && (
        <div
          ref={popoverRef}
          style={popoverStyle}
          className="bg-v3-surface border border-v3-border rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-v3-border bg-v3-background">
            <p className="text-sm font-semibold text-v3-primary">
              {format(selectedDay, 'EEEE, MMMM d')}
            </p>
          </div>

          {/* Rules for this day */}
          <div className="px-4 py-3 border-b border-v3-border">
            <p className="text-xs font-semibold text-v3-secondary uppercase tracking-wide mb-2">
              Availability
            </p>
            {popoverRules.length === 0 ? (
              <p className="text-xs text-v3-secondary">No rules apply to this day.</p>
            ) : (
              <div className="space-y-1.5">
                {popoverRules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        rule.is_available ? 'bg-green-500' : 'bg-red-400'
                      }`}
                    />
                    <span className="text-xs text-v3-primary">
                      {fmt12(rule.start_time)} – {fmt12(rule.end_time)}
                    </span>
                    <span
                      className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        rule.is_available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {rule.is_available ? 'Open' : 'Closed'}
                    </span>
                  </div>
                ))}
                {popoverRules.length > 1 && (
                  <p className="text-xs text-v3-secondary/70 italic pt-1">
                    Multiple rules apply — priority rules take effect at booking time.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Appointments for this day */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-v3-secondary uppercase tracking-wide mb-2">
              Appointments
            </p>
            {popoverAppointments.length === 0 ? (
              <p className="text-xs text-v3-secondary">None booked.</p>
            ) : (
              <div className="space-y-1.5">
                {popoverAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-2">
                    <span className="text-xs text-v3-primary tabular-nums">
                      {format(new Date(apt.requested_start_datetime), 'h:mm a')}
                    </span>
                    <span className="text-xs text-v3-secondary">–</span>
                    <span className="text-xs text-v3-primary tabular-nums">
                      {format(new Date(apt.requested_end_datetime), 'h:mm a')}
                    </span>
                    <span
                      className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${
                        STATUS_COLOR[apt.status] ?? 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
