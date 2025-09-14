/**
 * API Testing Script for Authentication Endpoints
 * 
 * This script demonstrates how to use the authentication API we just created.
 * It's a practical example of making HTTP requests to test our Express.js endpoints.
 * 
 * 🎯 LEARNING OBJECTIVES:
 * 1. How to make HTTP requests to API endpoints
 * 2. Understanding request/response patterns
 * 3. Testing authentication workflows
 * 4. Handling API responses and errors
 * 5. Working with JWT tokens
 * 
 * 📋 TEST SCENARIOS:
 * 1. Health check - verify server is running
 * 2. User registration - create a new account
 * 3. User login - authenticate with credentials
 * 4. Protected route - access profile with token
 * 5. Error handling - test validation and authentication errors
 */

async function testAuthenticationAPI() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Testing Schedulux Authentication API');
  console.log('=' .repeat(50));
  
  // Test data for our API calls
  const testUser = {
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    role: 'client' as const,
    timezone: 'America/New_York'
  };
  
  let authToken = '';
  
  try {
    // ========================================================================
    // TEST 1: Health Check
    // ========================================================================
    console.log('\n1️⃣ Testing Health Check Endpoint');
    console.log('GET /health');
    
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    
    console.log(`Status: ${healthResponse.status}`);
    console.log(`Response:`, JSON.stringify(healthData, null, 2));
    
    if (healthData.success) {
      console.log('✅ Health check passed - server and database are working');
    } else {
      console.log('❌ Health check failed');
      return;
    }
    
    // ========================================================================
    // TEST 2: User Registration
    // ========================================================================
    console.log('\n2️⃣ Testing User Registration');
    console.log('POST /api/auth/register');
    console.log('Request body:', JSON.stringify(testUser, null, 2));
    
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    
    console.log(`Status: ${registerResponse.status}`);
    console.log(`Response:`, JSON.stringify(registerData, null, 2));
    
    if (registerData.success) {
      console.log('✅ User registration successful');
      authToken = registerData.data.token;
      console.log(`🔑 Auth token received: ${authToken.substring(0, 20)}...`);
    } else if (registerResponse.status === 409) {
      console.log('⚠️ User already exists - this is expected if you run the test multiple times');
      
      // If user already exists, try to login instead
      console.log('\n🔄 Attempting login with existing user...');
      
      const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        console.log('✅ Login successful with existing user');
        authToken = loginData.data.token;
      } else {
        console.log('❌ Both registration and login failed');
        return;
      }
    } else {
      console.log(`❌ Registration failed: ${registerData.error}`);
      return;
    }
    
    // ========================================================================
    // TEST 3: User Login (with fresh credentials)
    // ========================================================================
    console.log('\n3️⃣ Testing User Login');
    console.log('POST /api/auth/login');
    
    const loginRequest = {
      email: testUser.email,
      password: testUser.password
    };
    
    console.log('Request body:', JSON.stringify(loginRequest, null, 2));
    
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginRequest)
    });
    
    const loginData = await loginResponse.json();
    
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Response:`, JSON.stringify(loginData, null, 2));
    
    if (loginData.success) {
      console.log('✅ Login successful');
      authToken = loginData.data.token; // Use fresh token
    } else {
      console.log('❌ Login failed');
    }
    
    // ========================================================================
    // TEST 4: Protected Route - Get User Profile
    // ========================================================================
    console.log('\n4️⃣ Testing Protected Route (Get Profile)');
    console.log('GET /api/auth/me');
    console.log(`Authorization: Bearer ${authToken.substring(0, 20)}...`);
    
    if (authToken) {
      const profileResponse = await fetch(`${baseURL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      const profileData = await profileResponse.json();
      
      console.log(`Status: ${profileResponse.status}`);
      console.log(`Response:`, JSON.stringify(profileData, null, 2));
      
      if (profileData.success) {
        console.log('✅ Profile retrieved successfully');
      } else {
        console.log('❌ Failed to retrieve profile');
      }
    } else {
      console.log('⚠️ Skipping profile test - no auth token available');
    }
    
    // ========================================================================
    // TEST 5: Validation Error Testing
    // ========================================================================
    console.log('\n5️⃣ Testing Validation Errors');
    console.log('POST /api/auth/register (with invalid data)');
    
    const invalidUser = {
      email: 'not-an-email',       // Invalid email format
      password: '123',             // Too short password
      first_name: '',              // Empty name
      role: 'invalid-role'         // Invalid role
    };
    
    console.log('Request body:', JSON.stringify(invalidUser, null, 2));
    
    const validationResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidUser)
    });
    
    const validationData = await validationResponse.json();
    
    console.log(`Status: ${validationResponse.status}`);
    console.log(`Response:`, JSON.stringify(validationData, null, 2));
    
    if (validationResponse.status === 400) {
      console.log('✅ Validation errors properly handled');
    } else {
      console.log('❌ Validation did not work as expected');
    }
    
    // ========================================================================
    // TEST 6: Authentication Error Testing
    // ========================================================================
    console.log('\n6️⃣ Testing Authentication Errors');
    console.log('POST /api/auth/login (with wrong password)');
    
    const wrongCredentials = {
      email: testUser.email,
      password: 'WrongPassword123!'
    };
    
    console.log('Request body:', JSON.stringify(wrongCredentials, null, 2));
    
    const authErrorResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wrongCredentials)
    });
    
    const authErrorData = await authErrorResponse.json();
    
    console.log(`Status: ${authErrorResponse.status}`);
    console.log(`Response:`, JSON.stringify(authErrorData, null, 2));
    
    if (authErrorResponse.status === 401) {
      console.log('✅ Authentication errors properly handled');
    } else {
      console.log('❌ Authentication error handling did not work as expected');
    }
    
    // ========================================================================
    // TEST 7: Protected Route Without Token
    // ========================================================================
    console.log('\n7️⃣ Testing Protected Route Without Token');
    console.log('GET /api/auth/me (no Authorization header)');
    
    const noTokenResponse = await fetch(`${baseURL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const noTokenData = await noTokenResponse.json();
    
    console.log(`Status: ${noTokenResponse.status}`);
    console.log(`Response:`, JSON.stringify(noTokenData, null, 2));
    
    if (noTokenResponse.status === 401) {
      console.log('✅ Protected route properly requires authentication');
    } else {
      console.log('❌ Protected route should require authentication');
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n🎉 API Testing Complete!');
    console.log('=' .repeat(50));
    console.log('\n📚 What you just learned:');
    console.log('1. ✅ Health check endpoints for monitoring');
    console.log('2. ✅ User registration with validation');
    console.log('3. ✅ User authentication with JWT tokens');
    console.log('4. ✅ Protected routes requiring authentication');
    console.log('5. ✅ Proper error handling and status codes');
    console.log('6. ✅ Input validation and error responses');
    console.log('7. ✅ Security patterns for authentication');
    
    console.log('\n🔧 Express.js patterns demonstrated:');
    console.log('• Router-based route organization');
    console.log('• Middleware for validation and error handling');
    console.log('• Consistent API response formats');
    console.log('• Proper HTTP status codes');
    console.log('• JWT token generation and verification');
    console.log('• Business logic separation with services');
    console.log('• Repository pattern for data access');
    
    console.log('\n🚀 Next steps for building more APIs:');
    console.log('1. Create similar routes for other resources (storefronts, appointments)');
    console.log('2. Add authentication middleware for all protected routes');
    console.log('3. Implement pagination for list endpoints');
    console.log('4. Add search and filtering capabilities');
    console.log('5. Create relationship endpoints (user\'s appointments, etc.)');
    console.log('6. Add file upload endpoints (user avatars, etc.)');
    console.log('7. Implement real-time features with WebSockets');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
testAuthenticationAPI();

export { testAuthenticationAPI };
