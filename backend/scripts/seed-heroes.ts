/**
 * Hero Vendors Seed Script
 *
 * Creates 3 hero vendors to showcase Schedulux 2.0 features:
 * 1. The Midnight Barber - Grid layout, Instagram integration, scarcity drops
 * 2. Weekend Warrior Fix-It - Mobile services, service radius, list layout
 * 3. Sunday Tattoo Flash - Individual artist, rose theme, limited drops
 *
 * Run with: npm run seed:heroes
 *
 * Idempotent: Safe to run multiple times, skips existing users.
 * Transaction-based: Each vendor creation is atomic.
 */

import { withTransaction, query } from '../src/config/database';
import { hashPassword } from '../src/utils/auth';
import { addDays, getDay, startOfDay, format } from 'date-fns';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the next occurrence of a day of week (0=Sunday, 6=Saturday)
 */
function getNextDayOfWeek(targetDay: number): Date {
  const today = startOfDay(new Date());
  const currentDay = getDay(today);
  let daysUntilTarget = targetDay - currentDay;

  // If target day already passed this week, go to next week
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }

  return addDays(today, daysUntilTarget);
}

/**
 * Format Date object as 'YYYY-MM-DD' for PostgreSQL
 */
function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VendorConfig {
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'vendor';
    phone: string;
    timezone: string;
  };
  storefront: {
    name: string;
    description: string;
    address?: string;
    timezone: string;
    profile_type: 'individual' | 'business';
    location_type: 'fixed' | 'mobile' | 'hybrid';
    service_radius?: number;
    service_area_city?: string;
    layout_mode?: string;
    theme_color?: string;
    instagram_handle?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  };
  services: Array<{
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    image_url?: string;
    is_featured?: boolean;
  }>;
  scheduleRules: Array<{
    name?: string;
    rule_type: 'daily' | 'weekly' | 'monthly';
    day_of_week?: number;
    specific_date?: Date;
    start_time: string;
    end_time: string;
    priority: number;
  }>;
}

interface CreateVendorResult {
  success: boolean;
  skipped?: boolean;
  userId?: number;
  storefrontId?: number;
  email: string;
  password?: string;
  storefrontName?: string;
  error?: string;
}

// ============================================================================
// VENDOR CONFIGURATIONS
// ============================================================================

