#!/bin/bash

# MSM FEPEI 360 - Setup Script for MySQL/MariaDB + TypeORM Migration
# This script initializes the database and seeds initial data

set -e

echo "🚀 MSM FEPEI 360 - Database Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your database credentials${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# Check MySQL/MariaDB connection
echo "Checking database connection..."
DB_HOST=$(grep "^DB_HOST" .env | cut -d= -f2 | tr -d ' ')
DB_USER=$(grep "^DB_USER" .env | cut -d= -f2 | tr -d ' ')
DB_PASSWORD=$(grep "^DB_PASSWORD" .env | cut -d= -f2 | tr -d ' ')
DB_NAME=$(grep "^DB_NAME" .env | cut -d= -f2 | tr -d ' ')
DB_PORT=$(grep "^DB_PORT" .env | cut -d= -f2 | tr -d ' ')

# Default port if not specified
DB_PORT=${DB_PORT:-3306}

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Try to connect to database (requires mysql client)
if command -v mysql &> /dev/null; then
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "Please ensure MySQL/MariaDB is running and credentials are correct"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  mysql client not found, skipping connection check${NC}"
fi

# Create database if it doesn't exist
echo "Creating database if not exists..."
if command -v mysql &> /dev/null; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo -e "${GREEN}✅ Database created or already exists${NC}"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Run migrations
echo ""
echo "Running database migrations..."
npm run build

# Run TypeORM migrations
if command -v npx &> /dev/null; then
    npx typeorm migration:run -d src/database/connection.ts
    echo -e "${GREEN}✅ Migrations completed${NC}"
fi

# Seed database
echo ""
echo "Seeding database with initial data..."
npm run seed
echo -e "${GREEN}✅ Database seeded${NC}"

# Build TypeScript
echo ""
echo "Building TypeScript..."
npm run build
echo -e "${GREEN}✅ Build completed${NC}"

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env with your actual credentials"
echo "2. Start the server: npm run dev"
echo "3. The API will be available at: http://localhost:5000"
echo ""
echo "Default test user created:"
echo "  Email: admin@msm-fepei.com"
echo "  Password: <check .env or seed file>"
echo "  Role: admin"
