#!/bin/bash
# Phase 3 - Quick Start Script
# Run this to get Phase 3 up and running quickly

set -e

echo "🚀 Phase 3 - SimuVerse Quick Start"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Node.js
echo -e "${BLUE}Step 1: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js >= 16"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 3: Environment setup
echo -e "${BLUE}Step 3: Setting up environment...${NC}"
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env and add your API keys:${NC}"
    echo "   - VITE_GEMINI_API_KEY (required for LLM)"
    echo "   - Other optional variables"
    echo ""
    read -p "Press Enter after updating .env file..."
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

# Step 4: Run development server
echo -e "${BLUE}Step 4: Starting development server...${NC}"
echo -e "${YELLOW}The app will open at http://localhost:5173${NC}"
echo ""
echo "📝 Available commands:"
echo "   npm run dev          - Start dev server"
echo "   npm run build        - Build for production"
echo "   npm run cypress:open - Open Cypress UI"
echo "   npm run cypress:e2e  - Run all tests"
echo "   npm run test:llm     - Run LLM tests"
echo "   npm run test:certificate - Run certificate tests"
echo "   npm run test:pwa     - Run PWA tests"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Starting development server in 5 seconds..."
sleep 5

npm run dev
