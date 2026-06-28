/**
 * sessionService.ts — CRUD for pathology_sessions table.
 * Keyed by phone number. Handles the persistent state machine.
 */
import { botPool } from '../db';
import type { PathologySession, SessionState, SessionContext } from '../types';

/** Fetch or create a session for a phone number. */
export async function getOrCreateSession(phone: string): Promise<PathologySession> {
  const existing = await botPool.query<PathologySession>(
    `SELECT * FROM pathology_sessions WHERE phone_number = $1 LIMIT 1`,
    [phone]
  );
  const existingRow = existing.rows[0];
  if (existingRow !== undefined) return existingRow;

  const created = await botPool.query<PathologySession>(
    `INSERT INTO pathology_sessions (phone_number, current_state, context_json)
     VALUES ($1, 'IDLE', '{}')
     RETURNING *`,
    [phone]
  );
  const createdRow = created.rows[0];
  if (!createdRow) throw new Error(`[pathology-bot] Failed to create session for ${phone}`);
  return createdRow;
}

/** Update session state and/or context atomically. */
export async function updateSession(
  phone: string,
  state: SessionState,
  context: SessionContext
): Promise<void> {
  await botPool.query(
    `UPDATE pathology_sessions
     SET current_state = $1,
         context_json  = $2,
         updated_at    = NOW()
     WHERE phone_number = $3`,
    [state, JSON.stringify(context), phone]
  );
}

/** Reset session back to IDLE (conversation ended). */
export async function resetSession(phone: string): Promise<void> {
  await botPool.query(
    `UPDATE pathology_sessions
     SET current_state = 'IDLE', context_json = '{}', updated_at = NOW()
     WHERE phone_number = $1`,
    [phone]
  );
}

/** Delete session row entirely (use resetSession instead for normal flows). */
export async function deleteSession(phone: string): Promise<void> {
  await botPool.query(
    `DELETE FROM pathology_sessions WHERE phone_number = $1`,
    [phone]
  );
}
