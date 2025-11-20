import { Router, Request, Response } from 'express';
import cacheService from '../services/cache.service';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: cacheService.getStatus() ? 'connected' : 'disconnected',
  };

  res.json(health);
});

export default router;

