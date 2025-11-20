import { Router, Request, Response } from 'express';
import aggregationService from '../services/aggregation.service';
import { TokenFilter } from '../types/token';

const router = Router();

/**
 * GET /api/tokens
 * Get paginated list of tokens with filtering and sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: TokenFilter = {
      timePeriod: req.query.timePeriod as '1h' | '24h' | '7d' | undefined,
      sortBy: req.query.sortBy as 'volume' | 'price_change' | 'market_cap' | 'liquidity' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      cursor: req.query.cursor as string | undefined,
    };

    const result = await aggregationService.getTokens(filter);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens',
    });
  }
});

/**
 * GET /api/tokens/:address
 * Get specific token by address
 */
router.get('/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const token = await aggregationService.getTokenByAddress(address);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
      });
    }

    res.json({
      success: true,
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token',
    });
  }
});

/**
 * POST /api/tokens/refresh
 * Manually refresh token cache
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    await aggregationService.refreshCache();
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
    });
  }
});

export default router;

