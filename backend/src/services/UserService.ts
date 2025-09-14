// Import the User repository/model for database operations
import { UserModel } from '../models/User';
// Import TypeScript interfaces for type safety and API contracts
import { User, CreateUserRequest, LoginRequest } from '../types';
// Import authentication utilities for password security
import { hashPassword, verifyPassword, validatePassword } from '../utils/auth';

/**
 * UserService - Business Logic Layer for User Operations
 * 
 * This service implements the Service Layer pattern, which:
 * - Encapsulates complex business logic and rules
 * - Coordinates between multiple data sources (UserModel, auth utils)
 * - Validates data before passing to the repository layer
 * - Handles authentication workflows and security concerns
 * - Provides a clean interface for API controllers to use
 * 
 * Key responsibilities:
 * - User registration with password validation and duplicate checking
 * - User authentication with secure password verification
 * - Business rule enforcement (e.g., inactive user handling)
 * - Data transformation between API contracts and database models
 * 
 * This layer sits between the API routes and the data models, ensuring
 * business logic is separated from both presentation and data access concerns.
 */
export class UserService {
  
  /**
   * Register a new user with comprehensive validation and security
   * 
   * @param userData - User registration data including plain text password
   * @returns Promise<User> - The newly created user object (without password_hash)
   * 
   * This method implements the complete user registration workflow:
   * 1. Password strength validation using business rules
   * 2. Email uniqueness verification to prevent duplicates
   * 3. Secure password hashing using bcrypt
   * 4. User creation through the data access layer
   * 
   * Security measures:
   * - Password validation enforces strong password requirements
   * - Plain text passwords are never stored (hashed immediately)
   * - Email uniqueness prevents account conflicts
   * - Input validation prevents malformed data from reaching database
   * 
   * Error handling:
   * - Throws descriptive errors for password validation failures
   * - Throws specific error for duplicate email addresses
   * - Database errors bubble up from UserModel layer
   * 
   * Example usage:
   * try {
   *   const user = await UserService.register({
   *     email: 'john@example.com',
   *     password: 'SecurePass123!',
   *     first_name: 'John',
   *     last_name: 'Doe',
   *     role: 'customer'
   *   });
   *   console.log('User created:', user.id);
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   */
  static async register(userData: CreateUserRequest): Promise<User> {
    // 1. Validate password strength using business rules
    // This ensures passwords meet security requirements before processing
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // 2. Check if user already exists to prevent duplicate accounts
    // Email should be unique across the system for authentication
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 3. Hash password using bcrypt for secure storage
    // Plain text passwords are never stored in the database
    const password_hash = await hashPassword(userData.password);

    // 4. Create user record with hashed password
    // Spread operator (...) copies all properties from userData
    // Then we add the password_hash field for database storage
    const userToCreate = {
      ...userData,
      password_hash
    };
    
    // Pass the complete user data to the repository layer for database insertion
    return await UserModel.create(userToCreate);
  }

  /**
   * Authenticate user login credentials
   * 
   * @param loginData - Login credentials containing email and password
   * @returns Promise<User | null> - User object if authentication succeeds, null if it fails
   * 
   * This method implements secure user authentication:
   * 1. User lookup by email address
   * 2. Password verification using bcrypt comparison
   * 3. Returns user data for successful authentication
   * 
   * Security considerations:
   * - Uses constant-time password comparison to prevent timing attacks
   * - Returns null for both "user not found" and "wrong password" to prevent user enumeration
   * - Does not distinguish between invalid email vs invalid password in response
   * - Plain text passwords are never logged or stored
   * 
   * Authentication flow:
   * - Client sends email/password
   * - Service looks up user by email
   * - If user exists, verify password against stored hash
   * - Return user object on success, null on any failure
   * 
   * Usage in API endpoints:
   * const user = await UserService.login({ email, password });
   * if (user) {
   *   // Generate JWT token
   *   // Set authentication cookies
   *   // Return success response
   * } else {
   *   // Return 401 Unauthorized
   * }
   */
  static async login(loginData: LoginRequest): Promise<User | null> {
    // 1. Find user by email address in the database
    // This is the primary lookup for authentication
    const user = await UserModel.findByEmail(loginData.email);
    if (!user) {
      return null; // User not found - return null to prevent user enumeration
    }

    // 2. Verify the provided password against the stored hash
    // Uses bcrypt.compare() for secure, constant-time comparison
    const isPasswordValid = await verifyPassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      return null; // Invalid password - return null for security
    }

    // Authentication successful - return the user object
    return user;
  }

  /**
   * Retrieve user by ID with business rule enforcement
   * 
   * @param id - The unique identifier of the user to retrieve
   * @returns Promise<User | null> - User object if found and active, null otherwise
   * 
   * This method adds business logic on top of the basic database lookup:
   * - Fetches user data from the repository layer
   * - Enforces business rule: inactive users are treated as not found
   * - Provides a clean interface for API endpoints that need user data
   * 
   * Business rules implemented:
   * - Only active users (is_active = true) are returned
   * - Inactive users are treated as if they don't exist
   * - Soft-deleted users are already filtered out by the repository layer
   * 
   * This separation allows:
   * - Database layer handles data retrieval and soft deletion
   * - Service layer handles business rules like user status
   * - API layer gets clean, business-rule-compliant data
   * 
   * Usage scenarios:
   * - JWT middleware validating user tokens
   * - Profile retrieval endpoints
   * - Admin panels displaying user information
   * - Authorization checks for protected resources
   * 
   * Example usage:
   * const user = await UserService.getById(123);
   * if (user) {
   *   // User exists and is active
   *   return user.profile;
   * } else {
   *   // User not found or inactive
   *   return 404;
   * }
   */
  static async getById(id: number): Promise<User | null> {
    // Fetch user from database using repository pattern
    const user = await UserModel.findById(id);
    
    // Business rule: don't return inactive users to the application layer
    // This enforces that inactive users are treated as non-existent
    if (user && !user.is_active) {
      return null;
    }
    
    // Return user if found and active, null if not found or inactive
    return user;
  }
}
