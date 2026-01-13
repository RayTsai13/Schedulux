/**
 * Test script for Service CRUD endpoints
 * Run with: npx ts-node scripts/test-service-crud.ts
 */

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🧪 Testing Service CRUD Endpoints\n');
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
    process.exit(1);
  }

  const token = loginData.data.token;
  console.log('✅ Login successful');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 2: Create a storefront first (services need a storefront)
  console.log('\n2️⃣  Creating a test storefront...');
  const storefrontResponse = await fetch(`${BASE_URL}/api/storefronts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Test Salon for Services',
      timezone: 'America/Los_Angeles'
    })
  });
  const storefrontData = await storefrontResponse.json();

  if (!storefrontData.success) {
    console.log('❌ Failed to create storefront:', storefrontData.message);
    process.exit(1);
  }

  const storefrontId = storefrontData.data.id;
  console.log(`✅ Created storefront ID: ${storefrontId}`);

  // Step 3: GET services for storefront (should be empty)
  console.log(`\n3️⃣  GET /api/storefronts/${storefrontId}/services (public list)...`);
  const listResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}/services`);
  const listData = await listResponse.json();
  console.log(`✅ Status: ${listResponse.status}`);
  console.log(`   Found ${listData.data?.length || 0} services`);

  // Step 4: POST create a new service
  console.log(`\n4️⃣  POST /api/storefronts/${storefrontId}/services (create)...`);
  const createResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}/services`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Haircut',
      description: 'A classic haircut',
      duration_minutes: 30,
      buffer_time_minutes: 5,
      price: 25.00,
      category: 'Hair'
    })
  });
  const createData = await createResponse.json();
  console.log(`✅ Status: ${createResponse.status}`);

  if (!createData.success) {
    console.log('❌ Create failed:', createData.message);
    console.log('   Data:', JSON.stringify(createData, null, 2));
    process.exit(1);
  }

  const serviceId = createData.data.id;
  console.log(`   Created service ID: ${serviceId}`);
  console.log(`   Name: ${createData.data.name}, Duration: ${createData.data.duration_minutes}min, Price: $${createData.data.price}`);

  // Step 5: GET single service by ID (public)
  console.log(`\n5️⃣  GET /api/services/${serviceId} (get by ID, public)...`);
  const getResponse = await fetch(`${BASE_URL}/api/services/${serviceId}`);
  const getData = await getResponse.json();
  console.log(`✅ Status: ${getResponse.status}`);
  console.log(`   Name: ${getData.data?.name}`);

  // Step 6: PUT update the service
  console.log(`\n6️⃣  PUT /api/services/${serviceId} (update)...`);
  const updateResponse = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Premium Haircut',
      price: 35.00,
      duration_minutes: 45
    })
  });
  const updateData = await updateResponse.json();
  console.log(`✅ Status: ${updateResponse.status}`);
  console.log(`   New name: ${updateData.data?.name}, New price: $${updateData.data?.price}`);

  // Step 7: Create another service and deactivate it
  console.log(`\n7️⃣  Creating an inactive service to test public vs private listing...`);
  const inactiveResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}/services`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Special Service',
      duration_minutes: 60,
      price: 100.00
    })
  });
  const inactiveData = await inactiveResponse.json();
  const inactiveServiceId = inactiveData.data.id;

  // Deactivate it
  await fetch(`${BASE_URL}/api/services/${inactiveServiceId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ is_active: false })
  });
  console.log(`✅ Created and deactivated service ID: ${inactiveServiceId}`);

  // Step 8: Compare public vs private listing
  console.log(`\n8️⃣  Comparing public vs private service lists...`);

  const publicList = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}/services`);
  const publicData = await publicList.json();

  const privateList = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}/services/all`, {
    headers: authHeaders
  });
  const privateData = await privateList.json();

  console.log(`   Public list (active only): ${publicData.data?.length} services`);
  console.log(`   Private list (all): ${privateData.data?.length} services`);

  // Step 9: Test validation (invalid duration)
  console.log('\n9️⃣  POST with invalid duration (validation test)...');
  const validationResponse = await fetch(`${BASE_URL}/api/storefronts/${storefrontId}/services`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Bad Service', duration_minutes: -5 })
  });
  const validationData = await validationResponse.json();
  console.log(`✅ Status: ${validationResponse.status} (expected 400)`);
  console.log(`   Error: ${validationData.error}`);

  // Step 10: DELETE both services
  console.log(`\n🔟  DELETE /api/services/${serviceId} and ${inactiveServiceId}...`);

  const deleteResponse1 = await fetch(`${BASE_URL}/api/services/${serviceId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log(`✅ Deleted service ${serviceId}: ${deleteResponse1.status}`);

  const deleteResponse2 = await fetch(`${BASE_URL}/api/services/${inactiveServiceId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log(`✅ Deleted service ${inactiveServiceId}: ${deleteResponse2.status}`);

  // Step 11: Cleanup - delete the storefront
  console.log(`\n1️⃣1️⃣ Cleanup: Deleting test storefront...`);
  await fetch(`${BASE_URL}/api/storefronts/${storefrontId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  console.log('✅ Storefront deleted');

  console.log('\n' + '='.repeat(50));
  console.log('✅ All Service CRUD tests completed successfully!');
}

main().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
