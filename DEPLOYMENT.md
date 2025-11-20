# Deployment Guide

This guide covers deploying the Meme Coin Aggregator to various platforms.

## Prerequisites

- Node.js 18+ (for local/VPS deployment)
- Redis instance (local, Docker, or cloud)
- Git repository

## Option 1: Deploy to Render.com (Recommended for Free Tier)

Render offers free tier with:
- 750 hours/month free compute
- Free PostgreSQL (can use for Redis alternative)
- Auto SSL certificates
- Easy GitHub integration

### Steps:

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Create Redis Instance**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Redis"
   - Name: `meme-coin-redis`
   - Plan: Free (25MB)
   - Click "Create Redis"
   - Copy the **Internal Redis URL**

3. **Deploy Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `meme-coin-aggregator`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Add Environment Variables**
   - Click "Environment" tab
   - Add variables:
     ```
     PORT=3000
     REDIS_URL=<your-internal-redis-url>
     CACHE_TTL=30
     RATE_LIMIT_MAX_REQUESTS=250
     RATE_LIMIT_WINDOW_MS=60000
     WS_UPDATE_INTERVAL=5000
     NODE_ENV=production
     ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your app will be live at: `https://meme-coin-aggregator.onrender.com`

### Testing Render Deployment
```bash
# Health check
curl https://your-app.onrender.com/api/health

# Get tokens
curl https://your-app.onrender.com/api/tokens
```

## Option 2: Deploy to Railway.app

Railway offers:
- $5 free credit/month
- Excellent for Node.js apps
- Built-in Redis support

### Steps:

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize Project**
```bash
railway init
railway add # Select Redis
```

3. **Configure Environment**
```bash
railway variables set PORT=3000
railway variables set CACHE_TTL=30
railway variables set NODE_ENV=production
# REDIS_URL is automatically set by Railway
```

4. **Deploy**
```bash
railway up
railway open
```

## Option 3: Deploy to Fly.io

Fly.io offers:
- Free tier with generous limits
- Global edge deployment
- Built-in Redis support

### Steps:

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
fly auth signup
```

2. **Create fly.toml**
```toml
app = "meme-coin-aggregator"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

3. **Create Redis**
```bash
fly redis create
# Note the connection URL
```

4. **Deploy**
```bash
fly launch
fly secrets set REDIS_URL="<your-redis-url>"
fly deploy
```

## Option 4: Deploy with Docker

### Using Docker Compose (Easiest)

1. **Build and run**
```bash
docker-compose up -d
```

2. **Check status**
```bash
docker-compose ps
docker-compose logs -f app
```

3. **Access app**
   - API: http://localhost:3000
   - Demo: http://localhost:3000/demo.html

### Manual Docker Deployment

1. **Build image**
```bash
docker build -t meme-coin-aggregator .
```

2. **Run Redis**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

3. **Run app**
```bash
docker run -d \
  --name meme-coin-app \
  -p 3000:3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  meme-coin-aggregator
```

## Option 5: Deploy to VPS (DigitalOcean, AWS EC2, etc.)

### Requirements
- Ubuntu 22.04 or similar
- Root or sudo access
- Domain name (optional)

### Setup Script

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PM2
sudo npm install -g pm2

# Clone and setup app
cd /var/www
git clone <your-repo-url> meme-coin-aggregator
cd meme-coin-aggregator

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
REDIS_URL=redis://localhost:6379
CACHE_TTL=30
RATE_LIMIT_MAX_REQUESTS=250
RATE_LIMIT_WINDOW_MS=60000
WS_UPDATE_INTERVAL=5000
NODE_ENV=production
EOF

# Build
npm run build

# Start with PM2
pm2 start npm --name "meme-coin-api" -- start
pm2 save
pm2 startup

# Setup Nginx (optional)
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/meme-coin << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/meme-coin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Certbot (optional)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### PM2 Commands
```bash
# View logs
pm2 logs meme-coin-api

# Restart
pm2 restart meme-coin-api

# Stop
pm2 stop meme-coin-api

# Monitor
pm2 monit
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port | 3000 | No |
| REDIS_URL | Redis connection URL | redis://localhost:6379 | Yes |
| CACHE_TTL | Cache TTL in seconds | 30 | No |
| RATE_LIMIT_MAX_REQUESTS | Max API requests per window | 250 | No |
| RATE_LIMIT_WINDOW_MS | Rate limit window in ms | 60000 | No |
| WS_UPDATE_INTERVAL | WebSocket update interval (ms) | 5000 | No |
| NODE_ENV | Environment | development | No |

## Post-Deployment Checklist

- [ ] Health check endpoint responds: `/api/health`
- [ ] Tokens endpoint returns data: `/api/tokens`
- [ ] WebSocket connection works
- [ ] Demo page loads: `/demo.html`
- [ ] Redis connection is active
- [ ] Logs show no errors
- [ ] Performance is acceptable (response < 2s)
- [ ] SSL certificate is valid (if using HTTPS)

## Monitoring

### Health Checks
```bash
# Basic health
curl https://your-app.com/api/health

# Check response time
time curl https://your-app.com/api/tokens

# WebSocket test (using wscat)
npm install -g wscat
wscat -c wss://your-app.com
```

### Log Monitoring
```bash
# If using PM2
pm2 logs --lines 100

# If using Docker
docker logs -f meme-coin-app

# If using systemd
journalctl -u meme-coin-api -f
```

## Troubleshooting

### Redis Connection Issues
```bash
# Test Redis locally
redis-cli ping

# Check Redis logs
sudo journalctl -u redis -n 50
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Memory Issues
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## Performance Optimization

### Production Settings
```env
NODE_ENV=production
CACHE_TTL=60  # Increase cache time
WS_UPDATE_INTERVAL=10000  # Reduce update frequency
```

### Nginx Caching
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/tokens {
    proxy_cache api_cache;
    proxy_cache_valid 200 30s;
    proxy_pass http://localhost:3000;
}
```

## Scaling

### Horizontal Scaling
1. Deploy multiple instances
2. Use load balancer (Nginx, HAProxy)
3. Shared Redis instance
4. Sticky sessions for WebSocket

### Vertical Scaling
1. Increase server resources
2. Optimize Redis memory
3. Enable Redis persistence
4. Use connection pooling

## Support

For issues, please open a GitHub issue or contact support.

