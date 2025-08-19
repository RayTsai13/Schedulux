import { UserModel } from '../models/User';
import { User, CreateUserRequest, LoginRequest } from '../types';
import { hashPassword, verifyPassword, validatePassword } from '../utils/auth';

/**
 * User Service - Handles business logic for user operations
 */
export class UserService {
  /**
   * Register a new user
   */
  static async register(userData: CreateUserRequest): Promise<User> {
    // 1. Validate password strength
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // 2. Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 3. Hash password (business logic)
    const password_hash = await hashPassword(userData.password);

    // 4. Create user with hashed password
    const userToCreate = {
      ...userData,
      password_hash
    };
    
    // Pass all required fields including password and password_hash to data layer
    return await UserModel.create(userToCreate);
  }

  /**
   * Authenticate user login
   */
  static async login(loginData: LoginRequest): Promise<User | null> {
    // 1. Find user by email
    const user = await UserModel.findByEmail(loginData.email);
    if (!user) {
      return null; // User not found
    }

    // 2. Verify password
    const isPasswordValid = await verifyPassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    return user;
  }

  /**
   * Get user by ID (with business logic)
   */
  static async getById(id: number): Promise<User | null> {
    const user = await UserModel.findById(id);
    
    // Business rule: don't return inactive users
    if (user && !user.is_active) {
      return null;
    }
    
    return user;
  }
}
