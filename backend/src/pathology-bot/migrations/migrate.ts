/**
 * migrate.ts — Run pathology-bot migrations independently.
 * Reads DATABASE_URL from the root .env (same as main app).
 *
 * Usage:
 *   npx tsx src/pathology-bot/migrations/migrate.ts           (up)
 *   npx tsx src/pathology-bot/migrations/migrate.ts rollback  (down)
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const mode = process.argv[2] === 'rollback' ? 'rollback' : 'up';
  const sqlFile = mode === 'rollback'
    ? '001_rollback_pathology_bot_tables.sql'
    : '001_create_pathology_bot_tables.sql';

  const sql = fs.readFileSync(path.join(__dirname, sqlFile), 'utf8');

  console.log(`[pathology-bot] Running migration (${mode}): ${sqlFile}`);
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`[pathology-bot] Migration (${mode}) completed successfully.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('[pathology-bot] Migration failed:', err);
  process.exit(1);
});
