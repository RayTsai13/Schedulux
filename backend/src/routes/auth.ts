import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
const jwt = require('jsonwebtoken');

// Import our business logic and types
import { UserService } from '../services/UserService';
import { CreateUserRequest, LoginRequest, ApiResponse, ValidationError } from '../types';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

// ============================================================================
// ROUTER SETUP
// ============================================================================
// Express Router allows us to create modular, mountable route handlers
// This keeps our main app.ts file clean and organizes routes by feature

const router = Router();

// ============================================================================
// MIDDLEWARE: INPUT VALIDATION
// ============================================================================
// express-validator provides middleware for validating and sanitizing inputs
// This prevents malformed data from reaching our business logic

/**
 * Registration Validation Middleware
 * 
 * This middleware runs BEFORE the registration route handler
 * It validates all required fields and applies security rules
 * If validation fails, it returns errors before hitting business logic
 * 
 * 🔍 VALIDATION PATTERNS:
 * - isEmail(): Ensures proper email format
 * - isLength(): Enforces minimum/maximum constraints
 * - matches(): Uses regex for complex validation (phone numbers)
 * - isIn(): Validates against allowed values (enums)
 * - normalizeEmail(): Standardizes email format (lowercase, etc.)
 * - trim(): Removes whitespace
 * 
 * 🛡️ SECURITY BENEFITS:
 * - Prevents malformed data from reaching database
 * - Standardizes input format for consistency
 * - Provides clear, user-friendly error messages
 * - Reduces database load by catching errors early
 */
const validateRegistration = [
  // Email validation and normalization
  body('email')
    .isEmail()                    // Must be valid email format
    .normalizeEmail()             // Convert to lowercase, remove dots in Gmail, etc.
    .withMessage('Please provide a valid email address'),
  
  // Password strength validation
  body('password')
    .isLength({ min: 8, max: 128 })  // Reasonable length limits
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  // Name validation (required, trimmed, reasonable length)
  body('first_name')
    .trim()                       // Remove leading/trailing whitespace
    .isLength({ min: 1, max: 50 })  // Ensure not empty, reasonable max
    .withMessage('First name is required and must be less than 50 characters'),
  
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  
  // Phone validation (optional, but if provided must be valid)
  body('phone')
    .optional()                   // Field is not required
    .matches(/^\+?[1-9]\d{1,14}$/)  // International phone format
    .withMessage('Phone number must be in valid international format'),
  
  // Role validation (must be one of allowed values)
  body('role')
    .isIn(['vendor', 'client'])   // Only these roles allowed for registration
    .withMessage('Role must be either vendor or client'),
  
  // Timezone validation (optional, but if provided must be valid)
  body('timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be a valid timezone string')
];

/**
 * Login Validation Middleware
 * 
 * Simpler validation for login - just email and password format
 * We don't need complex validation since we're just checking credentials
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()                   // Just ensure password is provided
    .withMessage('Password is required')
];

// ============================================================================
// MIDDLEWARE: VALIDATION ERROR HANDLER
// ============================================================================
/**
 * Validation Error Handling Middleware
 * 
 * This middleware runs after validation middleware to check for errors
 * If validation errors exist, it formats them and returns early
 * If no errors, it calls next() to continue to the route handler
 * 
 * 🎯 WHY THIS PATTERN:
 * - Separates validation logic from business logic
 * - Provides consistent error format across all endpoints
 * - Prevents invalid data from reaching business layer
 * - Makes route handlers cleaner and more focused
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  // Extract validation errors from request
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors into user-friendly messages
    const errorMessages: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));
    
    // Return standardized error response
    const response: ApiResponse<ValidationError[]> = {
      success: false,
      data: errorMessages,
      error: 'Validation failed',
      message: 'Please check your input and try again'
    };
    
    // 400 = Bad Request (client error due to invalid input)
    return res.status(400).json(response);
  }
  
  // No validation errors, continue to next middleware/route handler
  next();
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * JWT Token Generation
 * 
 * Creates a JSON Web Token for authenticated sessions
 * Tokens contain user ID and role for authorization
 * 
 * 🔐 SECURITY CONSIDERATIONS:
 * - Use strong secret key (should be in environment variables)
 * - Set appropriate expiration time (24 hours)
 * - Include minimal necessary data in payload
 * - Consider using refresh tokens for longer sessions
 */
