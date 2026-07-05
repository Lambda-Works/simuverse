#!/bin/sh

echo "🔧 Generating Prisma client..."
npx prisma generate || { echo "❌ Prisma generate failed"; exit 1; }

echo "📦 Applying pending migrations..."
npx prisma migrate deploy || echo "⚠️  Migration deploy skipped (may have failed migrations — run 'prisma migrate resolve')"

echo "👁️  Starting Prisma file watcher..."
node scripts/watch-prisma.js &

echo "🚀 Starting NestJS in watch mode..."
CHOKIDAR_USEPOLLING=true npx nest start --watch
