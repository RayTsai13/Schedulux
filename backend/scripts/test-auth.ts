#!/usr/bin/env ts-node

/**
 * Test script for authentication utilities
 * Run with: npx ts-node scripts/test-auth.ts
 */

import { hashPassword, verifyPassword, validatePassword } from '../src/utils/auth';

// Test results tracking
let testsPassed = 0;
let testsFailed = 0;
const failedTests: string[] = [];

// Helper functions
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function pass(testName: string) {
  testsPassed++;
  log(`✅ PASS: ${testName}`, 'success');
}

function fail(testName: string, error: string) {
  testsFailed++;
  failedTests.push(`${testName}: ${error}`);
  log(`❌ FAIL: ${testName}`, 'error');
  log(`   Error: ${error}`, 'error');
}

// Test functions
async function testPasswordHashing() {
  const testName = 'Password Hashing';
  try {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    
    // Check that hash is generated
    if (!hash || hash.length === 0) {
      throw new Error('Hash was not generated');
    }
    
    // Check that hash is different from original password
    if (hash === password) {
      throw new Error('Hash should not equal original password');
    }
    
    // Check that hash starts with bcrypt identifier
    if (!hash.startsWith('$2b$')) {
      throw new Error('Hash should start with $2b$ (bcrypt identifier)');
    }
    
    // Check hash length (bcrypt hashes are 60 characters)
    if (hash.length !== 60) {
      throw new Error(`Hash should be 60 characters, got ${hash.length}`);
    }
    
    log(`   Generated hash: ${hash.substring(0, 20)}...`, 'info');
    pass(testName);
  } catch (error) {
    fail(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testPasswordVerification() {
  const testName = 'Password Verification';
  try {
    const password = 'MySecurePassword456!';
    const hash = await hashPassword(password);
    
    // Test correct password
    const isValidCorrect = await verifyPassword(password, hash);
    if (!isValidCorrect) {
      throw new Error('Correct password should verify as true');
    }
    
    // Test incorrect password
    const isValidIncorrect = await verifyPassword('WrongPassword', hash);
    if (isValidIncorrect) {
      throw new Error('Incorrect password should verify as false');
    }
    
    // Test empty password
    const isValidEmpty = await verifyPassword('', hash);
    if (isValidEmpty) {
      throw new Error('Empty password should verify as false');
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testHashUniqueness() {
  const testName = 'Hash Uniqueness (Salt)';
  try {
    const password = 'SamePassword123!';
    
    // Generate multiple hashes of the same password
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    const hash3 = await hashPassword(password);
    
    // Hashes should be different due to salt
    if (hash1 === hash2 || hash2 === hash3 || hash1 === hash3) {
      throw new Error('Multiple hashes of same password should be different (salt working)');
    }
    
    // But all should verify correctly
    const verify1 = await verifyPassword(password, hash1);
    const verify2 = await verifyPassword(password, hash2);
    const verify3 = await verifyPassword(password, hash3);
    
    if (!verify1 || !verify2 || !verify3) {
      throw new Error('All unique hashes should verify correctly');
    }
    
    log(`   Hash 1: ${hash1.substring(0, 20)}...`, 'info');
    log(`   Hash 2: ${hash2.substring(0, 20)}...`, 'info');
    log(`   Hash 3: ${hash3.substring(0, 20)}...`, 'info');
    
    pass(testName);
  } catch (error) {
    fail(testName, error instanceof Error ? error.message : String(error));
  }
}

function testPasswordValidation() {
  const testName = 'Password Validation';
  try {
    // Test valid password
    const validResult = validatePassword('ValidPass123!');
    if (!validResult.isValid) {
      throw new Error(`Valid password should pass validation. Errors: ${validResult.errors.join(', ')}`);
    }
    
    // Test too short
    const shortResult = validatePassword('Short1!');
    if (shortResult.isValid) {
      throw new Error('Short password should fail validation');
    }
    if (!shortResult.errors.some(err => err.includes('8 characters'))) {
      throw new Error('Should have error about minimum length');
    }
    
    // Test no uppercase
    const noUpperResult = validatePassword('lowercase123!');
    if (noUpperResult.isValid) {
      throw new Error('Password without uppercase should fail');
    }
    if (!noUpperResult.errors.some(err => err.includes('uppercase'))) {
      throw new Error('Should have error about uppercase letter');
    }
    
    // Test no lowercase
    const noLowerResult = validatePassword('UPPERCASE123!');
    if (noLowerResult.isValid) {
      throw new Error('Password without lowercase should fail');
    }
    if (!noLowerResult.errors.some(err => err.includes('lowercase'))) {
      throw new Error('Should have error about lowercase letter');
    }
    
    // Test no number
    const noNumberResult = validatePassword('NoNumbers!');
    if (noNumberResult.isValid) {
      throw new Error('Password without numbers should fail');
    }
    if (!noNumberResult.errors.some(err => err.includes('number'))) {
      throw new Error('Should have error about number');
    }
    
    // Test no special character
    const noSpecialResult = validatePassword('NoSpecial123');
    if (noSpecialResult.isValid) {
      throw new Error('Password without special characters should fail');
    }
    if (!noSpecialResult.errors.some(err => err.includes('special character'))) {
      throw new Error('Should have error about special character');
    }
    
    // Test too long
    const tooLongPassword = 'A'.repeat(130) + '1!';
    const tooLongResult = validatePassword(tooLongPassword);
    if (tooLongResult.isValid) {
      throw new Error('Password over 128 characters should fail');
    }
    if (!tooLongResult.errors.some(err => err.includes('128 characters'))) {
      throw new Error('Should have error about maximum length');
    }
    
    log(`   Valid password passed: ${validResult.errors.length} errors`, 'info');
    log(`   Invalid password failed: ${shortResult.errors.length} errors`, 'info');
    
    pass(testName);
  } catch (error) {
    fail(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testPerformance() {
  const testName = 'Performance Test';
  try {
    const password = 'PerformanceTest123!';
    
    // Test hashing time
    const hashStart = Date.now();
    const hash = await hashPassword(password);
    const hashDuration = Date.now() - hashStart;
    
    // Test verification time
    const verifyStart = Date.now();
    await verifyPassword(password, hash);
    const verifyDuration = Date.now() - verifyStart;
    
    log(`   Hash time: ${hashDuration}ms`, 'info');
    log(`   Verify time: ${verifyDuration}ms`, 'info');
    
    // Reasonable performance expectations
    if (hashDuration > 5000) { // 5 seconds seems excessive
      throw new Error(`Hashing took too long: ${hashDuration}ms`);
    }
    
    if (verifyDuration > 5000) {
      throw new Error(`Verification took too long: ${verifyDuration}ms`);
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error instanceof Error ? error.message : String(error));
  }
}

async function testEdgeCases() {
  const testName = 'Edge Cases';
  try {
    // Test with special characters
    const specialPassword = '!@#$%^&*()_+{}[]|";:<>?,./`~';
    const specialHash = await hashPassword(specialPassword);
    const specialVerify = await verifyPassword(specialPassword, specialHash);
    if (!specialVerify) {
      throw new Error('Password with special characters should work');
    }
    
    // Test with unicode characters
    const unicodePassword = 'Pässwörd123!🔒';
    const unicodeHash = await hashPassword(unicodePassword);
    const unicodeVerify = await verifyPassword(unicodePassword, unicodeHash);
    if (!unicodeVerify) {
      throw new Error('Password with unicode characters should work');
    }
    
    // Test minimum valid password
    const minPassword = 'Aa1!bcde';
    const minValidation = validatePassword(minPassword);
    if (!minValidation.isValid) {
      throw new Error(`Minimum valid password should pass: ${minValidation.errors.join(', ')}`);
    }
    
    pass(testName);
  } catch (error) {
    fail(testName, error instanceof Error ? error.message : String(error));
  }
}

// Main test runner
async function runTests() {
  log('🔐 Starting Authentication Utility Tests...', 'info');
  log('=' .repeat(50), 'info');
  
  const tests = [
    testPasswordHashing,
    testPasswordVerification,
    testHashUniqueness,
    testPasswordValidation,
    testPerformance,
    testEdgeCases
  ];
  
  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      log(`Unexpected error in ${test.name}: ${error}`, 'error');
    }
  }
  
  // Summary
  log('=' .repeat(50), 'info');
  log(`📊 Test Results:`, 'info');
  log(`   ✅ Passed: ${testsPassed}`, 'success');
  log(`   ❌ Failed: ${testsFailed}`, 'error');
  
  if (failedTests.length > 0) {
    log('\n📝 Failed Tests:', 'warning');
    failedTests.forEach((failure, index) => {
      log(`   ${index + 1}. ${failure}`, 'error');
    });
  }
  
  if (testsFailed === 0) {
    log('\n🎉 All authentication tests passed! Your auth utilities are working correctly.', 'success');
  } else {
    log(`\n⚠️  ${testsFailed} test(s) failed. Check your authentication setup.`, 'warning');
  }
  
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

export { runTests };
