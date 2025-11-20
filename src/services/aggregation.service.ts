import { Token, TokenFilter, PaginatedResponse } from '../types/token';
import { DexScreenerClient } from '../clients/dexscreener.client';
import { JupiterClient } from '../clients/jupiter.client';
import cacheService from './cache.service';
import logger from '../utils/logger';

class AggregationService {
  private dexScreener: DexScreenerClient;
  private jupiter: JupiterClient;
  private readonly CACHE_KEY = 'tokens:all';

  constructor() {
    this.dexScreener = new DexScreenerClient();
    this.jupiter = new JupiterClient();
  }

  async fetchAndAggregateTokens(query: string = 'SOL', useCache: boolean = true): Promise<Token[]> {
    // Check cache first
    if (useCache) {
      const cached = await cacheService.get<Token[]>(this.CACHE_KEY);
      if (cached) {
        logger.info('Returning cached tokens');
        return cached;
      }
    }

    logger.info('Fetching fresh token data from DEXs');

    // Fetch from multiple sources in parallel
    const [dexScreenerTokens, jupiterTokens] = await Promise.all([
      this.dexScreener.searchTokens(query),
      this.jupiter.searchTokens(query),
    ]);

    // Merge tokens from different sources
    const mergedTokens = this.mergeTokens([...dexScreenerTokens, ...jupiterTokens]);

    // Cache the results
    await cacheService.set(this.CACHE_KEY, mergedTokens);

    return mergedTokens;
  }

  private mergeTokens(tokens: Token[]): Token[] {
    const tokenMap = new Map<string, Token>();

    for (const token of tokens) {
      const existing = tokenMap.get(token.token_address);

      if (!existing) {
        tokenMap.set(token.token_address, token);
      } else {
        // Merge duplicate tokens - prefer more recent data and aggregate volumes
        const merged: Token = {
          ...existing,
          volume_sol: existing.volume_sol + token.volume_sol,
          liquidity_sol: Math.max(existing.liquidity_sol, token.liquidity_sol),
          transaction_count: existing.transaction_count + token.transaction_count,
          // Prefer DexScreener data over Jupiter
          ...(token.source === 'dexscreener' ? token : {}),
          updated_at: Math.max(existing.updated_at || 0, token.updated_at || 0),
        };
        tokenMap.set(token.token_address, merged);
      }
    }

    return Array.from(tokenMap.values());
  }

  filterAndSort(tokens: Token[], filter: TokenFilter): Token[] {
    let filtered = [...tokens];

    // Apply sorting
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;

        switch (filter.sortBy) {
          case 'volume':
            aValue = a.volume_sol;
            bValue = b.volume_sol;
            break;
          case 'price_change':
            aValue = a.price_1hr_change;
            bValue = b.price_1hr_change;
            break;
          case 'market_cap':
            aValue = a.market_cap_sol;
            bValue = b.market_cap_sol;
            break;
          case 'liquidity':
            aValue = a.liquidity_sol;
            bValue = b.liquidity_sol;
            break;
        }

        return filter.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }

  paginate(tokens: Token[], filter: TokenFilter): PaginatedResponse<Token> {
    const limit = filter.limit || 20;
    const cursor = filter.cursor ? parseInt(filter.cursor, 10) : 0;

    const start = cursor;
    const end = start + limit;
    const data = tokens.slice(start, end);
    const hasMore = end < tokens.length;

    return {
      data,
      next_cursor: hasMore ? end.toString() : undefined,
      has_more: hasMore,
      total: tokens.length,
    };
  }

  async getTokens(filter: TokenFilter = {}): Promise<PaginatedResponse<Token>> {
    const tokens = await this.fetchAndAggregateTokens();
    const filtered = this.filterAndSort(tokens, filter);
    return this.paginate(filtered, filter);
  }

  async refreshCache(): Promise<void> {
    logger.info('Refreshing token cache');
    await this.fetchAndAggregateTokens('SOL', false);
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    const cacheKey = `token:${address}`;
    
    // Check cache
    const cached = await cacheService.get<Token>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from DexScreener (primary source)
    const token = await this.dexScreener.getTokenByAddress(address);
    
    if (token) {
      await cacheService.set(cacheKey, token);
    }

    return token;
  }
}

export default new AggregationService();

