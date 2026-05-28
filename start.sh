#!/bin/sh

echo "=== VeriProp Nigeria Startup ==="
echo "Node version: $(node --version)"

# Run migrations — continue even if they fail (tables may already exist)
echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy 2>&1 || echo "Migration warning (non-fatal) — continuing startup"
echo "Startup continuing..."

# Start server
echo "Starting server..."
exec node backend/server.js
