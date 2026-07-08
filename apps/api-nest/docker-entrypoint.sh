#!/bin/sh
set -e

# Fix permissions on mounted volume (Docker creates named volumes as root)
mkdir -p /app/apps/api-nest/uploads
chown -R nestjs:nodejs /app/apps/api-nest/uploads

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting API..."
exec su-exec nestjs node dist/main