const generateToken = (userId: number, role: string): string => {
  // Get JWT secret from environment variables
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
  
  // Create token payload (data encoded in the token)
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000), // Issued at time
  };
  
  // Sign the token with expiration
  return jwt.sign(payload, secret, { 
    expiresIn: '24h',           // Token expires in 24 hours
    issuer: 'schedulux-api',    // Who issued this token
    audience: 'schedulux-app'   // Who the token is intended for
  });
};

/**
 * Remove Password Hash from User Object
 * 
 * Security function to ensure password hashes never leave the server
 * Returns a clean user object safe for API responses
 */
const sanitizeUserResponse = (user: any) => {
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/auth/register - User Registration
 * 
 * This endpoint demonstrates a complete Express.js route handler with:
 * - Input validation (via middleware)
 * - Business logic integration (UserService)
 * - Error handling (try/catch)
 * - Proper HTTP status codes
 * - Consistent response format
 * - Security best practices
 * 
 * 🔄 REQUEST FLOW:
 * 1. Validation middleware checks input format
 * 2. handleValidationErrors middleware processes validation results
 * 3. Route handler processes business logic
 * 4. Response sent back to client
 * 
 * 📝 RESPONSE FORMATS:
 * - 201 Created: User successfully registered
 * - 400 Bad Request: Validation errors or duplicate email
 * - 500 Internal Server Error: Unexpected server error
 */
router.post('/register', 
  validateRegistration,           // Step 1: Validate input format
  handleValidationErrors,         // Step 2: Handle validation errors
  async (req: Request, res: Response, next: NextFunction) => {  // Step 3: Route handler
    try {
      // Extract validated data from request body
      const userData: CreateUserRequest = req.body;
      
      // Call business logic layer to create user
      // UserService handles password hashing, duplicate checking, etc.
      const newUser = await UserService.register(userData);
      
      // Generate authentication token for immediate login
      const token = generateToken(newUser.id, newUser.role);
      
      // Create safe user object (without password hash)
      const safeUser = sanitizeUserResponse(newUser);
      
      // Return success response with user data and token
      const response: ApiResponse<{ user: any; token: string }> = {
        success: true,
        data: {
          user: safeUser,
          token
        },
        message: 'User registered successfully'
      };
      
      // 201 Created = Resource was successfully created
      res.status(201).json(response);
      
    } catch (error: any) {
      // Handle business logic errors (duplicate email, etc.)
      if (error.message.includes('already exists')) {
        // 409 Conflict = Request conflicts with current state (duplicate)
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email already registered',
          message: 'An account with this email address already exists'
        };
        return res.status(409).json(response);
      }
      
      if (error.message.includes('Password validation failed')) {
        // 400 Bad Request = Client sent invalid data
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid password',
          message: error.message
        };
        return res.status(400).json(response);
      }
      
      // Unexpected errors get passed to Express error middleware
      // This ensures consistent error handling across the application
      next(error);
    }
  }
);

/**
 * POST /api/auth/login - User Authentication
 * 
 * This endpoint demonstrates user authentication patterns:
 * - Credential validation
 * - Service layer integration
 * - JWT token generation
 * - Security considerations (no user enumeration)
 * 
 * 🔒 SECURITY FEATURES:
 * - Returns same error for invalid email vs invalid password
 * - Uses constant-time password comparison
 * - Generates fresh token on each login
 * - Sanitizes user data in response
 * 
 * 📝 RESPONSE FORMATS:
 * - 200 OK: Login successful
 * - 401 Unauthorized: Invalid credentials
 * - 400 Bad Request: Validation errors
 */
