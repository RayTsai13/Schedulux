/**
 * Create Admin User Script
 *
 * This script creates an admin user in the database for testing and management.
 * Run with: npx ts-node scripts/create-admin.ts
 */

import { query } from '../src/config/database';
import { hashPassword } from '../src/utils/auth';

async function createAdminUser() {
  console.log('🔧 Creating admin user...\n');

  // Admin user credentials
  const adminData = {
    email: 'admin@schedulux.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'vendor', // Use 'vendor' role for now (can add 'admin' role later)
    phone: '+1-555-0100',
    timezone: 'America/Los_Angeles',
  };

  try {
    // Check if admin user already exists
    console.log(`📧 Checking if ${adminData.email} already exists...`);
    const existingUser = await query(
      'SELECT id, email FROM users WHERE email = $1 AND deleted_at IS NULL',
      [adminData.email]
    );

    if (existingUser.rows.length > 0) {
      console.log(`\n⚠️  Admin user already exists!`);
      console.log(`User ID: ${existingUser.rows[0].id}`);
      console.log(`Email: ${existingUser.rows[0].email}`);
      console.log(`\n💡 If you want to reset the password, delete the user first:\n`);
      console.log(`   DELETE FROM users WHERE email = '${adminData.email}';\n`);
      process.exit(0);
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(adminData.password);

    // Insert admin user into database
    console.log('💾 Inserting admin user into database...');
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [
        adminData.email,
        hashedPassword,
        adminData.firstName,
        adminData.lastName,
        adminData.role,
        adminData.phone,
        adminData.timezone,
      ]
    );

    const createdUser = result.rows[0];

    console.log('\n✅ Admin user created successfully!\n');
    console.log('=====================================');
    console.log('Admin Login Credentials:');
    console.log('=====================================');
    console.log(`Email:    ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log('=====================================');
    console.log('\nUser Details:');
    console.log(`ID:         ${createdUser.id}`);
    console.log(`Name:       ${createdUser.first_name} ${createdUser.last_name}`);
    console.log(`Role:       ${createdUser.role}`);
    console.log(`Created:    ${createdUser.created_at}`);
    console.log('=====================================\n');

    console.log('🎯 You can now login at: http://localhost:5173/login\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
