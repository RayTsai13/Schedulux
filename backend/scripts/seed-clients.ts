/**
 * Seed Script: Demo Client Accounts
 *
 * Creates demo client users for testing the booking flow and client dashboard.
 *
 * Usage:
 *   npx ts-node scripts/seed-clients.ts
 */

import { query } from '../src/config/database';
import bcrypt from 'bcryptjs';

interface ClientData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  timezone: string;
}

const DEMO_CLIENTS: ClientData[] = [
  {
    email: 'client1@schedulux.dev',
    password: 'Client123!',
    first_name: 'Alex',
    last_name: 'Chen',
    phone: '(415) 555-0101',
    timezone: 'America/Los_Angeles',
  },
  {
    email: 'client2@schedulux.dev',
    password: 'Client123!',
    first_name: 'Jordan',
    last_name: 'Smith',
    phone: '(312) 555-0202',
    timezone: 'America/Chicago',
  },
  {
    email: 'client3@schedulux.dev',
    password: 'Client123!',
    first_name: 'Taylor',
    last_name: 'Williams',
    phone: '(512) 555-0303',
    timezone: 'America/Chicago',
  },
];

async function seedClients() {
  console.log('🌱 Starting client seed...\n');

  for (const client of DEMO_CLIENTS) {
    try {
      // Check if client already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [client.email]
      );

      if (existingUser.rows.length > 0) {
        console.log(`⏭️  Skipping ${client.email} (already exists)`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(client.password, 10);

      // Create client user
      const userResult = await query(
        `INSERT INTO users (
          email, password_hash, first_name, last_name,
          role, phone, timezone, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id`,
        [
          client.email,
          hashedPassword,
          client.first_name,
          client.last_name,
          'client',
          client.phone,
          client.timezone,
        ]
      );

      const userId = userResult.rows[0].id;

      console.log(`✅ Created client: ${client.first_name} ${client.last_name}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Password: ${client.password}`);
      console.log(`   User ID: ${userId}\n`);
    } catch (error) {
      console.error(`❌ Failed to create client ${client.email}:`, error);
    }
  }

  console.log('✨ Client seed complete!\n');
  console.log('📝 Test Login Credentials:');
  DEMO_CLIENTS.forEach((client) => {
    console.log(`   ${client.email} / ${client.password}`);
  });
  console.log('');
}

// Run seed
seedClients()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
