// Import PostgreSQL client library types and classes
// Pool manages multiple database connections efficiently
// PoolConfig provides TypeScript interface for configuration options
// PoolClient is used for transactions that require multiple queries on the same connection
import { Pool, PoolConfig, PoolClient } from 'pg';
// Import environment variable loader for secure configuration management
const dotenv = require('dotenv');

/**
 * Database Configuration Module
 * 
 * This module implements PostgreSQL database connectivity using connection pooling,
 * which is essential for production applications because:
 * 
 * Connection Pooling Benefits:
 * - Reuses existing connections instead of creating new ones for each query
 * - Prevents connection exhaustion under high load
 * - Reduces latency (connection setup is expensive)
 * - Manages connection lifecycle automatically
 * - Provides connection timeout and retry mechanisms
 * 
 * Security Features:
 * - Loads sensitive credentials from environment variables
 * - Never hardcodes database passwords in source code
 * - Uses parameterized queries to prevent SQL injection
 * 
 * Production Considerations:
 * - Connection pool limits prevent database overload
 * - Automatic connection cleanup prevents memory leaks
 * - Error handling and graceful shutdown procedures
 * - Query performance monitoring and logging
 */

// Load environment variables from .env file into process.env
// This must be called before accessing any process.env variables
// In production, these would typically be set by the deployment environment
dotenv.config();

/**
 * PostgreSQL Database Connection Configuration
 * 
 * This configuration object defines how our application connects to PostgreSQL.
 * It uses environment variables for security and flexibility across different
 * deployment environments (development, staging, production).
 * 
 * Environment Variable Strategy:
 * - DB_HOST: Database server hostname (localhost for development)
 * - DB_PORT: PostgreSQL port (default 5432)
 * - DB_NAME: Database name (schedulux_primary)
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password (should be set in .env file)
 * 
 * Connection Pool Configuration:
 * - max: Maximum concurrent connections (20 is good for small-medium apps)
 * - idleTimeoutMillis: How long to keep unused connections (30 seconds)
 * - connectionTimeoutMillis: How long to wait for new connections (2 seconds)
 * 
 * These settings balance performance with resource usage and prevent
 * overwhelming the database server.
 */
const dbConfig: PoolConfig = {
  // Database server connection details
  host: process.env.DB_HOST || 'localhost',           // Database server hostname
  port: parseInt(process.env.DB_PORT || '5432'),      // PostgreSQL default port
  database: process.env.DB_NAME || 'scheduling_app_primary',  // Database name
  user: process.env.DB_USER || 'raymondtsai',         // Database username
  password: process.env.DB_PASSWORD || '',            // Database password (should be in .env)
  
  // Connection pool optimization settings
  max: 20,                    // Maximum number of clients in the pool
                             // Higher = more concurrent queries, but more memory usage
                             // 20 is typically sufficient for small-medium applications
  
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
                             // Prevents accumulation of unused connections
                             // Balances connection reuse with resource cleanup
  
  connectionTimeoutMillis: 2000,  // Return error after 2 seconds if connection fails
                                  // Prevents requests from hanging indefinitely
                                  // Fast failure allows for proper error handling
};

/**
 * PostgreSQL Connection Pool Instance
 * 
 * This pool manages database connections for the entire application.
 * Instead of creating a new connection for each query (expensive and slow),
 * the pool maintains a set of reusable connections.
 * 
 * How Connection Pooling Works:
 * 1. Pool pre-creates connections when the app starts
 * 2. When a query needs to run, it borrows a connection from the pool
 * 3. After the query completes, the connection returns to the pool
 * 4. Idle connections are cleaned up automatically
 * 
 * Benefits:
 * - Much faster than creating new connections
 * - Prevents connection exhaustion under load
 * - Automatically handles connection failures and retries
 * - Provides monitoring and metrics
 * 
 * This pool instance is shared across all models and services in the application.
 */
export const pool = new Pool(dbConfig);

/**
 * Database Connection Event Handlers
 * 
 * These event listeners monitor the health of our database connection pool
 * and provide feedback about connectivity status.
 */

/**
 * Connection Success Handler
 * 
 * This event fires every time a new connection is successfully established
 * to the PostgreSQL database. It provides confirmation that:
 * - Database server is reachable
 * - Credentials are correct
 * - Network connectivity is working
 * - Database is accepting connections
 * 
 * In production, you might want to reduce this logging or send it to
 * a monitoring system instead of console output.
 */
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

/**
 * Connection Error Handler
 * 
 * This event fires when the connection pool encounters an error.
 * Common causes include:
 * - Database server is down
 * - Wrong connection credentials
 * - Network connectivity issues
 * - Database is at connection limit
 * - Firewall blocking connection
 * 
 * The process.exit(-1) ensures the application stops completely rather
 * than continuing in a broken state without database access.
 * In production, you might want more sophisticated error handling.
 */
