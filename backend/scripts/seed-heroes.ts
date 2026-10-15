/**
 * Hero Vendors Seed Script
 *
 * Creates 3 demo vendors, each with a public page, services, regular hours, and a drop:
 * 1. The Midnight Barber (@midnightbarber) - Tue–Sat hours, a Friday late-night drop, a few bookings
 * 2. Weekend Warrior Fix-It (@fixit)        - weekend hours, a weeknight pop-up drop
 * 3. Sunday Tattoo Flash (@sundayflash)     - no regular hours, a Sunday flash drop that's
 *                                             SOLD OUT with people on the waitlist
 *
 * Run with: npm run seed:heroes
 *
 * Idempotent: skips vendors whose user already exists.
 * Transaction-based: each vendor is created atomically.
 */

import { randomBytes } from 'crypto';
import { addDays, format, getDay, startOfDay } from 'date-fns';
import { localToUtc, parseClock } from '@schedulux/availability-engine';
import { withTransaction, pool } from '../src/config/database';
import { hashPassword } from '../src/utils/auth';

// ============================================================================
// HELPERS
// ============================================================================

/** Next occurrence of a weekday (0 = Sunday) as YYYY-MM-DD, never today */
function nextDayOfWeek(targetDay: number): string {
  const today = startOfDay(new Date());
  let days = targetDay - getDay(today);
  if (days <= 0) days += 7;
  return format(addDays(today, days), 'yyyy-MM-dd');
}

const token = () => randomBytes(32).toString('hex');

// ============================================================================
// CONFIG
// ============================================================================

interface ServiceConfig {
  key: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url?: string;
}

interface DropConfig {
  title: string;
  description: string;
  date: string;
  start: string;
  end: string;
  capacity: number;
  /** service key, or null for all services */
  service: string | null;
  /** guest bookings inside the drop, as local start times */
  bookings?: { name: string; email: string; start: string; status: 'pending' | 'confirmed' }[];
  waitlist?: { name: string; email: string }[];
}

interface VendorConfig {
  user: { email: string; firstName: string; lastName: string; phone: string };
  page: {
    name: string;
    slug: string;
    description: string;
    timezone: string;
    city?: string;
    state?: string;
    address?: string;
    instagram_handle?: string;
    theme_color?: string;
  };
  services: ServiceConfig[];
  /** weekly hours: [day_of_week, start, end] */
  hours: [number, string, string][];
  drops: DropConfig[];
  /** regular (non-drop) guest bookings: [date, local start, service key, status] */
  bookings?: { name: string; email: string; date: string; start: string; service: string; status: 'pending' | 'confirmed' }[];
}

const PASSWORD = 'Hero123!';

const VENDORS: VendorConfig[] = [
  {
    user: { email: 'midnight@schedulux.dev', firstName: 'Marcus', lastName: 'Night', phone: '+14155550101' },
    page: {
      name: 'The Midnight Barber',
      slug: 'midnightbarber',
      description: 'Premium late-night barbershop for the modern professional',
      timezone: 'America/Los_Angeles',
      city: 'San Francisco',
      state: 'CA',
      address: '415 Castro St, San Francisco, CA 94114',
      instagram_handle: 'midnight_cuts',
      theme_color: 'zinc',
    },
    services: [
      {
        key: 'fade',
        name: 'The Signature Fade',
        description: 'Our signature precision fade with hot towel finish',
        duration_minutes: 60,
        price: 60,
        image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
      },
      {
        key: 'beard',
        name: 'Beard Sculpt',
        description: 'Precision beard trimming and shaping with line work',
        duration_minutes: 30,
        price: 35,
        image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      },
    ],
    hours: [2, 3, 4, 5, 6].map((d) => [d, '11:00', '19:00'] as [number, string, string]),
    drops: [
      {
        title: 'Friday Late Night',
        description: 'After-hours fades, 8–11pm. Three chairs-worth of spots, first come first served.',
        date: nextDayOfWeek(5),
        start: '20:00',
        end: '23:00',
        capacity: 1,
        service: 'fade',
        bookings: [{ name: 'Devon Park', email: 'devon@example.com', start: '20:00', status: 'confirmed' }],
      },
    ],
    bookings: [
      { name: 'Alex Rivera', email: 'alex@example.com', date: nextDayOfWeek(2), start: '11:00', service: 'fade', status: 'confirmed' },
      { name: 'Sam Lee', email: 'sam@example.com', date: nextDayOfWeek(3), start: '14:00', service: 'beard', status: 'pending' },
      { name: 'Alex Rivera', email: 'alex@example.com', date: nextDayOfWeek(4), start: '16:00', service: 'beard', status: 'pending' },
    ],
  },
  {
    user: { email: 'fixit@schedulux.dev', firstName: 'Jake', lastName: 'Handy', phone: '+15125550202' },
    page: {
      name: 'Weekend Warrior Fix-It',
      slug: 'fixit',
      description: 'Handyman services for your weekend projects',
      timezone: 'America/Chicago',
      city: 'Austin',
      state: 'TX',
    },
    services: [
      { key: 'tv', name: 'TV Mounting', description: 'Professional TV mounting with cable management', duration_minutes: 45, price: 75 },
      { key: 'furniture', name: 'Furniture Assembly', description: 'Expert furniture assembly for all brands', duration_minutes: 60, price: 60 },
    ],
    hours: [
      [6, '09:00', '17:00'],
      [0, '09:00', '17:00'],
    ],
    drops: [
      {
        title: 'Weeknight Pop-up',
        description: 'Two of us, one evening. Quick installs and assembly.',
        date: nextDayOfWeek(3),
        start: '18:00',
        end: '21:00',
        capacity: 2,
        service: null,
      },
    ],
  },
  {
    user: { email: 'flash@schedulux.dev', firstName: 'Luna', lastName: 'Ink', phone: '+14155550303' },
    page: {
      name: 'Sunday Tattoo Flash',
      slug: 'sundayflash',
      description: 'Limited flash designs every Sunday afternoon',
      timezone: 'America/Los_Angeles',
      city: 'San Francisco',
      state: 'CA',
      address: '789 Valencia St, San Francisco, CA 94110',
      instagram_handle: 'sundayflash',
      theme_color: 'rose',
    },
    services: [
      {
        key: 'flash',
        name: 'Flash Sheet A',
        description: "Pre-designed flash tattoos from this week's sheet",
        duration_minutes: 90,
        price: 150,
        image_url: 'https://images.unsplash.com/photo-1598371839696-5c5bb62d4982?auto=format&fit=crop&w=800&q=80',
      },
    ],
    hours: [],
    drops: [
      {
        title: 'Sunday Flash Day',
        description: 'Four slots, one sheet. Walk out with something small and permanent.',
        date: nextDayOfWeek(0),
        start: '12:00',
        end: '18:00',
        capacity: 1,
        service: 'flash',
        bookings: [
          { name: 'Rory Blake', email: 'rory@example.com', start: '12:00', status: 'confirmed' },
          { name: 'Mina Cho', email: 'mina@example.com', start: '13:30', status: 'confirmed' },
          { name: 'Theo Grant', email: 'theo@example.com', start: '15:00', status: 'pending' },
          { name: 'Ana Silva', email: 'ana@example.com', start: '16:30', status: 'confirmed' },
        ],
        waitlist: [
          { name: 'Priya Patel', email: 'priya@example.com' },
          { name: 'Jordan Fox', email: 'jordan@example.com' },
        ],
      },
    ],
  },
];

// ============================================================================
// CREATION
// ============================================================================

type Db = { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> };

