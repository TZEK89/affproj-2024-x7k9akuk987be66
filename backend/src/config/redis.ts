import { createClient, RedisClientType } from 'redis';
import logger from './logger';

/**
 * Redis Configuration
 * 
 * Creates and manages Redis client for caching and session management.
 * Provides helper functions for common caching operations.
 */

let redisClient: RedisClientType;

/**
 * Initialize Redis client
 */
export const initRedis = async (): Promise<void> => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  await redisClient.connect();
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
};

/**
 * Cache helper functions
 */

/**
 * Set a value in cache with optional TTL
 * @param key Cache key
 * @param value Value to cache (will be JSON stringified)
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export const setCache = async (
  key: string,
  value: any,
  ttl: number = 3600
): Promise<void> => {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    await client.setEx(key, ttl, serialized);
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error('Redis setCache error', { key, error });
    throw error;
  }
};

/**
 * Get a value from cache
 * @param key Cache key
 * @returns Cached value or null if not found
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const client = getRedisClient();
    const cached = await client.get(key);
    if (!cached) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }
    logger.debug(`Cache hit: ${key}`);
    return JSON.parse(cached) as T;
  } catch (error) {
    logger.error('Redis getCache error', { key, error });
    return null;
  }
};

/**
 * Delete a value from cache
 * @param key Cache key
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error('Redis deleteCache error', { key, error });
  }
};

/**
 * Delete all keys matching a pattern
 * @param pattern Key pattern (e.g., "campaign:*")
 */
export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug(`Cache deleted: ${keys.length} keys matching ${pattern}`);
    }
  } catch (error) {
    logger.error('Redis deleteCachePattern error', { pattern, error });
  }
};

/**
 * Check if a key exists in cache
 * @param key Cache key
 * @returns True if key exists
 */
export const existsCache = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Redis existsCache error', { key, error });
    return false;
  }
};

/**
 * Get or set cache (cache-aside pattern)
 * @param key Cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param ttl Time to live in seconds
 * @returns Cached or fetched value
 */
export const getOrSetCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> => {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch data
  const data = await fetchFn();

  // Store in cache
  await setCache(key, data, ttl);

  return data;
};

/**
 * Increment a counter in cache
 * @param key Cache key
 * @returns New value after increment
 */
export const incrementCache = async (key: string): Promise<number> => {
  try {
    const client = getRedisClient();
    const value = await client.incr(key);
    return value;
  } catch (error) {
    logger.error('Redis incrementCache error', { key, error });
    throw error;
  }
};

/**
 * Set expiration time for a key
 * @param key Cache key
 * @param ttl Time to live in seconds
 */
export const expireCache = async (key: string, ttl: number): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.expire(key, ttl);
  } catch (error) {
    logger.error('Redis expireCache error', { key, error });
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

export default {
  initRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  getOrSetCache,
  incrementCache,
  expireCache,
  closeRedis,
};