pool.on('error', (err: Error) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);  // Exit with error code to signal failure to process manager
});

/**
 * Database Query Helper Function
 * 
 * @param text - The SQL query string with optional parameter placeholders ($1, $2, etc.)
 * @param params - Array of values to substitute for placeholders (optional)
 * @returns Promise<QueryResult> - PostgreSQL query result object
 * 
 * This helper function provides a standardized way to execute database queries
 * throughout the application. It adds several important features on top of
 * the basic pool.query() method:
 * 
 * Performance Monitoring:
 * - Measures query execution time for performance analysis
 * - Logs query details for debugging and optimization
 * - Tracks row counts for result validation
 * 
 * Security Features:
 * - Supports parameterized queries to prevent SQL injection
 * - Automatically escapes parameter values
 * - Separates SQL structure from data values
 * 
 * Usage Examples:
 * 
 * Simple query (no parameters):
 * const result = await query('SELECT * FROM users');
 * 
 * Parameterized query (safe from SQL injection):
 * const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
 * 
 * Complex query with multiple parameters:
 * const result = await query(
 *   'UPDATE users SET name = $1, email = $2 WHERE id = $3',
 *   [name, email, userId]
 * );
 * 
 * The function is used by all repository classes (UserModel, StorefrontModel)
 * to maintain consistent database access patterns across the application.
 */
export async function query(text: string, params?: any[]) {
  // Record start time for performance measurement
  const start = Date.now();
  
  // Execute the query using the connection pool
  // The pool automatically handles connection assignment and cleanup
  const res = await pool.query(text, params);
  
  // Calculate execution time for performance monitoring
  const duration = Date.now() - start;
  
  // Log query details for debugging and performance analysis
  // In production, you might want to:
  // - Only log slow queries (duration > threshold)
  // - Send metrics to monitoring system instead of console
  // - Sanitize logged query text to remove sensitive data
  console.log('🔍 Executed query', { 
    text,              // The SQL query that was executed
    duration,          // How long it took in milliseconds
    rows: res.rowCount // Number of rows affected/returned
  });
  
  // Return the complete PostgreSQL result object
  // This includes .rows (data), .rowCount (affected rows), .fields (metadata)
  return res;
}

/**
 * Get a client from the connection pool for manual transaction management
 *
 * Use this when you need to run multiple queries in a single transaction
 * or need advisory locks for concurrency control.
 *
 * IMPORTANT: Always release the client back to the pool when done!
 * Use try/finally pattern or withTransaction() helper instead.
 *
 * @returns Promise<PoolClient> - A client checked out from the pool
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * Execute a function within a database transaction
 *
 * This helper handles the transaction lifecycle:
 * 1. Acquires a client from the pool
 * 2. Begins a transaction
 * 3. Executes your function with the client
 * 4. Commits on success, rolls back on error
 * 5. Always releases the client back to the pool
 *
 * Usage:
 * const result = await withTransaction(async (client) => {
 *   await client.query('INSERT INTO ...', [...]);
 *   await client.query('UPDATE ...', [...]);
 *   return { success: true };
 * });
 *
 * @param fn - Async function that receives a PoolClient and returns a result
 * @returns Promise<T> - The result of the function
 * @throws Rethrows any error after rolling back the transaction
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Graceful Application Shutdown Handler
 * 
 * This process event handler ensures that database connections are properly
 * closed when the application is shutting down. This is critical for:
 * 
 * Resource Cleanup:
 * - Prevents hanging connections in PostgreSQL
 * - Releases memory and file descriptors
 * - Ensures clean application termination
 * 
 * Production Deployment:
 * - Allows process managers (PM2, Docker, Kubernetes) to restart cleanly
 * - Prevents connection leaks during deployments
 * - Maintains database connection limits under control
 * 
 * Signal Handling:
 * - SIGINT: Interrupt signal (Ctrl+C during development)
 * - SIGTERM: Termination signal (sent by process managers)
 * - Graceful shutdown: Application finishes current operations before stopping
 * 
 * The shutdown process:
 * 1. Receive shutdown signal
 * 2. Stop accepting new database queries
 * 3. Wait for pending queries to complete
 * 4. Close all pool connections
 * 5. Exit process cleanly
 * 
 * This prevents the "connection terminated unexpectedly" errors that can
 * occur when applications are forcefully killed.
 */
process.on('SIGINT', () => {
  console.log('🔄 Closing database connections...');
  
  // pool.end() gracefully closes all connections in the pool
  // It waits for active queries to complete before closing connections
  // Returns a Promise that resolves when all connections are closed
  pool.end().then(() => {
    console.log('✅ Database connections closed');
    process.exit(0);  // Exit with success code (0 = no errors)
  });
});