router.post('/login',
  validateLogin,                  // Step 1: Basic input validation
  handleValidationErrors,         // Step 2: Handle validation errors
  async (req: Request, res: Response, next: NextFunction) => {  // Step 3: Authentication
    try {
      // Extract credentials from request
      const loginData: LoginRequest = req.body;
      
      // Attempt authentication via service layer
      // Returns user object if successful, null if failed
      const user = await UserService.login(loginData);
      
      if (!user) {
        // Authentication failed - return generic error
        // Don't specify whether email or password was wrong (security)
        const response: ApiResponse<null> = {
          success: false,
          error: 'Authentication failed',
          message: 'Invalid email or password'
        };
        // 401 Unauthorized = Authentication required/failed
        return res.status(401).json(response);
      }
      
      // Authentication successful
      const token = generateToken(user.id, user.role);
      const safeUser = sanitizeUserResponse(user);
      
      const response: ApiResponse<{ user: any; token: string }> = {
        success: true,
        data: {
          user: safeUser,
          token
        },
        message: 'Login successful'
      };
      
      // 200 OK = Request succeeded
      res.status(200).json(response);
      
    } catch (error) {
      // Pass unexpected errors to Express error middleware
      next(error);
    }
  }
);

/**
 * GET /api/auth/me - Get Current User Profile
 * 
 * This endpoint demonstrates:
 * - Protected route patterns (requires authentication)
 * - JWT token verification
 * - User profile retrieval
 * 
 * Note: This route would typically require authentication middleware
 * For this example, we'll show how it would work with a token
 */
router.get('/me', 
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // User is already authenticated by middleware, user info is in req.user
      const user = await UserService.getById(req.user!.userId);
      
      const safeUser = sanitizeUserResponse(user);
      const response: ApiResponse<any> = {
        success: true,
        data: safeUser,
        message: 'User profile retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// EXPORT ROUTER
// ============================================================================
// Export the router so it can be mounted in the main app
// This will be used in index.ts as: app.use('/api/auth', authRoutes);

export default router;

/**
 * 🎓 EXPRESS.JS LEARNING SUMMARY
 * 
 * This file demonstrates key Express.js patterns you should understand:
 * 
 * 1. ROUTING PATTERNS:
 *    - Router() for modular route organization
 *    - Route methods (get, post, put, delete)
 *    - Route parameters and request body handling
 * 
 * 2. MIDDLEWARE PATTERNS:
 *    - Validation middleware with express-validator
 *    - Error handling middleware
 *    - Authentication middleware (demonstrated concept)
 *    - Middleware execution order and next() function
 * 
 * 3. REQUEST/RESPONSE PATTERNS:
 *    - Request object (req.body, req.headers, req.params)
 *    - Response object (res.status(), res.json())
 *    - HTTP status codes and when to use them
 * 
 * 4. ERROR HANDLING PATTERNS:
 *    - Try/catch blocks in async route handlers
 *    - Validation error handling
 *    - Business logic error handling
 *    - Express error middleware integration
 * 
 * 5. SECURITY PATTERNS:
 *    - Input validation and sanitization
 *    - Password security (hashing, not storing plain text)
 *    - JWT token generation and verification
 *    - Response sanitization (removing sensitive data)
 * 
 * 6. API DESIGN PATTERNS:
 *    - Consistent response format
 *    - Proper HTTP status codes
 *    - RESTful endpoint design
 *    - Clear error messages
 * 
 * 🚀 NEXT STEPS FOR LEARNING:
 * - Create similar routes for other resources (storefronts, appointments)
 * - Add authentication middleware for protected routes
 * - Implement rate limiting for security
 * - Add API documentation with Swagger
 * - Create unit tests for route handlers
 * - Add logging and monitoring
 */
