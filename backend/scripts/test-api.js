#!/usr/bin/env node

const axios = require('axios');

async function testBackend() {
  const baseURL = 'http://localhost:3000/api';
  
  console.log('🧪 Testing Backend Authentication API');
  console.log('=====================================');
  
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', healthResponse.data.message);
    
    // Test 2: User Registration
    console.log('\n2️⃣ Testing User Registration...');
    const testUser = {
      email: `test${Date.now()}@schedulux.com`,
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User',
      role: 'vendor',
      phone: '+1234567890'
    };
    
    const registerResponse = await axios.post(`${baseURL}/auth/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('👤 User created:', registerResponse.data.data.user.email);
    
    const authToken = registerResponse.data.data.token;
    const userId = registerResponse.data.data.user.id;
    
    // Test 3: User Login
    console.log('\n3️⃣ Testing User Login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    
    // Test 4: Get User Profile
    console.log('\n4️⃣ Testing Get User Profile...');
    const profileResponse = await axios.get(`${baseURL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    console.log('✅ Profile retrieved:', profileResponse.data.data.email);
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testBackend();
