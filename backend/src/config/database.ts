import { Pool, PoolClient, QueryResult } from 'pg';
import logger from './logger';

/**
 * PostgreSQL Database Configuration
 * 
 * Creates and manages a connection pool to the PostgreSQL database.
 * Uses connection pooling for better performance and resource management.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Log pool events
pool.on('connect', () => {
  logger.info('New client connected to database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

/**
 * Execute a query
 * @param text SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns Pool client
 */
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

/**
 * Execute a transaction
 * @param callback Function containing transaction queries
 * @returns Transaction result
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection
 * @returns True if connection successful
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW()');
    logger.info('Database connection successful', { time: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
};

/**
 * Close all database connections
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};

export default {
  query,
  getClient,
  transaction,
  testConnection,
  closePool,
};

