import type {
  CheckSlotInput,
  CheckSlotResult,
  ComputeSlotsInput,
  ResolveDayInput,
  ResolvedDay,
  Rule,
  Slot,
  TimeBlock,
  Window,
} from './types';
import {
  addDaysToDateStr,
  dayOfWeek,
  formatLocal,
  localDateOf,
  localToUtc,
  parseClock,
  startOfLocalDay,
  toDate,
} from './time';

/** Priority given to windows that don't set one: above any ordinary rule */
export const DEFAULT_WINDOW_PRIORITY = 100;

const MINUTE = 60_000;

function ruleMatches(rule: Rule, date: string): boolean {
  switch (rule.type) {
    case 'weekly':
      return rule.dayOfWeek === dayOfWeek(date);
    case 'daily':
      return !!rule.date && rule.date.slice(0, 10) === date;
    case 'monthly': {
      const [year, month] = date.split('-').map(Number);
      return rule.month === month && (rule.year == null || rule.year === year);
    }
    default:
      return false;
  }
}

/** Every rule and window that applies to `date`, as raw blocks in the given timezone */
export function layersForDate(
  date: string,
  timezone: string,
  rules: Rule[],
  windows: Window[] = []
): TimeBlock[] {
  const ruleLayers = rules
    .filter((rule) => ruleMatches(rule, date))
    .map<TimeBlock>((rule) => ({
      start: localToUtc(date, parseClock(rule.start), timezone),
      end: localToUtc(date, parseClock(rule.end), timezone),
      available: rule.available,
      capacity: rule.capacity,
      priority: rule.priority,
      source: { kind: 'rule', id: rule.id },
    }));

  const windowLayers = windows
    .filter((w) => w.date.slice(0, 10) === date)
    .map<TimeBlock>((w) => ({
      start: localToUtc(date, parseClock(w.start), timezone),
      end: localToUtc(date, parseClock(w.end), timezone),
      available: true,
      capacity: w.capacity,
      priority: w.priority ?? DEFAULT_WINDOW_PRIORITY,
      source: { kind: 'window', id: w.id },
    }));

  return [...ruleLayers, ...windowLayers].filter((b) => b.end > b.start);
}

/**
 * Resolve overlapping blocks with a sweep line: walk every start/end boundary
 * in time order and, between consecutive boundaries, emit a segment owned by
 * the highest-priority block active at that moment. Ties go to the block
 * listed first.
 */
export function resolveOverlaps(blocks: TimeBlock[]): TimeBlock[] {
  const events = blocks.flatMap((block, order) => [
    { time: block.start.getTime(), type: 'start' as const, block, order },
    { time: block.end.getTime(), type: 'end' as const, block, order },
  ]);
  // Ends before starts at the same instant, so touching blocks don't overlap
  events.sort((a, b) => a.time - b.time || (a.type === b.type ? 0 : a.type === 'end' ? -1 : 1));

  const segments: TimeBlock[] = [];
  const active: { block: TimeBlock; order: number }[] = [];
  let last: number | null = null;

  for (const event of events) {
    if (last !== null && active.length > 0 && event.time > last) {
      const top = active.reduce((best, cur) =>
        cur.block.priority > best.block.priority ||
        (cur.block.priority === best.block.priority && cur.order < best.order)
          ? cur
          : best
      ).block;
      segments.push({ ...top, start: new Date(last), end: new Date(event.time) });
    }
    if (event.type === 'start') {
      active.push({ block: event.block, order: event.order });
    } else {
      const idx = active.findIndex((a) => a.block === event.block);
      if (idx !== -1) active.splice(idx, 1);
    }
    last = event.time;
  }
  return segments;
}

/** Join adjacent segments whose availability and capacity match */
export function consolidate(segments: TimeBlock[]): TimeBlock[] {
  const out: TimeBlock[] = [];
  for (const seg of segments) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.end.getTime() === seg.start.getTime() &&
      prev.available === seg.available &&
      prev.capacity === seg.capacity
    ) {
      prev.end = seg.end;
    } else {
      out.push({ ...seg });
    }
  }
  return out;
}

/** Work out who owns each moment of a local day */
export function resolveDay({ date, timezone, rules, windows = [] }: ResolveDayInput): ResolvedDay {
  const layers = layersForDate(date, timezone, rules, windows);
  const segments = resolveOverlaps(layers);
  return { date, layers, segments, blocks: consolidate(segments) };
}

/**
 * Bookable slots for every local date in [startDate, endDate].
 * Slots are laid back-to-back from the start of each available block; a slot
 * is offered while its remaining capacity (block capacity minus overlapping
 * bookings) is above zero.
 */
export function computeSlots(input: ComputeSlotsInput): Slot[] {
  const {
    timezone,
    startDate,
    endDate,
    rules,
    windows = [],
    bookings = [],
    slotMinutes,
    displayMinutes = slotMinutes,
    now = new Date(),
  } = input;

  if (slotMinutes <= 0) throw new Error('slotMinutes must be positive');

  const spans = bookings.map((b) => ({ start: toDate(b.start).getTime(), end: toDate(b.end).getTime() }));
  const slots: Slot[] = [];

  // Step by calendar date, not by 24h, so DST days are neither skipped nor repeated
  for (let date = startDate; date <= endDate; date = addDaysToDateStr(date, 1)) {
    const dayStart = startOfLocalDay(date, timezone).getTime();
    const dayEnd = startOfLocalDay(addDaysToDateStr(date, 1), timezone).getTime();
    const dayBookings = spans.filter((b) => b.start < dayEnd && b.end > dayStart);

    for (const block of resolveDay({ date, timezone, rules, windows }).blocks) {
      if (!block.available) continue;

      for (
        let start = block.start.getTime();
        start + slotMinutes * MINUTE <= block.end.getTime();
        start += slotMinutes * MINUTE
      ) {
        if (start < now.getTime()) continue;
        const end = start + slotMinutes * MINUTE;
        const overlapping = dayBookings.filter((b) => b.start < end && b.end > start).length;
        const remaining = block.capacity - overlapping;
        if (remaining <= 0) continue;

        const startDt = new Date(start);
        slots.push({
          start: startDt.toISOString(),
          end: new Date(end).toISOString(),
          localDate: localDateOf(startDt, timezone),
          localStart: formatLocal(startDt, timezone, 'HH:mm'),
          localEnd: formatLocal(new Date(start + displayMinutes * MINUTE), timezone, 'HH:mm'),
          remaining,
        });
      }
    }
  }
  return slots;
}

/**
 * Whether one specific [start, end) can be booked, given how many bookings
 * already overlap it. Use this at write time, inside whatever lock guards
 * the booking, so the answer can't go stale before the insert.
 */
export function checkSlot({
  timezone,
  start,
  end,
  rules,
  windows = [],
  overlapping,
  now = new Date(),
}: CheckSlotInput): CheckSlotResult {
  if (start.getTime() < now.getTime()) return { available: false, reason: 'past' };

  const { blocks } = resolveDay({ date: localDateOf(start, timezone), timezone, rules, windows });
  const block = blocks.find((b) => b.available && b.start <= start && end <= b.end);
  if (!block) return { available: false, reason: 'outside-hours' };

  if (overlapping >= block.capacity) {
    return { available: false, reason: 'full', capacity: block.capacity, overlapping };
  }
  return { available: true, capacity: block.capacity, overlapping };
}
