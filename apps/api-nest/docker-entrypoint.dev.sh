#!/bin/sh

echo "🔧 Generating Prisma client..."
npx prisma generate || { echo "❌ Prisma generate failed"; exit 1; }

echo "📦 Applying pending migrations..."
npx prisma migrate deploy || echo "⚠️  Migration deploy skipped (may have failed migrations — run 'prisma migrate resolve')"

echo "🌱 Running seeds..."
npx ts-node src/prisma/seed.ts || echo "⚠️  seed.ts skipped"
npx ts-node src/prisma/seed-companies.ts || echo "⚠️  seed-companies.ts skipped"
npx ts-node src/prisma/seed-demo.ts || echo "⚠️  seed-demo.ts skipped"
npx ts-node src/prisma/seed-demo-2.ts || echo "⚠️  seed-demo-2.ts skipped"
npx ts-node src/prisma/seed-demo-3.ts || echo "⚠️  seed-demo-3.ts skipped"
npx ts-node src/prisma/seed-review.ts || echo "⚠️  seed-review.ts skipped"

echo "👁️  Starting Prisma file watcher..."
node scripts/watch-prisma.js &

echo "🚀 Starting NestJS in watch mode..."
CHOKIDAR_USEPOLLING=true npx nest start --watch
