/**
 * PostgreSQL Database Configuration
 * Replaces Supabase client with direct PostgreSQL connection
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'raiox_recognize',
  user: process.env.DB_USER || 'raiox_user',
  password: process.env.DB_PASSWORD || 'raiox_password_dev',
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('🔌 PostgreSQL pool closed');
  process.exit(0);
});

export default pool;
