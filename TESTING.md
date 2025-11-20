# Testing Guide

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test -- cache.service.test
```

## Test Structure

### Unit Tests
Located in `src/__tests__/`

1. **cache.service.test.ts** - Cache operations
2. **aggregation.service.test.ts** - Data aggregation logic
3. **api.test.ts** - API endpoints

## Manual Testing

### 1. Start Services

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start app
npm run dev
```

### 2. Test REST API

#### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "redis": "connected"
}
```

#### Get Tokens (Default)
```bash
curl http://localhost:3000/api/tokens
```

#### Get Tokens (Filtered)
```bash
# Sort by volume
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"

# Sort by price change
curl "http://localhost:3000/api/tokens?sortBy=price_change&sortOrder=desc&limit=10"

# Pagination
curl "http://localhost:3000/api/tokens?limit=5&cursor=0"
curl "http://localhost:3000/api/tokens?limit=5&cursor=5"
```

#### Get Token by Address
```bash
curl http://localhost:3000/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

#### Refresh Cache
```bash
curl -X POST http://localhost:3000/api/tokens/refresh
```

### 3. Test WebSocket

#### Using Browser Console
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('tokens', (data) => {
  console.log('Received:', data);
});

// Apply filter
socket.emit('filter', {
  sortBy: 'volume',
  sortOrder: 'desc',
  limit: 10
});

// Subscribe to token
socket.emit('subscribe', 'TOKEN_ADDRESS');
```

#### Using wscat
```bash
npm install -g wscat
wscat -c ws://localhost:3000
```

### 4. Test Performance

#### Response Time Test
```bash
# Install Apache Bench
# macOS: brew install ab
# Linux: apt-get install apache2-utils

# Test API
ab -n 100 -c 10 http://localhost:3000/api/tokens
```

#### Load Test Script
```javascript
// loadtest.js
const axios = require('axios');

async function runLoadTest(requests = 100) {
  const start = Date.now();
  const promises = [];

  for (let i = 0; i < requests; i++) {
    promises.push(
      axios.get('http://localhost:3000/api/tokens')
        .then(res => res.headers['x-response-time'] || 0)
    );
  }

  const times = await Promise.all(promises);
  const duration = Date.now() - start;

  console.log(`Total requests: ${requests}`);
  console.log(`Total time: ${duration}ms`);
  console.log(`Avg response: ${duration / requests}ms`);
  console.log(`Requests/sec: ${(requests / duration * 1000).toFixed(2)}`);
}

runLoadTest(100);
```

### 5. Test Multiple Browser Tabs

1. Open demo page: http://localhost:3000/demo.html
2. Open in 3-5 browser tabs
3. Verify all tabs receive updates simultaneously
4. Change filters in one tab
5. Verify data updates correctly

## Test Scenarios

### Happy Path Tests ✅

1. **Basic Token Retrieval**
   - Request tokens without filters
   - Verify response structure
   - Check data completeness

2. **Filtering & Sorting**
   - Sort by each metric (volume, price_change, etc.)
   - Test ascending and descending
   - Verify sort accuracy

3. **Pagination**
   - Request first page
   - Request subsequent pages using cursor
   - Verify no duplicate tokens
   - Verify total count accuracy

4. **Caching**
   - First request (cache miss)
   - Second request (cache hit)
   - Wait for TTL expiration
   - Request again (cache miss)

5. **WebSocket Updates**
   - Connect client
   - Receive periodic updates
   - Apply filters via WebSocket
   - Verify filtered results

### Edge Cases Tests ⚠️

1. **Invalid Input**
   ```bash
   # Invalid sort field
   curl "http://localhost:3000/api/tokens?sortBy=invalid"
   
   # Negative limit
   curl "http://localhost:3000/api/tokens?limit=-5"
   
   # Invalid cursor
   curl "http://localhost:3000/api/tokens?cursor=abc"
   ```

2. **Non-existent Token**
   ```bash
   curl http://localhost:3000/api/tokens/invalid-address
   # Should return 404
   ```

3. **Rate Limiting**
   - Make 300 rapid requests
   - Verify rate limiting kicks in
   - Check exponential backoff

4. **Redis Failure**
   ```bash
   # Stop Redis
   redis-cli shutdown
   
   # App should still work (degraded)
   curl http://localhost:3000/api/tokens
   
   # Restart Redis
   redis-server &
   ```

5. **API Failure Simulation**
   - Block access to DEX APIs (firewall/hosts)
   - Verify graceful degradation
   - Check error logging

### Stress Tests 💪

1. **Concurrent Connections**
   ```bash
   # 100 concurrent requests
   ab -n 1000 -c 100 http://localhost:3000/api/tokens
   ```

2. **WebSocket Connections**
   - Connect 50+ clients
   - Verify all receive updates
   - Monitor memory usage

3. **Cache Pressure**
   - Request 1000 different token addresses
   - Monitor Redis memory
   - Verify LRU eviction

4. **Long Running Test**
   ```bash
   # Run for 1 hour
   while true; do
     curl http://localhost:3000/api/tokens
     sleep 10
   done
   ```

## Integration Testing

### Test with Postman

1. Import `postman_collection.json`
2. Run entire collection
3. Verify all requests pass
4. Check response times

### Test with Newman (CLI)
```bash
npm install -g newman
newman run postman_collection.json
```

## Expected Results

### Response Times
- **Cache hit**: < 50ms
- **Cache miss**: 500-2000ms
- **WebSocket update**: < 100ms

### Success Rates
- **API requests**: > 99%
- **WebSocket connections**: > 95%
- **Cache operations**: > 99.9%

### Resource Usage
- **Memory**: < 200MB
- **CPU**: < 50% (under normal load)
- **Redis memory**: < 50MB

## Test Coverage Goals

- **Overall**: > 80%
- **Services**: > 90%
- **Routes**: > 75%
- **Utils**: > 85%

## Continuous Testing

### Pre-commit Hook
```bash
# .husky/pre-commit
npm test
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build
```

## Debugging Tests

### Enable Debug Logging
```bash
DEBUG=* npm test
```

### Run Single Test
```bash
npm test -- -t "should fetch and return tokens"
```

### Update Snapshots
```bash
npm test -- -u
```

## Common Issues

### Test Timeout
```javascript
// Increase timeout for slow tests
it('should fetch tokens', async () => {
  // test code
}, 30000); // 30 second timeout
```

### Redis Connection
```javascript
// Wait for Redis connection
beforeAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});
```

### Async Issues
```javascript
// Always await async operations
await service.doSomething();
expect(result).toBe(expected);
```

## Test Checklist

Before deployment:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual API tests successful
- [ ] WebSocket functionality verified
- [ ] Performance tests meet targets
- [ ] Edge cases handled
- [ ] Error scenarios tested
- [ ] Load tests successful
- [ ] Documentation updated
- [ ] Test coverage > 80%

