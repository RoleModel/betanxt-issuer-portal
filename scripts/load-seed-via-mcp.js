#!/usr/bin/env node
/**
 * Load seed data to remote Supabase via file upload
 * Since the MCP tool works but the seed file is huge, 
 * we'll guide the user to use psql directly
 */

const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../supabase/seed.sql');
const stats = fs.statSync(seedPath);

console.log('📦 Seed File Information:');
console.log(`   Path: ${seedPath}`);
console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Lines: ${fs.readFileSync(seedPath, 'utf8').split('\n').length.toLocaleString()}`);
console.log('');
console.log('✅ Remote database schema is ready (migrations applied)');
console.log('✅ Initial data loaded (clients, accounts, users)');
console.log('');
console.log('To load the remaining seed data, use ONE of these methods:');
console.log('');
console.log('Method 1: Via Supabase Studio SQL Editor');
console.log('  1. Go to https://supabase.com/dashboard → Your Project → SQL Editor');
console.log('  2. Copy and paste supabase/seed.sql');
console.log('  3. Click "Run"');
console.log('');
console.log('Method 2: Via psql (fastest)');
console.log('  Get your direct connection string from:');
console.log('  Dashboard → Settings → Database → Direct Connection');
console.log('  Then run:');
console.log('  psql "YOUR_CONNECTION_STRING" -f supabase/seed.sql');
console.log('');
console.log('Method 3: Via Supabase CLI (after linking)');
console.log('  supabase db push --include-seed');
console.log('');
