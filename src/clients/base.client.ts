import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../utils/logger';
import { config } from '../config';

export class BaseClient {
  protected client: AxiosInstance;
  protected requestCount: number = 0;
  protected windowStart: number = Date.now();
  protected maxRequests: number;
  protected windowMs: number;

  constructor(baseURL: string, maxRequests?: number) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.maxRequests = maxRequests || config.rateLimitMaxRequests;
    this.windowMs = config.rateLimitWindowMs;
  }

  protected async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check if we've hit the limit
    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.windowStart);
      logger.warn(`Rate limit hit, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.windowStart = Date.now();
    }

    this.requestCount++;
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const axiosError = error as AxiosError;

        // Don't retry on 4xx errors (except 429)
        if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500 && axiosError.response.status !== 429) {
          throw error;
        }

        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i);
          logger.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }
}

