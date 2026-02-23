/**
 * Cleanup Script: Remove Non-Demo Storefronts
 *
 * Deletes all storefronts that are NOT owned by demo users.
 * Keeps only storefronts owned by the hero vendor accounts.
 *
 * Usage:
 *   npx ts-node scripts/cleanup-demo-storefronts.ts
 */

import { query } from '../src/config/database';

// Demo user emails (from seed scripts)
const DEMO_USER_EMAILS = [
  'midnight@schedulux.dev',
  'fixit@schedulux.dev',
  'flash@schedulux.dev',
  'client1@schedulux.dev',
  'client2@schedulux.dev',
  'client3@schedulux.dev',
];

async function cleanupStorefronts() {
  console.log('🧹 Starting storefront cleanup...\n');

  try {
    // Get demo user IDs
    const demoUsersResult = await query(
      'SELECT id, email FROM users WHERE email = ANY($1)',
      [DEMO_USER_EMAILS]
    );

    const demoUserIds = demoUsersResult.rows.map(row => row.id);
    console.log(`✅ Found ${demoUserIds.length} demo users:`, demoUsersResult.rows.map(r => r.email));
    console.log('');

    // Find all storefronts
    const allStorefrontsResult = await query(
      'SELECT id, vendor_id, name FROM storefronts WHERE deleted_at IS NULL'
    );

    console.log(`📊 Total storefronts in database: ${allStorefrontsResult.rows.length}\n`);

    // Separate demo vs non-demo storefronts
    const demoStorefronts = allStorefrontsResult.rows.filter(sf =>
      demoUserIds.includes(sf.vendor_id)
    );

    const nonDemoStorefronts = allStorefrontsResult.rows.filter(sf =>
      !demoUserIds.includes(sf.vendor_id)
    );

    console.log(`✅ Demo storefronts (will keep): ${demoStorefronts.length}`);
    demoStorefronts.forEach(sf => {
      console.log(`   - ID ${sf.id}: ${sf.name} (vendor: ${sf.vendor_id})`);
    });
    console.log('');

    console.log(`🗑️  Non-demo storefronts (will delete): ${nonDemoStorefronts.length}`);
    nonDemoStorefronts.forEach(sf => {
      console.log(`   - ID ${sf.id}: ${sf.name} (vendor: ${sf.vendor_id})`);
    });
    console.log('');

    if (nonDemoStorefronts.length === 0) {
      console.log('✨ No non-demo storefronts to delete. Database is clean!');
      return;
    }

    // Delete non-demo storefronts (soft delete)
    const nonDemoIds = nonDemoStorefronts.map(sf => sf.id);

    // Soft delete (set deleted_at)
    const deleteResult = await query(
      `UPDATE storefronts
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = ANY($1)
       RETURNING id, name`,
      [nonDemoIds]
    );

    console.log(`✅ Deleted ${deleteResult.rows.length} non-demo storefronts:`);
    deleteResult.rows.forEach(sf => {
      console.log(`   ✓ ${sf.name} (ID: ${sf.id})`);
    });
    console.log('');

    // Also delete related data (services, schedule rules, appointments)
    console.log('🧹 Cleaning up related data...\n');

    // Delete services
    const deletedServicesResult = await query(
      `UPDATE services
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE storefront_id = ANY($1) AND deleted_at IS NULL
       RETURNING id`,
      [nonDemoIds]
    );
    console.log(`   ✓ Deleted ${deletedServicesResult.rows.length} services`);

    // Delete schedule rules
    const deletedRulesResult = await query(
      `DELETE FROM schedule_rules
       WHERE storefront_id = ANY($1)
       RETURNING id`,
      [nonDemoIds]
    );
    console.log(`   ✓ Deleted ${deletedRulesResult.rows.length} schedule rules`);

    // Soft delete appointments
    const deletedAppointmentsResult = await query(
      `UPDATE appointments
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE storefront_id = ANY($1) AND deleted_at IS NULL
       RETURNING id`,
      [nonDemoIds]
    );
    console.log(`   ✓ Deleted ${deletedAppointmentsResult.rows.length} appointments`);

    console.log('\n✨ Cleanup complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Kept: ${demoStorefronts.length} demo storefronts`);
    console.log(`   - Deleted: ${deleteResult.rows.length} non-demo storefronts`);
    console.log(`   - Cleaned: ${deletedServicesResult.rows.length} services, ${deletedRulesResult.rows.length} rules, ${deletedAppointmentsResult.rows.length} appointments`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup
cleanupStorefronts()
  .then(() => {
    console.log('\n✅ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error);
    process.exit(1);
  });