const VENDORS: VendorConfig[] = [
  // Vendor 1: The Midnight Barber (Grid layout, Instagram, Friday drop)
  {
    user: {
      email: 'midnight@schedulux.dev',
      password: 'Hero123!',
      firstName: 'Marcus',
      lastName: 'Night',
      role: 'vendor',
      phone: '+1-415-555-0101',
      timezone: 'America/Los_Angeles',
    },
    storefront: {
      name: 'The Midnight Barber',
      description: 'Premium late-night barbershop for the modern professional',
      address: '415 Castro St, San Francisco, CA 94114',
      timezone: 'America/Los_Angeles',
      profile_type: 'business',
      location_type: 'fixed',
      layout_mode: 'grid',
      theme_color: 'zinc',
      instagram_handle: 'midnight_cuts',
      latitude: 37.7619,
      longitude: -122.4353,
      city: 'San Francisco',
      state: 'CA',
    },
    services: [
      {
        name: 'The Signature Fade',
        description: 'Our signature precision fade with hot towel finish',
        duration_minutes: 60,
        price: 60,
        is_featured: true,
        image_url:
          'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Beard Sculpt',
        description: 'Precision beard trimming and shaping with line work',
        duration_minutes: 30,
        price: 35,
        image_url:
          'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      },
    ],
    scheduleRules: [
      {
        name: 'The Friday Night Drop',
        rule_type: 'daily',
        specific_date: getNextDayOfWeek(5), // Next Friday
        start_time: '20:00',
        end_time: '23:59',
        priority: 10,
      },
    ],
  },

  // Vendor 2: Weekend Warrior Fix-It (Mobile, service radius, list layout)
  {
    user: {
      email: 'fixit@schedulux.dev',
      password: 'Hero123!',
      firstName: 'Jake',
      lastName: 'Handy',
      role: 'vendor',
      phone: '+1-512-555-0202',
      timezone: 'America/Chicago',
    },
    storefront: {
      name: 'Weekend Warrior Fix-It',
      description: 'Handyman services for your weekend projects',
      timezone: 'America/Chicago',
      profile_type: 'individual',
      location_type: 'mobile',
      service_area_city: 'Austin, TX',
      service_radius: 15,
      layout_mode: 'list',
    },
    services: [
      {
        name: 'TV Mounting',
        description: 'Professional TV mounting with cable management',
        duration_minutes: 45,
        price: 75,
      },
      {
        name: 'Furniture Assembly',
        description: 'Expert furniture assembly for all brands',
        duration_minutes: 60,
        price: 60,
      },
    ],
    scheduleRules: [
      {
        name: 'Saturday Hours',
        rule_type: 'weekly',
        day_of_week: 6, // Saturday
        start_time: '09:00',
        end_time: '17:00',
        priority: 2,
      },
      {
        name: 'Sunday Hours',
        rule_type: 'weekly',
        day_of_week: 0, // Sunday
        start_time: '09:00',
        end_time: '17:00',
        priority: 2,
      },
    ],
  },

  // Vendor 3: Sunday Tattoo Flash (Individual, rose theme, limited drop)
  {
    user: {
      email: 'flash@schedulux.dev',
      password: 'Hero123!',
      firstName: 'Luna',
      lastName: 'Ink',
      role: 'vendor',
      phone: '+1-415-555-0303',
      timezone: 'America/Los_Angeles',
    },
    storefront: {
      name: 'Sunday Tattoo Flash',
      description: 'Limited flash designs every Sunday afternoon',
      address: '789 Valencia St, San Francisco, CA 94110',
      timezone: 'America/Los_Angeles',
      profile_type: 'individual',
      location_type: 'fixed',
      layout_mode: 'grid',
      theme_color: 'rose',
      latitude: 37.7599,
      longitude: -122.4214,
      city: 'San Francisco',
      state: 'CA',
    },
    services: [
      {
        name: 'Flash Sheet A',
        description: "Pre-designed flash tattoos from this week's sheet",
        duration_minutes: 90,
        price: 150,
        image_url:
          'https://images.unsplash.com/photo-1598371839696-5c5bb62d4982?auto=format&fit=crop&w=800&q=80',
      },
    ],
    scheduleRules: [
      {
        name: 'Sunday Session',
        rule_type: 'daily',
        specific_date: getNextDayOfWeek(0), // Next Sunday
        start_time: '12:00',
        end_time: '18:00',
        priority: 10,
      },
    ],
  },
];

// ============================================================================
// MAIN VENDOR CREATION LOGIC
// ============================================================================

/**
 * Create a vendor with all associated data (user, storefront, services, rules)
 * Uses transactions for atomic creation and idempotency
 */
async function createVendor(config: VendorConfig): Promise<CreateVendorResult> {
  return await withTransaction(async (client) => {
    // 1. Check if user already exists (idempotent behavior)
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1 AND deleted_at IS NULL',
      [config.user.email]
    );

    if (existingUser.rows.length > 0) {
      console.log(`  ⚠️  User already exists, skipping...`);
      return {
        success: false,
        skipped: true,
        email: config.user.email,
      };
    }

    // 2. Create user
    const hashedPassword = await hashPassword(config.user.password);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        config.user.email,
        hashedPassword,
        config.user.firstName,
        config.user.lastName,
        config.user.role,
        config.user.phone,
        config.user.timezone,
      ]
    );
    const userId = userResult.rows[0].id;
    console.log(`  ✓ User created (ID: ${userId}, Email: ${config.user.email})`);

    // 3. Create storefront (direct SQL to include all marketplace fields)
    const storefrontResult = await client.query(
      `INSERT INTO storefronts (
        vendor_id, name, description, address, timezone,
        profile_type, location_type, service_radius, service_area_city,
        latitude, longitude, city, state,
        layout_mode, theme_color, instagram_handle, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
      RETURNING id`,
      [
        userId,
        config.storefront.name,
        config.storefront.description,
        config.storefront.address || null,
        config.storefront.timezone,
        config.storefront.profile_type || 'business',
        config.storefront.location_type || 'fixed',
        config.storefront.service_radius || null,
        config.storefront.service_area_city || null,
        config.storefront.latitude || null,
        config.storefront.longitude || null,
        config.storefront.city || null,
        config.storefront.state || null,
        config.storefront.layout_mode || 'list',
        config.storefront.theme_color || 'zinc',
        config.storefront.instagram_handle || null,
      ]
    );
    const storefrontId = storefrontResult.rows[0].id;
    console.log(
      `  ✓ Storefront created (ID: ${storefrontId}, Name: ${config.storefront.name})`
    );

    // 4. Create services
    for (const serviceConfig of config.services) {
      const serviceResult = await client.query(
        `INSERT INTO services (
          storefront_id, name, description, duration_minutes, price,
          image_url, is_featured, buffer_time_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
        RETURNING id, name, price, duration_minutes`,
        [
          storefrontId,
          serviceConfig.name,
          serviceConfig.description || null,
          serviceConfig.duration_minutes,
          serviceConfig.price,
          serviceConfig.image_url || null,
          serviceConfig.is_featured || false,
        ]
      );
      const service = serviceResult.rows[0];
      console.log(
        `  ✓ Service created: ${service.name} ($${service.price}, ${service.duration_minutes}min)`
      );
    }

    // 5. Create schedule rules
    for (const ruleConfig of config.scheduleRules) {
      const specificDate = ruleConfig.specific_date
        ? formatDateForDB(ruleConfig.specific_date)
        : null;

      await client.query(
        `INSERT INTO schedule_rules (
          storefront_id, service_id, rule_type, priority,
          day_of_week, specific_date, start_time, end_time,
          is_available, max_concurrent_appointments, name
        ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, true, 10, $8)`,
        [
          storefrontId,
          ruleConfig.rule_type,
          ruleConfig.priority,
          ruleConfig.day_of_week !== undefined ? ruleConfig.day_of_week : null,
          specificDate,
          ruleConfig.start_time,
          ruleConfig.end_time,
          ruleConfig.name || null,
        ]
      );

      const dateDisplay = specificDate
        ? `${specificDate} ${ruleConfig.start_time}-${ruleConfig.end_time}`
        : `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][ruleConfig.day_of_week || 0]} ${ruleConfig.start_time}-${ruleConfig.end_time}`;

      console.log(
        `  ✓ Schedule rule created: ${ruleConfig.name || 'Rule'} (${dateDisplay})`
      );
    }

    return {
      success: true,
      userId,
      storefrontId,
      email: config.user.email,
      password: config.user.password,
      storefrontName: config.storefront.name,
    };
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main entry point: Create all hero vendors
 */
async function seedHeroes() {
  console.log('🎯 Creating Hero Vendors...\n');

  const results: CreateVendorResult[] = [];

  for (let i = 0; i < VENDORS.length; i++) {
    const vendorConfig = VENDORS[i];
    console.log(`Vendor ${i + 1}/${VENDORS.length}: ${vendorConfig.storefront.name}`);

    try {
      const result = await createVendor(vendorConfig);
      results.push(result);
      console.log(`  ✅ Successfully created\n`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      results.push({
        success: false,
        email: vendorConfig.user.email,
        error: error.message,
      });
    }
  }

  // Print summary with login credentials
  console.log('\n=====================================');
  console.log('Hero Login Credentials:');
  console.log('=====================================');

  results.forEach((result, index) => {
    if (result.success) {
      console.log(
        `${index + 1}. ${result.email} / ${result.password} (Storefront ID: ${result.storefrontId})`
      );
    } else if (result.skipped) {
      console.log(`${index + 1}. ${result.email} (SKIPPED - already exists)`);
    } else {
      console.log(`${index + 1}. ${result.email} (FAILED - ${result.error})`);
    }
  });

  console.log('=====================================\n');

  const successCount = results.filter((r) => r.success).length;
  const skippedCount = results.filter((r) => r.skipped).length;

  if (successCount > 0) {
    console.log(`✅ ${successCount}/${VENDORS.length} vendors created successfully!`);
  }
  if (skippedCount > 0) {
    console.log(`⏭️  ${skippedCount}/${VENDORS.length} vendors already exist`);
  }

  const failedCount = results.filter((r) => !r.success && !r.skipped).length;
  if (failedCount > 0) {
    console.log(`❌ ${failedCount}/${VENDORS.length} vendors failed`);
  }

  console.log('\n🎯 You can now login at: http://localhost:5173/login\n');

  process.exit(0);
}

// Run the script
seedHeroes().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
