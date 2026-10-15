import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  computeSlots,
  resolveDay,
  startOfLocalDay,
  addDaysToDateStr,
  localToUtc,
  parseClock,
  type Rule,
  type Window,
  type TimeBlock,
} from '@schedulux/availability-engine';
import AppScaffold from '../components/layout/AppScaffold';
import { cn } from '@/lib/utils';
import { copyLink } from '../lib/booking';
import {
  PRESETS,
  DEFAULT_STATE,
  decodeState,
  encodeState,
  type PgRule,
  type PgWindow,
  type PgBooking,
  type PlaygroundState,
} from '../lib/playgroundPresets';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const MINUTE = 60_000;
let idCounter = 0;
const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${idCounter++}`;

// ---------------------------------------------------------------------------
// Map playground state to engine inputs
// ---------------------------------------------------------------------------
function toEngine(state: PlaygroundState): { rules: Rule[]; windows: Window[] } {
  const [year, month] = state.date.split('-').map(Number);
  const dayOfWeek = new Date(`${state.date}T00:00:00Z`).getUTCDay();
  return {
    rules: state.rules.map((r) => ({
      id: r.id,
      type: r.type,
      dayOfWeek: r.type === 'weekly' ? dayOfWeek : null,
      date: r.type === 'daily' ? state.date : null,
      month: r.type === 'monthly' ? month : null,
      year: r.type === 'monthly' ? year : null,
      start: r.start,
      end: r.end,
      available: r.available,
      capacity: r.capacity,
      priority: r.priority,
    })),
    windows: state.windows.map((w) => ({
      id: w.id,
      date: state.date,
      start: w.start,
      end: w.end,
      capacity: w.capacity,
    })),
  };
}

// ---------------------------------------------------------------------------
// Timeline rendering
// ---------------------------------------------------------------------------
interface DayFrame {
  start: number; // ms
  end: number;
  timezone: string;
}

const pct = (frame: DayFrame, t: number) => ((t - frame.start) / (frame.end - frame.start)) * 100;

function blockClass(block: { available: boolean; source: { kind: string } }) {
  if (block.source.kind === 'window') return 'bg-tertiary-fixed text-on-tertiary-fixed';
  return block.available ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container';
}

function Bar({ frame, blocks, label, labelFor }: {
  frame: DayFrame;
  blocks: TimeBlock[];
  label: string;
  labelFor?: (b: TimeBlock) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 text-xs font-medium text-on-surface-variant truncate" title={label}>
        {label}
      </div>
      <div className="relative flex-1 h-8 rounded-md bg-surface-container-low overflow-hidden">
        {blocks.map((b, i) => (
          <div
            key={i}
            className={cn('absolute inset-y-0 flex items-center px-1.5 text-[10px] font-bold overflow-hidden whitespace-nowrap border-r border-surface', blockClass(b))}
            style={{ left: `${pct(frame, b.start.getTime())}%`, width: `${pct(frame, b.end.getTime()) - pct(frame, b.start.getTime())}%` }}
            title={labelFor?.(b)}
          >
            {labelFor?.(b)}
          </div>
        ))}
      </div>
    </div>
  );
}

function HourAxis({ frame }: { frame: DayFrame }) {
  // One tick per real hour; on DST days the local labels skip or repeat, which is the point
  const ticks: { at: number; label: string }[] = [];
  for (let t = frame.start; t <= frame.end; t += 60 * MINUTE) {
    const label = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', timeZone: frame.timezone }).format(new Date(t));
    ticks.push({ at: t, label });
  }
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0" />
      <div className="relative flex-1 h-5">
        {ticks.filter((_, i) => i % 3 === 0).map((tick) => (
          <span
            key={tick.at}
            className="absolute -translate-x-1/2 text-[10px] text-on-surface-variant font-mono"
            style={{ left: `${pct(frame, tick.at)}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editors
// ---------------------------------------------------------------------------
const fieldClass =
  'px-2 py-1.5 rounded-md border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary';

function RuleEditor({ rule, onChange, onRemove }: {
  rule: PgRule;
  onChange: (rule: PgRule) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 space-y-2">
      <div className="flex gap-2 items-center">
        <input
          className={cn(fieldClass, 'flex-1 min-w-0 font-semibold')}
          value={rule.label}
          onChange={(e) => onChange({ ...rule, label: e.target.value })}
          aria-label="Rule name"
        />
        <button onClick={onRemove} className="text-on-surface-variant hover:text-error" aria-label="Remove rule">
          <Icon name="close" className="text-lg" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          Type
          <select className={fieldClass} value={rule.type} onChange={(e) => onChange({ ...rule, type: e.target.value as PgRule['type'] })}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="daily">One day</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          From
          <input type="time" className={fieldClass} value={rule.start} onChange={(e) => onChange({ ...rule, start: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          To
          <input
            className={fieldClass}
            value={rule.end}
            placeholder="HH:MM or 24:00"
            onChange={(e) => onChange({ ...rule, end: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          Priority
          <input type="number" className={fieldClass} value={rule.priority} onChange={(e) => onChange({ ...rule, priority: Number(e.target.value) })} />
        </label>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!rule.available} onChange={(e) => onChange({ ...rule, available: !e.target.checked })} />
          Closure
        </label>
        {rule.available && (
          <label className="flex items-center gap-2">
            Capacity
            <input
              type="number"
              min={1}
              className={cn(fieldClass, 'w-16')}
              value={rule.capacity}
              onChange={(e) => onChange({ ...rule, capacity: Math.max(1, Number(e.target.value)) })}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function WindowEditor({ win, onChange, onRemove }: {
  win: PgWindow;
  onChange: (w: PgWindow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-tertiary-fixed/40 border border-outline-variant/40 space-y-2">
      <div className="flex gap-2 items-center">
        <input className={cn(fieldClass, 'flex-1 min-w-0 font-semibold')} value={win.label} onChange={(e) => onChange({ ...win, label: e.target.value })} aria-label="Drop name" />
        <button onClick={onRemove} className="text-on-surface-variant hover:text-error" aria-label="Remove drop">
          <Icon name="close" className="text-lg" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <label className="flex flex-col gap-1">
          From
          <input type="time" className={fieldClass} value={win.start} onChange={(e) => onChange({ ...win, start: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          To
          <input type="time" className={fieldClass} value={win.end} onChange={(e) => onChange({ ...win, end: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          Capacity
          <input type="number" min={1} className={fieldClass} value={win.capacity} onChange={(e) => onChange({ ...win, capacity: Math.max(1, Number(e.target.value)) })} />
        </label>
      </div>
    </div>
  );
}

function BookingEditor({ booking, onChange, onRemove }: {
  booking: PgBooking;
  onChange: (b: PgBooking) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <input type="time" className={fieldClass} value={booking.start} onChange={(e) => onChange({ ...booking, start: e.target.value })} aria-label="Booking start" />
      <span className="text-on-surface-variant">to</span>
      <input type="time" className={fieldClass} value={booking.end} onChange={(e) => onChange({ ...booking, end: e.target.value })} aria-label="Booking end" />
      <button onClick={onRemove} className="text-on-surface-variant hover:text-error" aria-label="Remove booking">
        <Icon name="close" className="text-lg" />
      </button>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline underline-offset-4">
      <Icon name="add" className="text-sm" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// PlaygroundPage
// ---------------------------------------------------------------------------
export default function PlaygroundPage() {
  const [state, setState] = useState<PlaygroundState>(
    () => decodeState(window.location.hash.slice(1)) ?? DEFAULT_STATE
  );

  // Keep the URL shareable
  useEffect(() => {
    window.history.replaceState(null, '', `#${encodeState(state)}`);
  }, [state]);

  const update = (patch: Partial<PlaygroundState>) => setState((s) => ({ ...s, ...patch }));

  const result = useMemo(() => {
    try {
      const { rules, windows } = toEngine(state);
      const day = resolveDay({ date: state.date, timezone: state.timezone, rules, windows });
      const bookings = state.bookings.map((b) => ({
        start: localToUtc(state.date, parseClock(b.start), state.timezone),
        end: localToUtc(state.date, parseClock(b.end), state.timezone),
      }));
      const slots = computeSlots({
        timezone: state.timezone,
        startDate: state.date,
        endDate: state.date,
        rules,
        windows,
        bookings,
        slotMinutes: state.slotMinutes,
        now: new Date(0), // show the whole day regardless of today's date
      });
      const frame: DayFrame = {
        start: startOfLocalDay(state.date, state.timezone).getTime(),
        end: startOfLocalDay(addDaysToDateStr(state.date, 1), state.timezone).getTime(),
        timezone: state.timezone,
      };
      const bookingBlocks: TimeBlock[] = bookings.map((b) => ({
        start: b.start,
        end: b.end,
        available: false,
        capacity: 1,
        priority: 0,
        source: { kind: 'rule', id: 'booking' },
      }));
      return { day, slots, frame, bookingBlocks, error: null as string | null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [state]);

  const nameOf = (block: TimeBlock) => {
    const id = block.source.id;
    return (
      state.rules.find((r) => r.id === id)?.label ??
      state.windows.find((w) => w.id === id)?.label ??
      String(id)
    );
  };

  const hours = 'frame' in result && result.frame ? (result.frame.end - result.frame.start) / (60 * MINUTE) : 24;

  return (
    <AppScaffold>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase">
              @schedulux/availability-engine
            </span>
            <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tighter mt-2">Availability Playground</h1>
            <p className="text-on-surface-variant mt-3 leading-relaxed">
              Stack rules and see how the engine resolves them. Where rules overlap, the highest priority wins; drops
              sit at priority 100. Everything runs in your browser, using the same package the booking API runs.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => copyLink(window.location.href, 'Playground link')}
              className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2"
            >
              <Icon name="link" className="text-sm" />
              Share this setup
            </button>
            <Link to="/" className="px-4 py-2 rounded-md font-bold text-sm text-primary hover:bg-surface-container-low">
              About Schedulux
            </Link>
          </div>
        </header>

        {/* Presets */}
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setState(p.state)}
              title={p.blurb}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-surface-container-low text-on-surface hover:bg-secondary-container transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
        {PRESETS.find((p) => JSON.stringify(p.state) === JSON.stringify(state)) && (
          <p className="text-sm text-on-surface-variant -mt-4">
            {PRESETS.find((p) => JSON.stringify(p.state) === JSON.stringify(state))!.blurb}
          </p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* ---- Inputs ---- */}
          <div className="xl:col-span-5 space-y-8">
            <Section title="Day">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex flex-col gap-1">
                  Date
                  <input type="date" className={fieldClass} value={state.date} onChange={(e) => e.target.value && update({ date: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1">
                  Timezone
                  <select className={fieldClass} value={state.timezone} onChange={(e) => update({ timezone: e.target.value })}>
                    {[...new Set([state.timezone, ...TIMEZONES])].map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  Slot length (min)
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className={fieldClass}
                    value={state.slotMinutes}
                    onChange={(e) => update({ slotMinutes: Math.max(5, Number(e.target.value)) })}
                  />
                </label>
              </div>
            </Section>

            <Section
              title="Rules"
              action={
                <AddButton
                  label="Rule"
                  onClick={() =>
                    update({
                      rules: [
                        ...state.rules,
                        { id: newId('r'), label: 'New rule', type: 'weekly', start: '09:00', end: '12:00', available: true, capacity: 1, priority: 1 },
                      ],
                    })
                  }
                />
              }
            >
              {state.rules.length === 0 && <p className="text-sm text-on-surface-variant">No rules: nothing is open.</p>}
              {state.rules.map((rule) => (
                <RuleEditor
                  key={rule.id}
                  rule={rule}
                  onChange={(next) => update({ rules: state.rules.map((r) => (r.id === rule.id ? next : r)) })}
                  onRemove={() => update({ rules: state.rules.filter((r) => r.id !== rule.id) })}
                />
              ))}
            </Section>

            <Section
              title="Drops"
              action={
                <AddButton
                  label="Drop"
                  onClick={() =>
                    update({ windows: [...state.windows, { id: newId('w'), label: 'Drop', start: '18:00', end: '20:00', capacity: 2 }] })
                  }
                />
              }
            >
              {state.windows.map((win) => (
                <WindowEditor
                  key={win.id}
                  win={win}
                  onChange={(next) => update({ windows: state.windows.map((w) => (w.id === win.id ? next : w)) })}
                  onRemove={() => update({ windows: state.windows.filter((w) => w.id !== win.id) })}
                />
              ))}
            </Section>

            <Section
              title="Existing bookings"
              action={
                <AddButton
                  label="Booking"
                  onClick={() => update({ bookings: [...state.bookings, { id: newId('b'), start: '09:00', end: '10:00' }] })}
                />
              }
            >
              {state.bookings.map((b) => (
                <BookingEditor
                  key={b.id}
                  booking={b}
                  onChange={(next) => update({ bookings: state.bookings.map((x) => (x.id === b.id ? next : x)) })}
                  onRemove={() => update({ bookings: state.bookings.filter((x) => x.id !== b.id) })}
                />
              ))}
            </Section>
          </div>

          {/* ---- Output ---- */}
          <div className="xl:col-span-7 space-y-8">
            {'error' in result && result.error ? (
              <div className="p-4 rounded-lg bg-error-container text-on-error-container text-sm">{result.error}</div>
            ) : 'day' in result && result.day && result.frame ? (
              <>
                <Section title={`Timeline · ${hours} hour day`}>
                  <div className="space-y-2 bg-surface-container-lowest rounded-xl p-4">
                    <HourAxis frame={result.frame} />
                    {result.day.layers.map((layer) => (
                      <Bar
                        key={String(layer.source.id)}
                        frame={result.frame}
                        blocks={[layer]}
                        label={`${nameOf(layer)} · p${layer.priority}`}
                        labelFor={(b) => (b.available ? `cap ${b.capacity}` : 'closed')}
                      />
                    ))}
                    {result.bookingBlocks.length > 0 && (
                      <Bar frame={result.frame} blocks={result.bookingBlocks} label="Bookings" labelFor={() => 'booked'} />
                    )}
                    <div className="border-t border-outline-variant/40 pt-2">
                      <Bar frame={result.frame} blocks={result.day.segments} label="Resolved" labelFor={(b) => nameOf(b)} />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-on-surface-variant flex-wrap">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-secondary-container" />Open</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-error-container" />Closure / booked</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-tertiary-fixed" />Drop</span>
                  </div>
                </Section>

                <Section title={`Bookable slots · ${result.slots.length}`}>
                  {result.slots.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">No bookable slots on this day.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {result.slots.map((slot) => (
                        <div key={slot.start} className="py-2 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-center">
                          <div className="font-semibold text-sm text-on-surface">{slot.localStart}</div>
                          <div className="text-[10px] text-on-surface-variant">
                            {slot.remaining} left
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="How it works">
                  <ol className="text-sm text-on-surface-variant leading-relaxed space-y-2 list-decimal pl-5">
                    <li>Each rule matching the date becomes a block, with its wall-clock times converted to real instants in the timezone.</li>
                    <li>A sweep line walks every block boundary in order; between two boundaries, the highest-priority active block owns the time.</li>
                    <li>Adjacent pieces with the same settings are merged, and slots are laid back-to-back from the start of each open block.</li>
                    <li>A slot is offered while its capacity minus overlapping bookings is above zero. The API re-runs this check inside a per-page database lock before inserting, so two people can't take the last spot.</li>
                  </ol>
                </Section>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </AppScaffold>
  );
}