async function insertBooking(
  db: Db,
  storefrontId: number,
  tz: string,
  service: { id: number; duration_minutes: number; price: number },
  b: { name: string; email: string; date: string; start: string; status: string },
  dropId: number | null
) {
  const start = localToUtc(b.date, parseClock(b.start), tz);
  const end = new Date(start.getTime() + service.duration_minutes * 60_000);
  await db.query(
    `INSERT INTO appointments (
       storefront_id, service_id, guest_name, guest_email, manage_token,
       requested_start_datetime, requested_end_datetime, status, price_quoted, drop_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [storefrontId, service.id, b.name, b.email, token(), start, end, b.status, service.price, dropId]
  );
}

async function createVendor(config: VendorConfig): Promise<'created' | 'skipped'> {
  return withTransaction(async (client) => {
    const existing = await client.query('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [config.user.email]);
    if (existing.rows.length > 0) return 'skipped';

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, timezone)
       VALUES ($1, $2, $3, $4, 'vendor', $5, $6) RETURNING id`,
      [config.user.email, await hashPassword(PASSWORD), config.user.firstName, config.user.lastName, config.user.phone, config.page.timezone]
    );
    const userId = userResult.rows[0].id;

    const p = config.page;
    const pageResult = await client.query(
      `INSERT INTO storefronts (vendor_id, name, slug, description, address, city, state, timezone, instagram_handle, theme_color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [userId, p.name, p.slug, p.description, p.address ?? null, p.city ?? null, p.state ?? null, p.timezone, p.instagram_handle ?? null, p.theme_color ?? 'purple']
    );
    const storefrontId = pageResult.rows[0].id;

    const services = new Map<string, { id: number; duration_minutes: number; price: number }>();
    for (const s of config.services) {
      const r = await client.query(
        `INSERT INTO services (storefront_id, name, description, duration_minutes, price, image_url, buffer_time_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING id`,
        [storefrontId, s.name, s.description, s.duration_minutes, s.price, s.image_url ?? null]
      );
      services.set(s.key, { id: r.rows[0].id, duration_minutes: s.duration_minutes, price: s.price });
    }

    for (const [day, start, end] of config.hours) {
      await client.query(
        `INSERT INTO schedule_rules (storefront_id, rule_type, priority, day_of_week, start_time, end_time,
                                     is_available, max_concurrent_appointments, name)
         VALUES ($1, 'weekly', 1, $2, $3, $4, TRUE, 1, 'Regular hours')`,
        [storefrontId, day, start, end]
      );
    }

    for (const d of config.drops) {
      const dropService = d.service ? services.get(d.service)! : null;
      const dropResult = await client.query(
        `INSERT INTO drops (storefront_id, service_id, title, description, drop_date, start_time, end_time,
                            max_concurrent_appointments, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING id`,
        [storefrontId, dropService?.id ?? null, d.title, d.description, d.date, d.start, d.end, d.capacity]
      );
      const dropId = dropResult.rows[0].id;
      const bookingService = dropService ?? [...services.values()][0];
      for (const b of d.bookings ?? []) {
        await insertBooking(client, storefrontId, p.timezone, bookingService, { ...b, date: d.date }, dropId);
      }
      for (const w of d.waitlist ?? []) {
        await client.query('INSERT INTO drop_waitlist (drop_id, name, email) VALUES ($1, $2, $3)', [dropId, w.name, w.email]);
      }
    }

    for (const b of config.bookings ?? []) {
      await insertBooking(client, storefrontId, p.timezone, services.get(b.service)!, b, null);
    }

    return 'created';
  });
}

async function main() {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  // database.ts logs every query in development; keep the summary readable
  const out = console.log;
  console.log = () => {};

  out('🌱 Seeding hero vendors...\n');
  for (const vendor of VENDORS) {
    try {
      const result = await createVendor(vendor);
      out(`${result === 'created' ? '✅' : '⏭️ '} ${vendor.page.name.padEnd(24)} ${frontend}/@${vendor.page.slug}  (${vendor.user.email})`);
    } catch (error) {
      out(`❌ ${vendor.page.name}: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  }
  out(`\nVendor password for all accounts: ${PASSWORD}`);
}

main().finally(() => pool.end());
