import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTTL: parseInt(process.env.CACHE_TTL || '30', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '250', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  wsUpdateInterval: parseInt(process.env.WS_UPDATE_INTERVAL || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // CORS: Use ALLOWED_ORIGINS for specific domains, or '*' for all (default in dev)
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : (process.env.NODE_ENV === 'production' ? [] : ['*']),
};

