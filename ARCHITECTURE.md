# Architecture Documentation

## System Overview

The Meme Coin Aggregator is a real-time data aggregation service built with Node.js, TypeScript, Express, Socket.io, and Redis. It fetches token data from multiple DEX APIs, merges duplicate entries, caches results, and streams updates to connected clients via WebSocket.

## High-Level Architecture

```
┌─────────────────┐
│   Client Apps   │ (Web browsers, mobile apps)
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────────────────────────┐
│         Express Server              │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ REST API     │  │  WebSocket  │ │
│  │ Endpoints    │  │  Handler    │ │
│  └──────┬───────┘  └──────┬──────┘ │
└─────────┼──────────────────┼────────┘
          │                  │
          ▼                  ▼
    ┌─────────────────────────────┐
    │  Aggregation Service        │
    │  - Fetch & Merge            │
    │  - Filter & Sort            │
    │  - Paginate                 │
    └──────┬──────────────────────┘
           │
           ├──────┬──────────┬──────────┐
           │      │          │          │
           ▼      ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  Cache   │ │DexScreen │ │ Jupiter  │
    │ (Redis)  │ │  Client  │ │  Client  │
    └──────────┘ └────┬─────┘ └────┬─────┘
                      │            │
                      ▼            ▼
                 External DEX APIs
```

## Component Details

### 1. API Clients Layer

#### BaseClient (`base.client.ts`)
- **Purpose**: Provides common functionality for all API clients
- **Features**:
  - Rate limiting with request counting
  - Exponential backoff retry logic
  - Error handling
- **Key Methods**:
  - `checkRateLimit()`: Prevents exceeding API rate limits
  - `retryWithBackoff()`: Retries failed requests with exponential delays

#### DexScreenerClient (`dexscreener.client.ts`)
- **Purpose**: Fetches token data from DexScreener API
- **Rate Limit**: 250 requests/min
- **Key Methods**:
  - `searchTokens(query)`: Search tokens by query
  - `getTokenByAddress(address)`: Get specific token details
  - `transformPairs()`: Converts API response to internal format

#### JupiterClient (`jupiter.client.ts`)
- **Purpose**: Fetches token data from Jupiter API
- **Key Methods**:
  - `searchTokens(query)`: Search tokens
  - `transformTokens()`: Converts API response to internal format

### 2. Services Layer

#### CacheService (`cache.service.ts`)
- **Purpose**: Manages Redis caching
- **Features**:
  - Connection management with retry logic
  - TTL-based expiration
  - Graceful error handling
- **Key Methods**:
  - `get<T>(key)`: Retrieve cached data
  - `set(key, value, ttl)`: Store data with expiration
  - `del(key)`: Delete cached data
  - `clear()`: Clear all cache

#### AggregationService (`aggregation.service.ts`)
- **Purpose**: Core business logic for data aggregation
- **Features**:
  - Multi-source data fetching
  - Token deduplication and merging
  - Filtering and sorting
  - Cursor-based pagination
- **Key Methods**:
  - `fetchAndAggregateTokens()`: Fetch from all sources and merge
  - `mergeTokens()`: Deduplicate and combine token data
  - `filterAndSort()`: Apply filters and sorting
  - `paginate()`: Implement cursor-based pagination
  - `getTokens()`: Main entry point for token retrieval

**Merging Logic**:
```typescript
// Deduplication by token address
// Aggregate volumes from multiple sources
// Prefer DexScreener data over Jupiter
// Keep most recent update timestamp
```

#### WebSocketService (`websocket.service.ts`)
- **Purpose**: Manages real-time updates via WebSocket
- **Features**:
  - Periodic token updates (every 5 seconds)
  - Room-based token subscriptions
  - Cache refresh via cron (every 30 seconds)
- **Key Events**:
  - `connection`: Client connects
  - `filter`: Client requests filtered data
  - `subscribe/unsubscribe`: Token-specific updates
  - `tokens`: Broadcast token updates

### 3. Routes Layer

#### TokensRoutes (`tokens.routes.ts`)
- `GET /api/tokens`: Paginated token list with filters
- `GET /api/tokens/:address`: Get specific token
- `POST /api/tokens/refresh`: Refresh cache

#### HealthRoutes (`health.routes.ts`)
- `GET /api/health`: Service health status

### 4. Configuration

#### Config (`config/index.ts`)
- Centralizes environment variable management
- Type-safe configuration access
- Default values for all settings

## Data Flow

