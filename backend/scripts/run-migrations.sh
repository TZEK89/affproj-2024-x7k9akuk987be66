#!/bin/bash

# Run database migrations
# Usage: ./scripts/run-migrations.sh

echo "🚀 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📊 Running migration 001: Create users table..."
psql $DATABASE_URL -f database/migrations/001_create_users_table.sql

echo "📊 Running migration 002: Create products table..."
psql $DATABASE_URL -f database/migrations/002_create_products_table.sql

echo "📊 Running migration 003: Create product image history table..."
psql $DATABASE_URL -f database/migrations/003_create_product_image_history_table.sql

echo "✅ All migrations completed successfully!"
