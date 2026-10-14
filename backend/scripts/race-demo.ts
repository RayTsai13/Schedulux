/**
 * Race demo: fire many simultaneous bookings at a single spot and count the winners.
 *
 *   npm run demo:race                # uses the first page that has an active service
 *   npm run demo:race -- fixit 100   # page slug, number of concurrent attempts
 *
 * Creates a temporary capacity-1 drop 30 days out, then runs two rounds against it:
 *   1. naive   — check availability, then insert (no lock): the classic check-then-act race
 *   2. locked  — AppointmentService.createAppointment, which takes a per-page advisory
 *                lock and re-checks inside the transaction
 * Everything the script creates is deleted afterwards.
 *
 * Talks to the database in backend/.env directly (no HTTP, so rate limits don't interfere).
 */

import { randomBytes } from 'crypto';
import { addMinutes } from 'date-fns';
import { localToUtc, parseClock, addDaysToDateStr } from '@schedulux/availability-engine';
import { query, pool } from '../src/config/database';
import { AppointmentModel } from '../src/models/Appointment';
import { AvailabilityService } from '../src/services/AvailabilityService';
import { AppointmentService } from '../src/services/AppointmentService';

// Keep the run quiet: no SendGrid, and no dev query logging (database.ts logs every query)
delete process.env.SENDGRID_API_KEY;
const out = console.log;
console.log = () => {};

const [slugArg, attemptsArg] = process.argv.slice(2);
const ATTEMPTS = Number(attemptsArg) || 50;

interface Target {
  storefrontId: number;
  slug: string;
  timezone: string;
  serviceId: number;
  serviceName: string;
  duration: number;
}

async function findTarget(): Promise<Target> {
  const result = await query(
    `SELECT sf.id AS storefront_id, sf.slug, sf.timezone, s.id AS service_id, s.name,
            s.duration_minutes + s.buffer_time_minutes AS duration
     FROM storefronts sf
     JOIN services s ON s.storefront_id = sf.id AND s.is_active AND s.deleted_at IS NULL
     WHERE sf.deleted_at IS NULL AND sf.is_active ${slugArg ? 'AND sf.slug = $1' : ''}
     ORDER BY sf.id
     LIMIT 1`,
    slugArg ? [slugArg] : []
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error(slugArg ? `No active page "${slugArg}" with an active service` : 'No page with an active service; run npm run seed:heroes');
  }
  return {
    storefrontId: row.storefront_id,
    slug: row.slug,
    timezone: row.timezone || 'UTC',
    serviceId: row.service_id,
    serviceName: row.name,
    duration: Number(row.duration),
  };
}

const guest = (round: string, i: number) => ({
  name: `Racer ${i}`,
  email: `race-${round}-${i}@example.com`,
});

/** Check-then-insert with no lock: what booking code looks like before it's made safe */
async function naiveBook(t: Target, start: Date, end: Date, dropId: number, i: number) {
  const check = await AvailabilityService.isSlotAvailable(t.storefrontId, t.serviceId, start, end);
  if (!check.available) throw new Error(check.reason);
  const g = guest('naive', i);
  return AppointmentModel.create({
    storefront_id: t.storefrontId,
    service_id: t.serviceId,
    guest_name: g.name,
    guest_email: g.email,
    manage_token: randomBytes(32).toString('hex'),
    requested_start_datetime: start,
    requested_end_datetime: end,
    drop_id: dropId,
  });
}

function tally(results: PromiseSettledResult<unknown>[]) {
  const booked = results.filter((r) => r.status === 'fulfilled').length;
  const reasons = new Map<string, number>();
  for (const r of results) {
    if (r.status === 'rejected') {
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }
  }
  return { booked, reasons };
}

function report(label: string, results: PromiseSettledResult<unknown>[], ms: number) {
  const { booked, reasons } = tally(results);
  const verdict = booked === 1 ? '✅ exactly one winner' : booked > 1 ? `❌ oversold by ${booked - 1}` : '⚠️  nobody won';
  out(`\n${label}`);
  out(`  ${booked} booked, ${ATTEMPTS - booked} rejected in ${ms}ms — ${verdict}`);
  for (const [reason, count] of reasons) out(`    ${count} × ${reason}`);
}

async function main() {
  const t = await findTarget();
  const date = addDaysToDateStr(new Date().toISOString().slice(0, 10), 30);
  const startMinutes = 10 * 60;
  const endClock = `${String(Math.floor((startMinutes + t.duration) / 60)).padStart(2, '0')}:${String((startMinutes + t.duration) % 60).padStart(2, '0')}`;
  const start = localToUtc(date, startMinutes, t.timezone);
  const end = addMinutes(start, t.duration);

  out(`Page @${t.slug} · ${t.serviceName} (${t.duration} min) · ${date} 10:00 ${t.timezone}`);
  out(`Firing ${ATTEMPTS} simultaneous bookings at one capacity-1 drop slot, twice.`);

  const dropResult = await query(
    `INSERT INTO drops (storefront_id, service_id, title, drop_date, start_time, end_time,
                        max_concurrent_appointments, is_published)
     VALUES ($1, $2, 'Race demo (temporary)', $3, '10:00', $4, 1, TRUE)
     RETURNING id`,
    [t.storefrontId, t.serviceId, date, endClock]
  );
  const dropId: number = dropResult.rows[0].id;
  if (parseClock(endClock) <= startMinutes) throw new Error('Service too long for the demo window');

  try {
    // Round 1: naive
    let t0 = Date.now();
    const naive = await Promise.allSettled(
      Array.from({ length: ATTEMPTS }, (_, i) => naiveBook(t, start, end, dropId, i))
    );
    report('Round 1 · naive check-then-insert (no lock)', naive, Date.now() - t0);
    await query('DELETE FROM appointments WHERE drop_id = $1', [dropId]);

    // Round 2: the real booking path
    t0 = Date.now();
    const locked = await Promise.allSettled(
      Array.from({ length: ATTEMPTS }, (_, i) =>
        AppointmentService.createAppointment(guest('locked', i), t.storefrontId, t.serviceId, start.toISOString(), undefined, dropId)
      )
    );
    report('Round 2 · AppointmentService (per-page advisory lock)', locked, Date.now() - t0);
  } finally {
    await query('DELETE FROM appointments WHERE drop_id = $1', [dropId]);
    await query('DELETE FROM drops WHERE id = $1', [dropId]);
    out('\nCleaned up the temporary drop and bookings.');
  }
}

main()
  .catch((error) => {
    console.error('Race demo failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    // Give fire-and-forget email lookups a moment, then close the pool
    setTimeout(() => pool.end(), 500);
  });
