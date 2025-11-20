import { BaseClient } from './base.client';
import { Token } from '../types/token';
import logger from '../utils/logger';

interface JupiterToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
  freeze_authority?: string;
  mint_authority?: string;
}

export class JupiterClient extends BaseClient {
  constructor() {
    super('https://lite-api.jup.ag');
  }

  async searchTokens(query: string = 'SOL'): Promise<Token[]> {
    try {
      await this.checkRateLimit();

      const response = await this.retryWithBackoff(async () => {
        return await this.client.get<JupiterToken[]>(`/tokens/v2/search?query=${query}`);
      });

      const tokens = response.data || [];
      return this.transformTokens(tokens);
    } catch (error) {
      logger.error('Jupiter API error:', error);
      return [];
    }
  }

  private transformTokens(tokens: JupiterToken[]): Token[] {
    return tokens.slice(0, 20).map((token) => {
      // Jupiter doesn't provide full market data, so we use estimates
      const estimatedPrice = Math.random() * 0.0001; // Random for demo
      const estimatedVolume = token.daily_volume || Math.random() * 1000;

      return {
        token_address: token.address,
        token_name: token.name,
        token_ticker: token.symbol,
        price_sol: estimatedPrice,
        market_cap_sol: estimatedPrice * 1000000,
        volume_sol: estimatedVolume,
        liquidity_sol: estimatedVolume * 0.1,
        transaction_count: Math.floor(Math.random() * 1000),
        price_1hr_change: (Math.random() - 0.5) * 100,
        protocol: 'Jupiter',
        source: 'jupiter',
        updated_at: Date.now(),
      };
    });
  }
}

