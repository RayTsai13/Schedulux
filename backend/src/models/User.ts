// Import the database query function for executing SQL commands
import { query } from '../config/database';
// Import TypeScript interfaces for type safety and structure
import { User, CreateUserRequest } from '../types';

/**
 * UserModel - Repository Pattern Implementation for User Data Access
 * 
 * This class implements the Repository pattern, which:
 * - Encapsulates database access logic for the users table
 * - Provides a clean interface between business logic and data storage
 * - Uses parameterized queries to prevent SQL injection attacks
 * - Implements soft deletion (marking records as deleted instead of removing them)
 * - Returns strongly typed results using TypeScript interfaces
 * 
 * All methods in this class are static because we don't need to maintain state
 * between operations - each method performs a single database operation.
 */
export class UserModel {
  
  /**
   * Find a user by their unique ID
   * 
   * @param id - The unique identifier of the user to find
   * @returns Promise<User | null> - The user object if found, null if not found or deleted
   * 
   * Security: Uses parameterized query ($1) to prevent SQL injection
   * Soft Delete: Only returns users where deleted_at IS NULL (not deleted)
   * 
   * Example usage:
   * const user = await UserModel.findById(123);
   * if (user) { console.log(user.email); }
   */
  static async findById(id: number): Promise<User | null> {
    // Execute SQL query with parameterized placeholder ($1) for safety
    const result = await query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    
    // PostgreSQL returns results in .rows array
    // [0] gets first result, || null handles case where no results found
    return result.rows[0] || null;
  }

  /**
   * Find a user by their email address (used for login authentication)
   * 
   * @param email - The email address to search for
   * @returns Promise<User | null> - The user object if found, null if not found or deleted
   * 
   * This method is crucial for authentication - it's how we look up users during login
   * Email should be unique in the database (enforced by database constraint)
   * 
   * Example usage:
   * const user = await UserModel.findByEmail('john@example.com');
   * if (user) { // verify password }
   */
  static async findByEmail(email: string): Promise<User | null> {
    // Use parameterized query to safely search by email
    const result = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user in the database
   * 
   * @param userData - User information including hashed password
   * @returns Promise<User> - The newly created user object with generated ID and timestamps
   * 
   * Note: This method expects password_hash, not plain password
   * Password hashing should be done by UserService before calling this method
   * 
   * The & operator combines two TypeScript types:
   * - CreateUserRequest (has email, first_name, etc.)
   * - { password_hash: string } (adds the hashed password field)
   * 
   * Example usage:
   * const hashedPassword = await bcrypt.hash('plainPassword', 10);
   * const user = await UserModel.create({
   *   email: 'john@example.com',
   *   password_hash: hashedPassword,
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   role: 'customer'
   * });
   */
  static async create(userData: CreateUserRequest & { password_hash: string }): Promise<User> {
    // Destructuring assignment extracts specific properties from userData object
    // timezone = 'UTC' provides a default value if not specified
    const {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      timezone = 'UTC'  // Default timezone if not provided
    } = userData;

    // INSERT...RETURNING * gives us back the complete record including auto-generated fields
    // like id, created_at, updated_at that the database creates
    const result = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, timezone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [email, password_hash, first_name, last_name, phone, role, timezone]);

    // Since this is an INSERT, we know there will always be exactly one result
    return result.rows[0];
  }

  /**
   * Find all users with a specific role (e.g., 'admin', 'business_owner', 'customer')
   * 
   * @param role - The role to filter by
   * @returns Promise<User[]> - Array of users with the specified role
   * 
   * Useful for administrative functions like:
   * - Getting all business owners
   * - Finding all customers
   * - Listing administrators
   * 
   * Example usage:
   * const businessOwners = await UserModel.findByRole('business_owner');
   * const admins = await UserModel.findByRole('admin');
   */
  static async findByRole(role: string): Promise<User[]> {
    const result = await query('SELECT * FROM users WHERE role = $1 AND deleted_at IS NULL', [role]);
    // Return the entire rows array since we expect multiple results
    return result.rows;
  }

  /**
   * Update specific fields of an existing user
   * 
   * @param id - The ID of the user to update
   * @param updates - Partial<User> means any subset of User fields can be updated
   * @returns Promise<User | null> - Updated user object, or null if user not found
   * 
   * This method dynamically builds the SQL UPDATE statement based on which fields
   * are provided in the updates object. This is more flexible than having separate
   * methods for updating each field.
   * 
   * Partial<User> is a TypeScript utility type that makes all User properties optional
   * So you can pass { email: 'new@email.com' } or { first_name: 'John', phone: '555-1234' }
   * 
   * Example usage:
   * const updatedUser = await UserModel.update(123, {
   *   first_name: 'John',
   *   phone: '555-1234'
   * });
   */
  static async update(id: number, updates: Partial<User>): Promise<User | null> {
    // Build dynamic SET clause for SQL UPDATE
    // Object.keys(updates) gets array of property names like ['first_name', 'phone']
    // .map creates SQL like 'first_name = $2, phone = $3'
    // index + 2 because $1 is reserved for the id parameter
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    // Build parameter array: [id, value1, value2, ...]
    // id goes first (for $1), then all the update values
    const values = [id, ...Object.values(updates)];
    
    // Execute dynamic UPDATE query
    // RETURNING * gives us back the updated record
    const result = await query(`
      UPDATE users 
      SET ${setClause}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `, values);

    // Return updated user or null if no rows were affected (user not found)
    return result.rows[0] || null;
  }

  /**
   * Soft delete a user (mark as deleted without removing from database)
   * 
   * @param id - The ID of the user to soft delete
   * @returns Promise<boolean> - true if user was deleted, false if user not found
   * 
   * Soft deletion is preferred because:
   * - Preserves data integrity (appointments, references remain valid)
   * - Allows for data recovery if deletion was accidental
   * - Maintains audit trail for business/legal purposes
   * - Prevents cascading deletion issues
   * 
   * The user will no longer appear in normal queries (due to deleted_at IS NULL filters)
   * but the data remains in the database for reference.
   * 
   * Example usage:
   * const wasDeleted = await UserModel.softDelete(123);
   * if (wasDeleted) { console.log('User successfully deleted'); }
   */
  static async softDelete(id: number): Promise<boolean> {
    // Set deleted_at to current timestamp to mark as deleted
    // CURRENT_TIMESTAMP is a PostgreSQL function that gets the current date/time
    const result = await query(`
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `, [id]);

    // If any rows were affected, the deletion was successful
    // RETURNING id ensures we get back the ID only if the update succeeded
    return result.rows.length > 0;
  }
}
