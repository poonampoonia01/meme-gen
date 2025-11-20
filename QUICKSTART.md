# Quick Start Guide

Get the Meme Coin Aggregator running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Redis installed (or Docker)

## Installation Steps

### 1. Clone & Install
```bash
cd ankit
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

The default `.env` works for local development. No changes needed!

### 3. Start Redis

**Option A: Local Redis**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows (WSL)
sudo service redis-server start
```

**Option B: Docker**
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 4. Start Application
```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3000
📊 REST API: http://localhost:3000/api
🔌 WebSocket: ws://localhost:3000
💾 Redis: Connected
```

## Test It Out

### 1. Open Demo Page
Visit: http://localhost:3000/demo.html

You should see:
- Live token data updating every 5 seconds
- Real-time price changes
- Sorting and filtering controls

### 2. Test API Endpoints

**Get Tokens:**
```bash
curl http://localhost:3000/api/tokens
```

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Filter by Volume:**
```bash
curl "http://localhost:3000/api/tokens?sortBy=volume&sortOrder=desc&limit=10"
```

### 3. Test WebSocket

Open browser console on demo page:
```javascript
// Check WebSocket connection
console.log('Connected:', socket.connected);

// Listen for updates
socket.on('tokens', (data) => {
  console.log('Received:', data.data.length, 'tokens');
});
```

## Common Issues

### Redis Connection Failed
**Problem:** `Redis error: ECONNREFUSED`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should respond: PONG

# If not running, start it:
redis-server
```

### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

### Module Not Found
**Problem:** `Cannot find module 'express'`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Explore API Documentation**: See [README.md](README.md)
2. **Read Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Run Tests**: `npm test`
4. **Deploy**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Using Docker (Alternative)

If you prefer Docker:

```bash
# Start everything with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

That's it! You're ready to go! 🚀

## API Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/tokens` | GET | Get all tokens |
| `/api/tokens/:address` | GET | Get specific token |
| `/api/tokens/refresh` | POST | Refresh cache |
| `/demo.html` | GET | Live demo page |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Server → Client | Connection established |
| `tokens` | Server → Client | Token updates |
| `filter` | Client → Server | Request filtered data |
| `subscribe` | Client → Server | Subscribe to token |
| `price_update` | Server → Client | Price change alert |

## Support

Having issues? 
- Check [TESTING.md](TESTING.md) for troubleshooting
- Open a GitHub issue
- Review the logs: Check terminal output for errors

---

Happy coding! 🎉

