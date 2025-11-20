#!/bin/bash

# Meme Coin Aggregator - Quick Setup Script
# This script helps you get started quickly

set -e

echo "🚀 Meme Coin Aggregator - Setup Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check Redis
echo ""
echo "Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis CLI not found${NC}"
    echo "Redis is required but not detected."
    echo ""
    echo "Install Redis:"
    echo "  macOS:   brew install redis"
    echo "  Linux:   sudo apt-get install redis-server"
    echo "  Docker:  docker run -d -p 6379:6379 redis:alpine"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is installed but not running${NC}"
        echo "Start Redis with: redis-server"
        echo ""
        read -p "Do you want to continue? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Install dependencies
echo ""
echo "Installing npm dependencies..."
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo "Edit .env if you need to change default settings"
else
    echo ""
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
fi

# Build TypeScript
echo ""
echo "Building TypeScript..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Run tests
echo ""
read -p "Do you want to run tests? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running tests..."
    if npm test; then
        echo -e "${GREEN}✅ All tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    fi
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure Redis is running:"
echo "   redis-server"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:3000/demo.html"
echo ""
echo "4. Test the API:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "For more information:"
echo "  - Quick start: QUICKSTART.md"
echo "  - Full docs: README.md"
echo "  - Testing: TESTING.md"
echo "  - Deploy: DEPLOYMENT.md"
echo ""
echo "Happy coding! 🎉"

