#!/usr/bin/env node

/**
 * Database Test Script
 * Tests all major functionality of the scheduling app database
 * Run with: node test-database.js
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'scheduling_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

// Helper functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function pass(testName) {
  testsPassed++;
  log(`✅ PASS: ${testName}`, 'success');
}

function fail(testName, error) {
  testsFailed++;
  failedTests.push({ test: testName, error: error.message });
  log(`❌ FAIL: ${testName}`, 'error');
  log(`   Error: ${error.message}`, 'error');
}

async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Generate unique email for each test run
function generateTestEmail(testName) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${testName}-${timestamp}-${random}@example.com`;
}

// Test functions
async function testDatabaseConnection() {
  const testName = 'Database Connection';
  try {
    await query('SELECT NOW()');
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testTableExists() {
  const testName = 'All Tables Exist';
  try {
    const expectedTables = [
      'users', 'storefronts', 'services', 'schedule_rules', 
      'appointment_slots', 'appointments', 'schedule_rules_history', 
      'appointment_history', 'availability_snapshots'
    ];
    
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    
    for (const table of expectedTables) {
      if (!existingTables.includes(table)) {
        throw new Error(`Table '${table}' does not exist`);
      }
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testIndexesExist() {
  const testName = 'Critical Indexes Exist';
  try {
    const result = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    const indexes = result.rows.map(row => row.indexname);
    const criticalIndexes = [
      'idx_users_email',
      'idx_appointments_storefront',
      'idx_schedule_rules_daily_lookup'
    ];
    
    for (const index of criticalIndexes) {
      if (!indexes.includes(index)) {
        throw new Error(`Critical index '${index}' does not exist`);
      }
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testTriggersExist() {
  const testName = 'Database Triggers Exist';
  try {
    const result = await query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `);
    
    const triggers = result.rows.map(row => row.trigger_name);
    const expectedTriggers = [
      'update_users_updated_at',
      'track_schedule_rule_changes_trigger',
      'track_appointment_changes_trigger'
    ];
    
    for (const trigger of expectedTriggers) {
      if (!triggers.includes(trigger)) {
        throw new Error(`Trigger '${trigger}' does not exist`);
      }
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testBasicCRUD() {
  const testName = 'Basic CRUD Operations';
  try {
    const testEmail = generateTestEmail('basic-crud');
    
    // Test INSERT
    const insertResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [testEmail, 'hashed_password', 'Test', 'User', 'vendor']);
    
    const userId = insertResult.rows[0].id;
    
    // Test SELECT
    const selectResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (selectResult.rows.length !== 1) {
      throw new Error('User not found after insert');
    }
    
    // Test UPDATE
    await query('UPDATE users SET first_name = $1 WHERE id = $2', ['Updated', userId]);
    
    const updatedResult = await query('SELECT first_name FROM users WHERE id = $1', [userId]);
    if (updatedResult.rows[0].first_name !== 'Updated') {
      throw new Error('User not updated properly');
    }
    
    // Test DELETE
    await query('DELETE FROM users WHERE id = $1', [userId]);
    
    const deletedResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (deletedResult.rows.length !== 0) {
      throw new Error('User not deleted properly');
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testForeignKeyConstraints() {
  const testName = 'Foreign Key Constraints';
  try {
    // Try to insert storefront with non-existent vendor_id
    try {
      await query(`
        INSERT INTO storefronts (vendor_id, name)
        VALUES (99999, 'Test Storefront')
      `);
      throw new Error('Foreign key constraint should have prevented this insert');
    } catch (constraintError) {
      // This should fail - foreign key constraint working
      if (!constraintError.message.includes('violates foreign key constraint')) {
        throw constraintError;
      }
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testCheckConstraints() {
  const testName = 'Check Constraints';
  try {
    const testEmail = generateTestEmail('check-constraints');
    
    // Create a test user first
    const userResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [testEmail, 'hashed', 'Test', 'User', 'vendor']);
    
    const userId = userResult.rows[0].id;
    
    // Create a test storefront
    const storefrontResult = await query(`
      INSERT INTO storefronts (vendor_id, name)
      VALUES ($1, $2)
      RETURNING id
    `, [userId, 'Test Storefront']);
    
    const storefrontId = storefrontResult.rows[0].id;
    
    // Test invalid duration_minutes (should fail)
    try {
      await query(`
        INSERT INTO services (storefront_id, name, duration_minutes)
        VALUES ($1, $2, $3)
      `, [storefrontId, 'Test Service', -10]);
      
      throw new Error('Check constraint should have prevented negative duration');
    } catch (constraintError) {
      if (!constraintError.message.includes('check constraint')) {
        throw constraintError;
      }
    }
    
    // Test invalid schedule rule (should fail)
    try {
      await query(`
        INSERT INTO schedule_rules (storefront_id, rule_type, start_time, end_time, day_of_week)
        VALUES ($1, $2, $3, $4, $5)
      `, [storefrontId, 'weekly', '17:00', '09:00', 1]); // end_time before start_time
      
      throw new Error('Check constraint should have prevented invalid time range');
    } catch (constraintError) {
      if (!constraintError.message.includes('check constraint')) {
        throw constraintError;
      }
    }
    
    // Cleanup in correct order: children first, then parent
    await query('DELETE FROM storefronts WHERE id = $1', [storefrontId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testUpdatedAtTriggers() {
  const testName = 'Updated_at Triggers';
  try {
    const testEmail = generateTestEmail('updated-at');
    
    // Create test user
    const insertResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at, updated_at
    `, [testEmail, 'hashed', 'Trigger', 'Test', 'client']);
    
    const userId = insertResult.rows[0].id;
    const originalUpdatedAt = insertResult.rows[0].updated_at;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update the user
    await query('UPDATE users SET first_name = $1 WHERE id = $2', ['Updated', userId]);
    
    // Check if updated_at was automatically updated
    const updateResult = await query('SELECT updated_at FROM users WHERE id = $1', [userId]);
    const newUpdatedAt = updateResult.rows[0].updated_at;
    
    if (newUpdatedAt <= originalUpdatedAt) {
      throw new Error('updated_at trigger did not fire correctly');
    }
    
    // Cleanup
    await query('DELETE FROM users WHERE id = $1', [userId]);
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

async function testHistoryTriggers() {
  const testName = 'History Triggers';
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const testEmail = generateTestEmail('history');
    
    // Create test data
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [testEmail, 'hashed', 'History', 'Test', 'vendor']);
    
    const userId = userResult.rows[0].id;
    
    const storefrontResult = await client.query(`
      INSERT INTO storefronts (vendor_id, name)
      VALUES ($1, $2)
      RETURNING id
    `, [userId, 'History Test Storefront']);
    
    const storefrontId = storefrontResult.rows[0].id;
    
    // Create a schedule rule (should trigger history)
    const ruleResult = await client.query(`
      INSERT INTO schedule_rules (storefront_id, rule_type, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [storefrontId, 'weekly', 1, '09:00', '17:00']);
    
    const ruleId = ruleResult.rows[0].id;
    
    // Commit the transaction to ensure trigger has fired
    await client.query('COMMIT');
    
    // Start a new transaction for verification and cleanup
    await client.query('BEGIN');
    
    // Check if history was created
    const historyResult = await client.query(`
      SELECT * FROM schedule_rules_history 
      WHERE schedule_rule_id = $1 AND action = 'created'
    `, [ruleId]);
    
    if (historyResult.rows.length !== 1) {
      throw new Error(`History trigger did not create record for schedule rule insert. Found ${historyResult.rows.length} records for rule_id ${ruleId}`);
    }
    
    // Update the rule (should create another history record)
    await client.query('UPDATE schedule_rules SET start_time = $1 WHERE id = $2', ['10:00', ruleId]);
    
    const updateHistoryResult = await client.query(`
      SELECT * FROM schedule_rules_history 
      WHERE schedule_rule_id = $1 AND action = 'updated'
    `, [ruleId]);
    
    if (updateHistoryResult.rows.length !== 1) {
      throw new Error('History trigger did not create record for schedule rule update');
    }
    
    // Cleanup in correct order: children first, then parents
    await client.query('DELETE FROM schedule_rules WHERE id = $1', [ruleId]);
    await client.query('DELETE FROM storefronts WHERE id = $1', [storefrontId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    
    pass(testName);
  } catch (error) {
    await client.query('ROLLBACK');
    fail(testName, error);
  } finally {
    client.release();
  }
}

async function testComplexScheduleRules() {
  const testName = 'Complex Schedule Rules';
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const testEmail = generateTestEmail('schedule');
    
    // Create test data
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [testEmail, 'hashed', 'Schedule', 'Test', 'vendor']);
    
    const userId = userResult.rows[0].id;
    
    const storefrontResult = await client.query(`
      INSERT INTO storefronts (vendor_id, name)
      VALUES ($1, $2)
      RETURNING id
    `, [userId, 'Schedule Test Storefront']);
    
    const storefrontId = storefrontResult.rows[0].id;
    
    const serviceResult = await client.query(`
      INSERT INTO services (storefront_id, name, duration_minutes)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [storefrontId, 'Test Service', 60]);
    
    const serviceId = serviceResult.rows[0].id;
    
    // Create different types of schedule rules
    
    // Weekly rule - general availability
    await client.query(`
      INSERT INTO schedule_rules (storefront_id, rule_type, day_of_week, start_time, end_time, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [storefrontId, 'weekly', 1, '09:00', '17:00', 1]);
    
    // Daily rule - specific date override
    await client.query(`
      INSERT INTO schedule_rules (storefront_id, rule_type, specific_date, start_time, end_time, is_available, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [storefrontId, 'daily', '2025-12-25', '00:00', '23:59', false, 10]);
    
    // Service-specific rule
    await client.query(`
      INSERT INTO schedule_rules (storefront_id, service_id, rule_type, day_of_week, start_time, end_time, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [storefrontId, serviceId, 'weekly', 2, '10:00', '16:00', 5]);
    
    // Commit to ensure all rules are created and triggers fired
    await client.query('COMMIT');
    
    // Start new transaction for verification and cleanup
    await client.query('BEGIN');
    
    // Query rules to make sure they were created correctly
    const rulesResult = await client.query(`
      SELECT rule_type, priority, is_available 
      FROM schedule_rules 
      WHERE storefront_id = $1 
      ORDER BY priority DESC
    `, [storefrontId]);
    
    if (rulesResult.rows.length !== 3) {
      throw new Error(`Expected 3 schedule rules, found ${rulesResult.rows.length}`);
    }
    
    // Cleanup in correct order: children first, then parents
    await client.query('DELETE FROM schedule_rules WHERE storefront_id = $1', [storefrontId]);
    await client.query('DELETE FROM services WHERE id = $1', [serviceId]);
    await client.query('DELETE FROM storefronts WHERE id = $1', [storefrontId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    
    pass(testName);
  } catch (error) {
    await client.query('ROLLBACK');
    fail(testName, error);
  } finally {
    client.release();
  }
}

async function testAppointmentSlotBookingCount() {
  const testName = 'Appointment Slot Booking Count';
  try {
    const vendorEmail = generateTestEmail('vendor-slot');
    const clientEmail = generateTestEmail('client-slot');
    
    // Create test data
    const userResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)
      RETURNING id
    `, [vendorEmail, 'hashed', 'Vendor', 'User', 'vendor',
        clientEmail, 'hashed', 'Client', 'User', 'client']);
    
    const vendorId = userResult.rows[0].id;
    const clientId = userResult.rows[1].id;
    
    const storefrontResult = await query(`
      INSERT INTO storefronts (vendor_id, name)
      VALUES ($1, $2)
      RETURNING id
    `, [vendorId, 'Slot Test Storefront']);
    
    const storefrontId = storefrontResult.rows[0].id;
    
    const serviceResult = await query(`
      INSERT INTO services (storefront_id, name, duration_minutes)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [storefrontId, 'Slot Test Service', 30]);
    
    const serviceId = serviceResult.rows[0].id;
    
    // Create appointment slot with max 2 bookings
    const slotResult = await query(`
      INSERT INTO appointment_slots (storefront_id, service_id, start_datetime, end_datetime, max_bookings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [storefrontId, serviceId, '2025-07-15 14:00:00', '2025-07-15 14:30:00', 2]);
    
    const slotId = slotResult.rows[0].id;
    
    // Check initial booking count
    let slotCheck = await query('SELECT current_bookings FROM appointment_slots WHERE id = $1', [slotId]);
    if (slotCheck.rows[0].current_bookings !== 0) {
      throw new Error('Initial booking count should be 0');
    }
    
    // Book the slot (should increment count)
    const appointmentResult = await query(`
      INSERT INTO appointments (client_id, storefront_id, service_id, slot_id, requested_start_datetime, requested_end_datetime, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [clientId, storefrontId, serviceId, slotId, '2025-07-15 14:00:00', '2025-07-15 14:30:00', 'confirmed']);
    
    const appointmentId = appointmentResult.rows[0].id;
    
    // Check booking count after insert
    slotCheck = await query('SELECT current_bookings FROM appointment_slots WHERE id = $1', [slotId]);
    if (slotCheck.rows[0].current_bookings !== 1) {
      throw new Error('Booking count should be 1 after appointment insert');
    }
    
    // Cancel appointment (should decrement count)
    await query('DELETE FROM appointments WHERE id = $1', [appointmentId]);
    
    // Check booking count after delete
    slotCheck = await query('SELECT current_bookings FROM appointment_slots WHERE id = $1', [slotId]);
    if (slotCheck.rows[0].current_bookings !== 0) {
      throw new Error('Booking count should be 0 after appointment delete');
    }
    
    // Cleanup in correct order: children first, then parents
    await query('DELETE FROM appointment_slots WHERE id = $1', [slotId]);
    await query('DELETE FROM services WHERE id = $1', [serviceId]);
    await query('DELETE FROM storefronts WHERE id = $1', [storefrontId]);
    await query('DELETE FROM users WHERE id IN ($1, $2)', [vendorId, clientId]);
    
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Database Tests...', 'info');
  log('=' .repeat(50), 'info');
  
  const tests = [
    testDatabaseConnection,
    testTableExists,
    testIndexesExist,
    testTriggersExist,
    testBasicCRUD,
    testForeignKeyConstraints,
    testCheckConstraints,
    testUpdatedAtTriggers,
    testHistoryTriggers,
    testComplexScheduleRules,
    testAppointmentSlotBookingCount
  ];
  
  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      log(`Unexpected error in ${test.name}: ${error.message}`, 'error');
    }
  }
  
  // Summary
  log('=' .repeat(50), 'info');
  log(`📊 Test Results:`, 'info');
  log(`   ✅ Passed: ${testsPassed}`, 'success');
  log(`   ❌ Failed: ${testsFailed}`, 'error');
  
  if (failedTests.length > 0) {
    log('\n📝 Failed Tests:', 'warning');
    failedTests.forEach(({ test, error }, index) => {
      log(`   ${index + 1}. ${test}: ${error}`, 'error');
    });
  }
  
  if (testsFailed === 0) {
    log('\n🎉 All tests passed! Your database is working correctly.', 'success');
  } else {
    log(`\n⚠️  ${testsFailed} test(s) failed. Check your database setup.`, 'warning');
  }
  
  // Close database connection
  await pool.end();
  
  // Exit with appropriate code
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests };