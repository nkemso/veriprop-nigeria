#!/bin/sh
set -e

echo "=== VeriProp Nigeria Startup ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Run migrations
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy
echo "Migrations complete"

# Start server
echo "Starting server..."
exec node backend/server.js
