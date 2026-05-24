'use strict';

/**
 * DB INIT — Fixes column types and ensures all tables exist
 * Converts ENUM columns to TEXT for Prisma String compatibility
 */
const initDatabase = async (db) => {
  try {
    console.log('[DB INIT] Running database initialization...');

    // Fix ENUM columns that may exist from old migration
    // Convert all ENUM type columns to TEXT
    const enumFixes = [
      // Users table
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT`,
      `ALTER TABLE "users" ALTER COLUMN "verificationTier" TYPE TEXT`,
      // Properties
      `ALTER TABLE "properties" ALTER COLUMN "propertyType" TYPE TEXT`,
      `ALTER TABLE "properties" ALTER COLUMN "listingType" TYPE TEXT`,
      `ALTER TABLE "properties" ALTER COLUMN "status" TYPE TEXT`,
      // Transactions
      `ALTER TABLE "transactions" ALTER COLUMN "status" TYPE TEXT`,
      // Escrow
      `ALTER TABLE "escrows" ALTER COLUMN "status" TYPE TEXT`,
      `ALTER TABLE "escrows" ALTER COLUMN "multiSigStatus" TYPE TEXT`,
      // Others
      `ALTER TABLE "split_receipts" ALTER COLUMN "status" TYPE TEXT`,
      `ALTER TABLE "chat_messages" ALTER COLUMN "messageType" TYPE TEXT`,
      `ALTER TABLE "disputes" ALTER COLUMN "status" TYPE TEXT`,
      `ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE TEXT`,
    ];

    let fixed = 0;
    for (const sql of enumFixes) {
      try {
        await db.$executeRawUnsafe(sql);
        fixed++;
      } catch (e) {
        // Ignore - column might already be TEXT or table might not exist
      }
    }
    
    if (fixed > 0) {
      console.log(`[DB INIT] ✅ Fixed ${fixed} ENUM columns to TEXT`);
    }

    // Ensure all tables exist
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `;

    if (tables.length === 0) {
      console.log('[DB INIT] Creating tables from migration SQL...');
      const fs = require('fs');
      const path = require('path');
      const sqlFile = path.join(__dirname, '../prisma/migrations/20260520000001_full_schema/migration.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      const statements = sql.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 5 && !s.startsWith('--'));
      
      for (const stmt of statements) {
        try {
          await db.$executeRawUnsafe(stmt + ';');
        } catch (e) {
          if (!e.message.includes('already exists')) {
            console.warn('[DB INIT] Warning:', e.message.substring(0, 60));
          }
        }
      }
      console.log('[DB INIT] ✅ Tables created');
    }

    console.log('[DB INIT] ✅ Database ready');
  } catch (error) {
    console.error('[DB INIT] Error:', error.message.substring(0, 100));
  }
};

module.exports = { initDatabase };
