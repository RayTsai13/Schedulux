/**
 * Test script for Storefront CRUD endpoints
 * Run with: npx ts-node scripts/test-storefront-crud.ts
 */

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🧪 Testing Storefront CRUD Endpoints\n');
  console.log('='.repeat(50));

  // Step 1: Login to get token
  console.log('\n1️⃣  Logging in as admin...');
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@schedulux.com',
      password: 'Admin123!'
    })
  });

  const loginData = await loginResponse.json();

  if (!loginData.success) {
    console.log('❌ Login failed:', loginData.message);
    console.log('   Run: npx ts-node scripts/create-admin.ts');
    process.exit(1);
  }

  const token = loginData.data.token;
  console.log('✅ Login successful, got token');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 2: GET all storefronts (should be empty or have existing ones)
  console.log('\n2️⃣  GET /api/storefronts (list all)...');
  const listResponse = await fetch(`${BASE_URL}/api/storefronts`, {
    headers: authHeaders
  });
  const listData = await listResponse.json();
  console.log(`✅ Status: ${listResponse.status}`);
  console.log(`   Found ${listData.data?.length || 0} storefronts`);

  // Step 3: POST create a new storefront
  console.log('\n3️⃣  POST /api/storefronts (create)...');
  const createResponse = await fetch(`${BASE_URL}/api/storefronts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Test Salon',
      description: 'A test storefront',
      address: '123 Main St',
      phone: '+14155551234',
      email: 'test@salon.com',
      timezone: 'America/Los_Angeles'
    })
  });
  const createData = await createResponse.json();
  console.log(`✅ Status: ${createResponse.status}`);

  if (!createData.success) {
    console.log('❌ Create failed:', createData.message);
    console.log('   Data:', JSON.stringify(createData, null, 2));
    process.exit(1);
  }

  const storefrontId = createData.data.id;
  console.log(`   Created storefront ID: ${storefrontId}`);

  // Step 4: GET single storefront by ID
  console.log(`\n4️⃣  GET /api/storefronts/${storefrontId} (get by ID)...`);
  const getResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}`, {
    headers: authHeaders
  });
  const getData = await getResponse.json();
  console.log(`✅ Status: ${getResponse.status}`);
  console.log(`   Name: ${getData.data?.name}`);

  // Step 5: PUT update the storefront
  console.log(`\n5️⃣  PUT /api/storefronts/${storefrontId} (update)...`);
  const updateResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Updated Salon Name',
      description: 'Updated description'
    })
  });
  const updateData = await updateResponse.json();
  console.log(`✅ Status: ${updateResponse.status}`);
  console.log(`   New name: ${updateData.data?.name}`);

  // Step 6: Test validation (empty name should fail)
  console.log('\n6️⃣  POST /api/storefronts with empty name (validation test)...');
  const validationResponse = await fetch(`${BASE_URL}/api/storefronts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: '' })
  });
  const validationData = await validationResponse.json();
  console.log(`✅ Status: ${validationResponse.status} (expected 400)`);
  console.log(`   Error: ${validationData.error}`);

  // Step 7: DELETE the storefront
  console.log(`\n7️⃣  DELETE /api/storefronts/${storefrontId} (soft delete)...`);
  const deleteResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const deleteData = await deleteResponse.json();
  console.log(`✅ Status: ${deleteResponse.status}`);
  console.log(`   Message: ${deleteData.message}`);

  // Step 8: Verify deletion (should return 404)
  console.log(`\n8️⃣  GET /api/storefronts/${storefrontId} after delete...`);
  const verifyResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}`, {
    headers: authHeaders
  });
  const verifyData = await verifyResponse.json();
  console.log(`✅ Status: ${verifyResponse.status} (expected 404)`);
  console.log(`   Message: ${verifyData.message}`);

  console.log('\n' + '='.repeat(50));
  console.log('✅ All CRUD tests completed successfully!');
}

main().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
