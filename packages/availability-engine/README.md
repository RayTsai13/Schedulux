# @schedulux/availability-engine

Layered schedule rules in, bookable slots out. Timezone-correct across DST, pure, and dependency-light (`date-fns` + `date-fns-tz`).

This is the engine behind [Schedulux](../../README.md) booking pages. You can try it in the browser at `/playground` in the app.

```ts
import { computeSlots } from '@schedulux/availability-engine';

const slots = computeSlots({
  timezone: 'America/Los_Angeles',
  startDate: '2026-06-08',
  endDate: '2026-06-14',
  rules: [
    { id: 'hours', type: 'weekly', dayOfWeek: 1, start: '09:00', end: '17:00', available: true, capacity: 1, priority: 1 },
    { id: 'lunch', type: 'weekly', dayOfWeek: 1, start: '12:00', end: '13:00', available: false, capacity: 1, priority: 5 },
  ],
  windows: [{ id: 'flash', date: '2026-06-13', start: '12:00', end: '15:00', capacity: 3 }],
  bookings: [{ start: '2026-06-08T17:00:00Z', end: '2026-06-08T18:00:00Z' }],
  slotMinutes: 60,
});
// → [{ start: '2026-06-08T16:00:00.000Z', localDate: '2026-06-08', localStart: '09:00', remaining: 1, … }, …]
```

## Concepts

| Input | Meaning |
|---|---|
| **Rule** | Hours (or a closure, `available: false`) that recur `weekly` (by `dayOfWeek`, 0 = Sunday), apply to one `daily` date, or cover a whole `monthly` month (optionally only in `year`). |
| **Window** | A one-off bookable period on a date, such as a limited "drop". It defaults to priority **100**, so it beats ordinary rules, including closures. |
| **Booking** | An existing appointment. It uses up capacity for any slot it overlaps. |
| **Priority** | When layers overlap, the higher number owns that time. Ties go to the layer listed first. |
| **Capacity** | How many bookings can overlap at once inside a block. |

All `start`/`end` times are local wall-clock times (`HH:mm`, with `24:00` meaning end of day) in the schedule's `timezone`. All outputs are UTC instants plus local labels.

## How it resolves a day

```
 09        12   13                17
  ├─────────┼────┼─────────────────┤   Open hours   p1  cap 1
            ├────┤                     Lunch        p5  closed
                      ├────┤           Booking
  ─────────────────────────────────────────────────────────
  ├─────────┼────┼─────────────────┤   resolved: hours │ lunch │ hours
  [09][10][11]   [13][14][15][16]      slots (14:00 has 0 left → hidden)
```

1. **Layers:** each rule or window that matches the date becomes a block. Its wall-clock times are converted to real instants in the timezone.
2. **Sweep line:** walk every start and end boundary in time order. Between two consecutive boundaries, the highest-priority active block owns the span. That gives non-overlapping **segments**, each tagged with the rule or window that won.
3. **Consolidate:** adjacent segments with the same availability and capacity are joined into **blocks**.
4. **Slots:** for each open block, lay slots back to back from its start, each `slotMinutes` long. A slot is offered while `capacity − overlapping bookings > 0` and it hasn't started yet (`now`).

`resolveDay()` returns all three stages (`layers`, `segments`, `blocks`). The playground draws them directly.

## Timezones and DST

- Dates are iterated as calendar strings, never by adding 24 hours, so a 23- or 25-hour day is neither skipped nor counted twice.
- Wall-clock times are converted with `fromZonedTime`. A time skipped by spring-forward resolves forward. For example, a 01:00–05:00 rule on 2026-03-08 in `America/New_York` is 3 real hours long and yields 3 hourly slots.
- Results don't depend on the host timezone. The test suite runs under `TZ=Europe/Berlin` to make sure of it.

## API

```ts
computeSlots(input: ComputeSlotsInput): Slot[]
resolveDay({ date, timezone, rules, windows }): { layers, segments, blocks }
checkSlot({ timezone, start, end, rules, windows, overlapping, now? }):
  | { available: true; capacity; overlapping }
  | { available: false; reason: 'past' | 'outside-hours' | 'full'; … }

// lower-level pieces
layersForDate(date, timezone, rules, windows)
resolveOverlaps(blocks)   // the sweep line
consolidate(segments)
localToUtc(date, minutes, timezone), startOfLocalDay(date, timezone), addDaysToDateStr(date, n), parseClock('HH:mm')
```

`now` is an input (it defaults to the current time), so results are reproducible in tests and in the playground.

### Using it to take bookings safely

The engine answers "is this free?". It can't stop two requests from both hearing "yes". Schedulux's API wraps `checkSlot` like this:

1. Load the rules and windows for the date. This happens *before* taking a lock or a database connection.
2. `BEGIN` → `pg_advisory_xact_lock(namespace, storefrontId)`
3. Count overlapping bookings **on the same transaction connection**.
4. `checkSlot(…, overlapping)` → `INSERT` → `COMMIT`. The lock is released.

`npm run demo:race` in `backend/` fires N simultaneous requests at one capacity-1 slot. A naive check-then-insert oversells; the locked path books exactly one:

```
Round 1 · naive check-then-insert (no lock)
  191 booked, 9 rejected in 78ms — ❌ oversold by 190
Round 2 · AppointmentService (per-page advisory lock)
  1 booked, 199 rejected in 72ms — ✅ exactly one winner
```

## Development

```bash
npm install
npm test          # vitest
npm run typecheck
npm run build     # tsup → dist/ (ESM + CJS + .d.ts)
```

MIT licensed.
