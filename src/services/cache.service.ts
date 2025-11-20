import Redis from 'ioredis';
import { config } from '../config';
import logger from '../utils/logger';

class CacheService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(config.redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
      this.isConnected = false;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        return null;
      }
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }
      const ttl = ttlSeconds || config.cacheTTL;
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }
      await this.client.flushdb();
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}

export default new CacheService();

