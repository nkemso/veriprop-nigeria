'use strict';

const fs = require('fs');
const path = require('path');

const initDatabase = async (db) => {
  try {
    console.log('[DB INIT] Checking if database needs initialization...');
    
    // Check if users table exists
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;
    
    if (tables.length > 0) {
      console.log('[DB INIT] ✅ Database already initialized');
      return;
    }
    
    console.log('[DB INIT] Running initial schema creation...');
    
    // Read migration SQL
    const sqlFile = path.join(__dirname, '../prisma/migrations/20260520000001_full_schema/migration.sql');
    let sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split into individual statements and run each
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let success = 0;
    let failed = 0;
    
    for (const stmt of statements) {
      try {
        await db.$executeRawUnsafe(stmt + ';');
        success++;
      } catch (e) {
        // Ignore "already exists" errors
        if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
          console.warn('[DB INIT] Statement warning:', e.message.substring(0, 80));
          failed++;
        }
      }
    }
    
    console.log(`[DB INIT] ✅ Schema created: ${success} statements OK, ${failed} warnings`);
    
    // Mark migration as done in prisma migrations table
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
          id VARCHAR(36) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          finished_at TIMESTAMPTZ,
          migration_name VARCHAR(255) NOT NULL,
          logs TEXT,
          rolled_back_at TIMESTAMPTZ,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          applied_steps_count INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (id)
        );
      `);
      await db.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
        VALUES ('1', 'manual', NOW(), '20260520000001_full_schema', 1)
        ON CONFLICT DO NOTHING;
      `);
    } catch(e) { /* ignore */ }
    
  } catch (error) {
    console.error('[DB INIT] Error:', error.message);
  }
};

module.exports = { initDatabase };
