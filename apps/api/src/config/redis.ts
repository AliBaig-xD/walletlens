import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

redis.on('connect', () => logger.info('Redis client connected'));
redis.on('ready', () => logger.info('Redis client ready'));
redis.on('error', (err) => logger.error('Redis client error', { error: err.message }));
redis.on('close', () => logger.warn('Redis client connection closed'));
redis.on('reconnecting', () => logger.info('Redis client reconnecting...'));

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis connection closed');
}

export const redisHelpers = {
  async set(key: string, value: string | number | object, ttlSeconds?: number): Promise<void> {
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, str);
    } else {
      await redis.set(key, str);
    }
  },

  async get<T = string>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async del(...keys: string[]): Promise<number> {
    return redis.del(...keys);
  },

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  },
};