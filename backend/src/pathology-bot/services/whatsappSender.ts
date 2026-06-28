/**
 * whatsappSender.ts — Thin wrapper around the WhatsApp Cloud API (Meta).
 * Sends outbound messages using the Graph API v20.0.
 *
 * Required env vars (add to .env):
 *   WHATSAPP_PHONE_NUMBER_ID   — from Meta Developer Console
 *   WHATSAPP_ACCESS_TOKEN      — temporary (dev) or permanent (system user) token
 *   SERVER_BASE_URL            — public URL of this server (for QR image links)
 */
import axios from 'axios';
import type {
  WAOutboundMessage,
  WAButtonMessage,
  WAListMessage,
  WALocationRequestMessage,
  NearbyLab,
  MatchedTest,
} from '../types';

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

/** Returns true when running without real WA credentials (local dev / testing). */
function isSimulationMode(): boolean {
  return !process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN;
}

/** Pretty-print an outbound message to console during simulation mode. */
function simulationLog(payload: WAOutboundMessage): void {
  const border = '─'.repeat(60);
  console.log(`\n╔${border}╗`);
  console.log(`║  📲 BOT → ${payload.to}`);
  console.log(`╠${border}╣`);

  if (payload.type === 'text') {
    payload.text.body.split('\n').forEach(line => console.log(`║  ${line}`));
  } else if (payload.type === 'interactive') {
    const ia = payload.interactive;
    if (ia.type === 'button') {
      ia.body.text.split('\n').forEach(line => console.log(`║  ${line}`));
      console.log(`║`);
      ia.action.buttons.forEach((b, i) =>
        console.log(`║  [${i + 1}] ${b.reply.title}  (id: ${b.reply.id})`)
      );
    } else if (ia.type === 'list') {
      ia.body.text.split('\n').forEach(line => console.log(`║  ${line}`));
      console.log(`║`);
      ia.action.sections.forEach(sec => {
        console.log(`║  ── ${sec.title} ──`);
        sec.rows.forEach((r, i) =>
          console.log(`║  [${i + 1}] ${r.title}${r.description ? `  — ${r.description}` : ''}  (id: ${r.id})`)
        );
      });
    } else if (ia.type === 'location_request_message') {
      console.log(`║  📍 [Location request button shown to user]`);
    }
  } else if (payload.type === 'image') {
    console.log(`║  🖼  Image: ${payload.image.link}`);
    if (payload.image.caption) console.log(`║     Caption: ${payload.image.caption}`);
  }

  console.log(`╚${border}╝\n`);
}

/** Core send function — falls back to console logging when credentials are absent. */
async function send(payload: WAOutboundMessage): Promise<void> {
  if (isSimulationMode()) {
    simulationLog(payload);
    return;
  }
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  try {
    await axios.post(
      `${GRAPH_BASE}/${phoneNumberId}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    const detail = err?.response?.data ?? err.message;
    console.error('[pathology-bot] WhatsApp send error:', JSON.stringify(detail, null, 2));
    throw err;
  }
}

/** Plain text message. */
export async function sendText(to: string, body: string): Promise<void> {
  await send({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  });
}

/**
 * Send a button message (max 3 buttons).
 * Falls back to a numbered text list if more than 3 options are passed.
 */
export async function sendButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  if (buttons.length > 3) {
    // Fallback: numbered text list
    const lines = buttons.map((b, i) => `${i + 1}. ${b.title}`);
    await sendText(to, `${bodyText}\n\n${lines.join('\n')}\n\nReply with the number of your choice.`);
    return;
  }

  const payload: WAButtonMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
      },
    },
  };
  await send(payload);
}

/**
 * Send a scrollable list message (max 10 rows total per Meta spec).
 */
export async function sendList(
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
): Promise<void> {
  // Check total rows
  const totalRows = sections.reduce((sum, s) => sum + s.rows.length, 0);
  if (totalRows > 10) {
    // Fallback: truncate + text
    const lines: string[] = [];
    let i = 1;
    for (const section of sections) {
      for (const row of section.rows) {
        lines.push(`${i}. ${row.title}${row.description ? ` — ${row.description}` : ''}`);
        i++;
        if (i > 10) break;
      }
    }
    await sendText(to, `${bodyText}\n\n${lines.join('\n')}\n\nReply with the number of your choice.`);
    return;
  }

  const payload: WAListMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: { button: buttonLabel, sections },
    },
  };
  await send(payload);
}

/** Request location from the user (interactive location_request_message). */
export async function sendLocationRequest(to: string): Promise<void> {
  const payload: WALocationRequestMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'location_request_message',
      body: { text: 'Please share your location so we can find the nearest labs for you 📍' },
      action: { name: 'send_location' },
    },
  };
  await send(payload);
}

/** Send an image (QR code) by public URL. */
export async function sendImage(to: string, imageUrl: string, caption: string): Promise<void> {
  await send({
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: { link: imageUrl, caption },
  });
}

// ─── High-level composer helpers ──────────────────────────────────────────────

/** Send the main menu (Book a Test / Get Reports). */
export async function sendMainMenu(to: string): Promise<void> {
  await sendButtons(to, 'Hello! Welcome to *Book My Pathology* 🧪\n\nHow can we help you today?', [
    { id: 'BOOK_TEST', title: '🧬 Book a Test' },
    { id: 'GET_REPORTS', title: '📄 Get My Reports' },
  ]);
}

/** Send the nearby labs as an interactive list. */
export async function sendLabsList(to: string, labs: NearbyLab[]): Promise<void> {
  if (labs.length === 0) {
    await sendText(
      to,
      'Sorry, we couldn\'t find any labs within 50 km of your location. 😔\nPlease contact us directly for assistance.'
    );
    return;
  }

  const rows = labs.map((lab, i) => ({
    id: `LAB_${lab.id}`,
    title: lab.name.slice(0, 24), // Meta list row title max 24 chars
    description: `${lab.distance_km} km • ₹${lab.total_price.toFixed(0)}${lab.missing_tests.length > 0 ? ' ⚠️ partial' : ''}`,
  }));

  await sendList(
    to,
    '🏥 *Nearest Labs*\nSelect a lab to confirm your booking:',
    'Choose Lab',
    [{ title: 'Available Labs', rows }]
  );
}

/** Send booking confirmation text + QR image. */
export async function sendBookingConfirmation(
  to: string,
  bookingRef: string,
  labName: string,
  tests: MatchedTest[],
  totalAmount: number,
  qrImageUrl: string
): Promise<void> {
  const testList = tests.map(t => `• ${t.canonical_name}`).join('\n');
  const confirmText =
    `✅ *Booking Confirmed!*\n\n` +
    `*Booking ID:* ${bookingRef}\n` +
    `*Lab:* ${labName}\n` +
    `*Tests:*\n${testList}\n\n` +
    `*Total Amount:* ₹${totalAmount.toFixed(0)}\n` +
    `*Payment:* Pay on Delivery 💵\n\n` +
    `Please show the QR code below to the lab staff upon arrival.`;

  await sendText(to, confirmText);

  // Send QR image
  try {
    await sendImage(to, qrImageUrl, `QR Code — ${bookingRef} | ₹${totalAmount.toFixed(0)}`);
  } catch (_) {
    // If image send fails (e.g. localhost URL not public), notify user gracefully
    await sendText(to, `Your booking QR code is ready. Reference: ${bookingRef}`);
  }
}
