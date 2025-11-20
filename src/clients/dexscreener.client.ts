import { BaseClient } from './base.client';
import { Token } from '../types/token';
import logger from '../utils/logger';

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  volume?: {
    h24: number;
  };
  priceChange?: {
    h1: number;
    h24: number;
  };
  txns?: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  marketCap?: number;
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

export class DexScreenerClient extends BaseClient {
  constructor() {
    super('https://api.dexscreener.com', 250); // 300/min limit, use 250 to be safe
  }

  async searchTokens(query: string = 'SOL'): Promise<Token[]> {
    try {
      await this.checkRateLimit();

      const response = await this.retryWithBackoff(async () => {
        return await this.client.get<DexScreenerResponse>(`/latest/dex/search?q=${query}`);
      });

      const pairs = response.data.pairs || [];
      return this.transformPairs(pairs);
    } catch (error) {
      logger.error('DexScreener API error:', error);
      return [];
    }
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    try {
      await this.checkRateLimit();

      const response = await this.retryWithBackoff(async () => {
        return await this.client.get<DexScreenerResponse>(`/latest/dex/tokens/${address}`);
      });

      const pairs = response.data.pairs || [];
      if (pairs.length === 0) return null;

      const tokens = this.transformPairs(pairs);
      return tokens[0] || null;
    } catch (error) {
      logger.error('DexScreener token fetch error:', error);
      return null;
    }
  }

  private transformPairs(pairs: DexScreenerPair[]): Token[] {
    return pairs
      .filter(pair => pair.chainId === 'solana') // Focus on Solana
      .map((pair) => {
        const priceInSol = parseFloat(pair.priceNative || '0');
        const volumeInSol = pair.volume?.h24 
          ? pair.volume.h24 / (pair.priceUsd ? parseFloat(pair.priceUsd) : 1) 
          : 0;
        const liquidityInSol = pair.liquidity?.quote || 0;
        const marketCapInSol = pair.marketCap 
          ? pair.marketCap / (pair.priceUsd ? parseFloat(pair.priceUsd) : 1)
          : priceInSol * 1000000; // estimate if not available

        return {
          token_address: pair.baseToken.address,
          token_name: pair.baseToken.name,
          token_ticker: pair.baseToken.symbol,
          price_sol: priceInSol,
          market_cap_sol: marketCapInSol,
          volume_sol: volumeInSol,
          liquidity_sol: liquidityInSol,
          transaction_count: pair.txns?.h24 ? pair.txns.h24.buys + pair.txns.h24.sells : 0,
          price_1hr_change: pair.priceChange?.h1 || 0,
          protocol: pair.dexId,
          source: 'dexscreener',
          updated_at: Date.now(),
        };
      });
  }
}

