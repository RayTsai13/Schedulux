import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scheduling_app_primary',
  user: process.env.DB_USER || 'raymondtsai',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create the connection pool
export const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Helper function for running queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('🔍 Executed query', { text, duration, rows: res.rowCount });
  return res;
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Closing database connections...');
  pool.end().then(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});