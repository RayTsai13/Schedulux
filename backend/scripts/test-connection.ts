#!/usr/bin/env ts-node

/**
 * Simple test for the TypeScript database configuration
 * Run with: npx ts-node scripts/test-connection.ts
 */

import { pool, query } from '../src/config/database';

async function testConnection() {
  console.log('🔄 Testing TypeScript database connection...');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
    
    // Test database name
    console.log('\n2. Testing database name...');
    const dbResult = await query('SELECT current_database() as db_name');
    console.log(`✅ Connected to database: ${dbResult.rows[0].db_name}`);
    
    // Test user
    console.log('\n3. Testing user...');
    const userResult = await query('SELECT current_user as username');
    console.log(`✅ Connected as user: ${userResult.rows[0].username}`);
    
    // Test table count
    console.log('\n4. Testing schema...');
    const tableResult = await query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log(`✅ Found ${tableResult.rows[0].table_count} tables in schema`);
    
    // Test a simple query on your schema
    console.log('\n5. Testing sample query...');
    const sampleResult = await query('SELECT COUNT(*) as user_count FROM users');
    console.log(`✅ Found ${sampleResult.rows[0].user_count} users in database`);
    
    console.log('\n🎉 All tests passed! Your TypeScript database config is working perfectly.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('🔄 Database connections closed.');
  }
}

// Run the test
testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
