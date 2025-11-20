export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  market_cap_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  transaction_count: number;
  price_1hr_change: number;
  protocol: string;
  source?: string; // DEX source
  updated_at?: number; // timestamp
}

export interface TokenFilter {
  timePeriod?: '1h' | '24h' | '7d';
  sortBy?: 'volume' | 'price_change' | 'market_cap' | 'liquidity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
  total?: number;
}