### Initial Request Flow
```
1. Client → GET /api/tokens
2. TokensRoute → AggregationService.getTokens()
3. AggregationService checks Redis cache
4. If cache miss:
   a. Fetch from DexScreener in parallel
   b. Fetch from Jupiter in parallel
   c. Merge results (deduplicate by address)
   d. Cache merged data (TTL: 30s)
5. Apply filters and sorting
6. Paginate results
7. Return to client
```

### WebSocket Update Flow
```
1. Server starts → WebSocketService.initialize()
2. Every 5 seconds:
   a. Fetch latest token data
   b. Broadcast to all connected clients
3. Client subscribes to specific token:
   a. Client emits 'subscribe' event
   b. Server adds client to room
   c. Token updates sent only to room members
```

### Cache Refresh Flow
```
1. Cron job runs every 30 seconds
2. Calls AggregationService.refreshCache()
3. Fetches fresh data (bypassing cache)
4. Updates Redis cache
5. Next requests get fresh data
```

## Rate Limiting Strategy

### Per-Client Rate Limiting
- Track requests in memory per client instance
- Reset counter every 60 seconds
- Wait if limit reached (prevents API errors)

### Exponential Backoff
```
Retry 1: Wait 1 second
Retry 2: Wait 2 seconds
Retry 3: Wait 4 seconds
```

### Error Handling
- Don't retry 4xx errors (except 429)
- Retry 5xx errors and network errors
- Max 3 retries per request

## Caching Strategy

### Cache Keys
- `tokens:all`: All aggregated tokens
- `token:{address}`: Individual token data

### Cache TTL
- Default: 30 seconds
- Configurable via environment variable
- Automatic refresh via cron

### Cache Invalidation
- Time-based (TTL expiration)
- Manual refresh endpoint
- Automatic cron refresh

## Performance Optimizations

### 1. Parallel API Calls
```typescript
const [dexScreenerTokens, jupiterTokens] = await Promise.all([
  this.dexScreener.searchTokens(query),
  this.jupiter.searchTokens(query),
]);
```

### 2. Efficient Merging
- Use Map for O(1) lookups
- Single pass through all tokens
- Minimize data copying

### 3. Smart Caching
- Cache aggregated results
- Reduce API calls by 90%+
- Balance freshness vs performance

### 4. Cursor-Based Pagination
- Constant time complexity
- Efficient for large datasets
- Better than offset-based

## Scalability Considerations

### Current Architecture
- Single server instance
- In-memory rate limiting
- Redis for shared cache

### Scaling Options

**Horizontal Scaling**:
- Add load balancer
- Multiple server instances
- Shared Redis for caching
- Sticky sessions for WebSocket

**Vertical Scaling**:
- Increase server resources
- Optimize Redis memory
- Connection pooling

**Database Layer** (if needed):
- PostgreSQL for historical data
- Time-series DB for price history
- Read replicas for queries

## Error Handling

### API Client Errors
- Retry with backoff
- Fallback to cached data
- Log errors for monitoring

### Cache Errors
- Graceful degradation
- Proceed without cache
- Log connection issues

### WebSocket Errors
- Auto-reconnect on client
- Heartbeat checks
- Error events to clients

## Monitoring & Logging

### Logging Levels
- **Info**: Normal operations, API calls
- **Warn**: Rate limits, retries
- **Error**: Failures, exceptions

### Key Metrics to Monitor
- API response times
- Cache hit/miss ratio
- WebSocket connection count
- Error rates
- Memory usage

## Security Considerations

### Current Implementation
- CORS enabled (all origins)
- No authentication
- Input validation on query params
- Rate limiting at client level

### Production Recommendations
- Restrict CORS origins
- Add API key authentication
- Implement request rate limiting
- Add request size limits
- Enable HTTPS only
- Add DDoS protection

## Testing Strategy

### Unit Tests
- Cache service operations
- Data merging logic
- Filtering and sorting
- Pagination logic

### Integration Tests
- API endpoint responses
- WebSocket connections
- Cache integration
- Error scenarios

### Performance Tests
- Load testing with multiple clients
- Cache performance
- API rate limiting
- WebSocket scalability

## Future Enhancements

1. **Historical Data**
   - Store price history in database
   - Chart data endpoints
   - Historical analytics

2. **Advanced Filtering**
   - Complex filter combinations
   - Search by name/ticker
   - Custom watchlists

3. **Notifications**
   - Price alerts
   - Volume spike notifications
   - Email/SMS integration

4. **Analytics**
   - Trending tokens
   - Market sentiment
   - Correlation analysis

5. **Additional Data Sources**
   - More DEX integrations
   - Social media data
   - On-chain analytics

