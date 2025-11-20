import aggregationService from '../services/aggregation.service';
import { TokenFilter } from '../types/token';

describe('AggregationService', () => {
  describe('fetchAndAggregateTokens', () => {
    it('should fetch and return tokens', async () => {
      const tokens = await aggregationService.fetchAndAggregateTokens('SOL', false);
      
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      
      if (tokens.length > 0) {
        const token = tokens[0];
        expect(token).toHaveProperty('token_address');
        expect(token).toHaveProperty('token_name');
        expect(token).toHaveProperty('token_ticker');
        expect(token).toHaveProperty('price_sol');
      }
    }, 30000);

    it('should merge duplicate tokens', async () => {
      const tokens = await aggregationService.fetchAndAggregateTokens('SOL', false);
      const addresses = tokens.map(t => t.token_address);
      const uniqueAddresses = new Set(addresses);
      
      expect(addresses.length).toBe(uniqueAddresses.size);
    }, 30000);
  });

  describe('filterAndSort', () => {
    it('should sort by volume descending', async () => {
      const tokens = await aggregationService.fetchAndAggregateTokens('SOL', false);
      const filter: TokenFilter = { sortBy: 'volume', sortOrder: 'desc' };
      
      const sorted = aggregationService.filterAndSort(tokens, filter);
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].volume_sol).toBeGreaterThanOrEqual(sorted[i].volume_sol);
      }
    }, 30000);

    it('should sort by price change ascending', async () => {
      const tokens = await aggregationService.fetchAndAggregateTokens('SOL', false);
      const filter: TokenFilter = { sortBy: 'price_change', sortOrder: 'asc' };
      
      const sorted = aggregationService.filterAndSort(tokens, filter);
      
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1].price_1hr_change).toBeLessThanOrEqual(sorted[i].price_1hr_change);
      }
    }, 30000);
  });

  describe('paginate', () => {
    it('should paginate tokens correctly', async () => {
      const tokens = await aggregationService.fetchAndAggregateTokens('SOL', false);
      const filter: TokenFilter = { limit: 5 };
      
      const result = aggregationService.paginate(tokens, filter);
      
      expect(result.data.length).toBeLessThanOrEqual(5);
      expect(result.has_more).toBe(tokens.length > 5);
      expect(result.total).toBe(tokens.length);
    }, 30000);

    it('should handle cursor-based pagination', async () => {
      const tokens = await aggregationService.fetchAndAggregateTokens('SOL', false);
      
      const page1 = aggregationService.paginate(tokens, { limit: 5 });
      expect(page1.data.length).toBeLessThanOrEqual(5);
      
      if (page1.next_cursor) {
        const page2 = aggregationService.paginate(tokens, { 
          limit: 5, 
          cursor: page1.next_cursor 
        });
        
        expect(page2.data.length).toBeGreaterThan(0);
        expect(page1.data[0].token_address).not.toBe(page2.data[0].token_address);
      }
    }, 30000);
  });

  describe('getTokens', () => {
    it('should return paginated tokens with default filter', async () => {
      const result = await aggregationService.getTokens();
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('has_more');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should apply custom filters', async () => {
      const result = await aggregationService.getTokens({
        sortBy: 'volume',
        sortOrder: 'desc',
        limit: 10,
      });
      
      expect(result.data.length).toBeLessThanOrEqual(10);
    }, 30000);
  });

  describe('getTokenByAddress', () => {
    it('should fetch token by address', async () => {
      // Use a known Solana token address (USDC)
      const address = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const token = await aggregationService.getTokenByAddress(address);
      
      if (token) {
        expect(token.token_address).toBe(address);
      }
    }, 30000);

    it('should return null for invalid address', async () => {
      const token = await aggregationService.getTokenByAddress('invalid-address-123');
      expect(token).toBeNull();
    }, 30000);
  });
});

