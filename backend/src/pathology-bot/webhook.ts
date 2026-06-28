/**
 * webhook.ts — Express router for the pathology-bot WhatsApp webhook.
 *
 * Routes:
 *   GET  /pathology-bot/webhook  →  Meta webhook verification challenge
 *   POST /pathology-bot/webhook  →  Incoming WhatsApp messages
 *
 * Mount in main app (ONE LINE — see README):
 *   app.use('/pathology-bot', pathologyBotRouter);
 *
 * Required env vars:
 *   WHATSAPP_VERIFY_TOKEN     — any secret string you set in Meta console
 *   WHATSAPP_PHONE_NUMBER_ID  — from Meta Developer Console
 *   WHATSAPP_ACCESS_TOKEN     — user access token (dev) or system user token (prod)
 *   SERVER_BASE_URL           — public URL of this server (for QR image links)
 */
import { Router, Request, Response } from 'express';
import type { WAWebhookPayload, WAIncomingMessage } from './types';
import { getOrCreateSession } from './services/sessionService';
import { handleMessage } from './services/stateMachine';

const router = Router();

// ── Webhook Verification (GET) ────────────────────────────────────────────────
router.get('/webhook', (req: Request, res: Response) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[pathology-bot] Webhook verified successfully.');
    res.status(200).send(challenge);
  } else {
    console.warn('[pathology-bot] Webhook verification failed. Check WHATSAPP_VERIFY_TOKEN.');
    res.sendStatus(403);
  }
});

// ── Incoming Messages (POST) ──────────────────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  console.log('[pathology-bot] Webhook POST received. Body:', JSON.stringify(req.body, null, 2));
  
  // Always respond 200 immediately — Meta will retry if we don't
  res.sendStatus(200);

  const body = req.body as WAWebhookPayload;
  if (body.object !== 'whatsapp_business_account') {
    console.log('[pathology-bot] Ignoring non-whatsapp_business_account object:', body.object);
    return;
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const messages: WAIncomingMessage[] = value.messages ?? [];

      console.log(`[pathology-bot] Processing ${messages.length} messages...`);

      for (const message of messages) {
        const phone = message.from; // WhatsApp number in E.164 format

        // Skip unsupported message types (stickers, reactions, etc.)
        const supportedTypes = new Set(['text', 'interactive', 'location', 'image', 'document']);
        if (!supportedTypes.has(message.type)) {
          console.log(`[pathology-bot] Skipping unsupported message type: ${message.type} from ${phone}`);
          continue;
        }

        try {
          console.log(`[pathology-bot] Message from ${phone}: type=${message.type}, text="${message.text?.body ?? ''}"`);
          const currentSession = await getOrCreateSession(phone);
          console.log(`[pathology-bot] Loaded session for ${phone}. State: ${currentSession.current_state}`);
          await handleMessage(currentSession, message);
          console.log(`[pathology-bot] Message processed successfully for ${phone}`);
        } catch (err) {
          console.error(`[pathology-bot] Error processing message from ${phone}:`, err);
          // Don't crash the server — errors are per-session, not global
        }
      }
    }
  }
});

// ── Health check for this module ──────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    module: 'pathology-bot',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
