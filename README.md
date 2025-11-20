# Meme Coin Data Aggregator

A real-time meme coin data aggregation service that fetches, merges, and streams token data from multiple DEX sources with efficient caching and WebSocket updates.

## 🚀 Features

- **Multi-Source Aggregation**: Fetches data from DexScreener and Jupiter APIs
- **Real-time Updates**: WebSocket support for live price and volume updates
- **Smart Caching**: Redis-based caching with configurable TTL (default 30s)
- **Rate Limiting**: Built-in exponential backoff for API rate limits
- **Filtering & Sorting**: Support for various filters (volume, price change, market cap)
- **Cursor Pagination**: Efficient pagination for large token lists
- **Duplicate Merging**: Intelligent merging of tokens from multiple sources

## 📋 Prerequisites

- Node.js >= 18.x
- Redis >= 6.x
- npm or yarn

## 🚀 Quick Start

**Want to get started immediately?** Check out [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide!

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ankit
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
REDIS_URL=redis://localhost:6379
CACHE_TTL=30
RATE_LIMIT_MAX_REQUESTS=250
RATE_LIMIT_WINDOW_MS=60000
WS_UPDATE_INTERVAL=5000
NODE_ENV=development
```

4. **Start Redis** (if not already running)
```bash
# macOS with Homebrew
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### REST API

#### Get All Tokens
```http
GET /api/tokens?sortBy=volume&sortOrder=desc&limit=20&cursor=0
```

**Query Parameters:**
- `sortBy`: `volume` | `price_change` | `market_cap` | `liquidity`
- `sortOrder`: `asc` | `desc`
- `limit`: number (default: 20)
- `cursor`: pagination cursor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "token_address": "...",
      "token_name": "PIPE CTO",
      "token_ticker": "PIPE",
      "price_sol": 4.414e-7,
      "market_cap_sol": 441.41,
      "volume_sol": 1322.43,
      "liquidity_sol": 149.36,
      "transaction_count": 2205,
      "price_1hr_change": 120.61,
      "protocol": "Raydium CLMM",
      "source": "dexscreener",
      "updated_at": 1234567890
    }
  ],
  "next_cursor": "20",
  "has_more": true,
  "total": 50
}
```

#### Get Token by Address
```http
GET /api/tokens/:address
```

#### Refresh Cache
```http
POST /api/tokens/refresh
```

#### Health Check
```http
GET /api/health
```

### WebSocket Events

Connect to `ws://localhost:3000`

**Server Events:**
- `tokens`: Periodic token updates (every 5s)
- `price_update`: Individual token price updates

**Client Events:**
- `filter`: Request filtered tokens
- `subscribe`: Subscribe to specific token updates
- `unsubscribe`: Unsubscribe from token updates

**Example Client Code:**
```javascript
const socket = io('http://localhost:3000');

// Receive token updates
socket.on('tokens', (data) => {
  console.log('Token updates:', data);
});

// Filter tokens
socket.emit('filter', {
  sortBy: 'volume',
  sortOrder: 'desc',
  limit: 10
});

// Subscribe to specific token
socket.emit('subscribe', 'TOKEN_ADDRESS_HERE');
```

## 🏗️ Architecture

### Folder Structure
```
ankit/
├── src/
│   ├── __tests__/          # Test files
│   ├── clients/            # API clients
│   │   ├── base.client.ts
│   │   ├── dexscreener.client.ts
│   │   └── jupiter.client.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   ├── routes/             # Express routes
│   │   ├── tokens.routes.ts
│   │   └── health.routes.ts
│   ├── services/           # Business logic
│   │   ├── aggregation.service.ts
│   │   ├── cache.service.ts
│   │   └── websocket.service.ts
│   ├── types/              # TypeScript types
│   │   └── token.ts
│   ├── utils/              # Utilities
│   │   └── logger.ts
│   ├── app.ts              # Express app setup
│   └── index.ts            # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Design Decisions

1. **Rate Limiting Strategy**: 
   - Implemented at the client level with request counting
   - Exponential backoff for retries
   - Respects API limits (250/min for DexScreener)

2. **Caching Strategy**:
   - Redis for distributed caching
   - 30-second TTL by default
   - Automatic cache refresh every 30s via cron

3. **Data Merging**:
   - Deduplicates tokens by address
   - Aggregates volumes from multiple sources
   - Prefers DexScreener data over Jupiter

4. **WebSocket Updates**:
   - Broadcasts to all connected clients every 5s
   - Room-based subscriptions for specific tokens
   - Initial data load on connection

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📊 Performance Considerations

- **Response Times**: Cached requests: <50ms, Fresh data: 500-2000ms
- **Rate Limits**: 250 requests/min per DEX source
- **WebSocket**: ~5KB per update, 5-second interval
- **Memory**: ~100MB base + Redis

## 🚨 Error Handling

- Graceful degradation when APIs are unavailable
- Automatic retry with exponential backoff
- Redis connection failures don't crash the server
- Comprehensive error logging with Winston

## 🔒 Security

- CORS enabled for all origins (configure for production)
- Input validation on query parameters
- Rate limiting prevents API abuse
- No authentication (add for production use)

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |
| CACHE_TTL | Cache TTL in seconds | 30 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 250 |
| RATE_LIMIT_WINDOW_MS | Rate limit window (ms) | 60000 |
| WS_UPDATE_INTERVAL | WebSocket update interval (ms) | 5000 |
| NODE_ENV | Environment | development |

## 🚀 Deployment

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Using Render/Railway/Fly.io
1. Connect your GitHub repository
2. Add environment variables
3. Set build command: `npm run build`
4. Set start command: `npm start`

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed system architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to various platforms
- **[TESTING.md](TESTING.md)** - Testing guide and strategies
- **[postman_collection.json](postman_collection.json)** - API collection for testing

## 📹 Demo Video

[Link to 1-2 minute YouTube video - Coming soon]

**Video Script for Recording:**
1. Show demo page with live updates (30s)
2. Make 5-10 rapid API calls via Postman showing response times (30s)
3. Open multiple browser tabs showing WebSocket updates (20s)
4. Walk through architecture diagram and design decisions (40s)

## 🔗 API Collection

Import `postman_collection.json` into Postman or use Newman:
```bash
npm install -g newman
newman run postman_collection.json
```

## 📄 License

MIT

## 👤 Author

[Your Name]

## 🙏 Acknowledgments

- DexScreener API
- Jupiter Aggregator
- Socket.io
- Redis

