/**
 * db.ts — Isolated postgres pool for the pathology-bot module.
 * Reuses DATABASE_URL but is a completely separate pool instance
 * from the main app's PrismaClient, ensuring zero coupling.
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const botPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // small dedicated pool for the bot
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

botPool.on('error', (err) => {
  console.error('[pathology-bot] Unexpected pool error:', err);
});
