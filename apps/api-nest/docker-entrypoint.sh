#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node dist/prisma/seed.js || echo "Seed skipped (may have already run)"

echo "Starting API..."
exec node dist/main
