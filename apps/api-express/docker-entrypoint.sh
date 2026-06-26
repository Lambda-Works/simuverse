#!/bin/sh
set -e

echo "Running database migrations..."
npx typeorm migration:run -d dist/database/connection.js

echo "Starting API..."
exec node dist/server.js
