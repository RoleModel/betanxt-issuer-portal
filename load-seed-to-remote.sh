#!/bin/bash

# Script to load seed data to remote Supabase via MCP
# This reads the seed.sql file and processes it

echo "Starting seed data load to remote..."

# Get the Supabase connection string
echo "Please provide your Supabase connection string (will be hidden):"
echo "Format: postgresql://postgres.[project-ref]:[password]@aws-x-region.pooler.supabase.com:5432/postgres"
read -s DB_URL

# Use psql to load the seed file directly
echo "Loading seed data..."
PGPASSWORD="${DB_URL##*:}" psql "$DB_URL" -f supabase/seed.sql

if [ $? -eq 0 ]; then
    echo "✅ Seed data loaded successfully!"
else
    echo "❌ Error loading seed data"
    exit 1
fi
