# Pathology Bot — WhatsApp Booking Module

A self-contained WhatsApp chatbot for lab test bookings. Built on the **WhatsApp Cloud API (Meta)** with a stateful conversation engine, fuzzy test matching, geolocation-based lab search, and QR booking confirmations.

---

## Folder Structure

```
backend/src/pathology-bot/
├── webhook.ts                     # Express router (single entry point)
├── types.ts                       # All TypeScript types for this module
├── db.ts                          # Isolated pg Pool (no Prisma coupling)
├── migrations/
│   ├── 001_create_pathology_bot_tables.sql
│   ├── 001_rollback_pathology_bot_tables.sql
│   └── migrate.ts                 # Migration runner script
├── services/
│   ├── sessionService.ts          # Read/write pathology_sessions
│   ├── stateMachine.ts            # Core conversation state machine
│   ├── testMatcherService.ts      # Fuzzy test name matching (Fuse.js)
│   ├── geoService.ts              # Haversine nearest-lab finder
│   ├── bookingService.ts          # Booking creation + report lookup
│   ├── qrService.ts               # QR code generation (qrcode npm)
│   └── whatsappSender.ts          # WhatsApp Cloud API message sender
└── tests/
    └── testMatcher.test.ts        # Offline unit tests for fuzzy matcher
```

**New isolated DB tables:**
`pathology_sessions`, `pathology_tests`, `pathology_labs`, `pathology_lab_pricing`, `pathology_bookings`, `pathology_reports`

---

## Conversation Flow

```
User: "hi"
  → Main Menu (Book a Test / Get Reports)

Book a Test:
  → User types test names (e.g. "cbc, thyroid, lft")
  → Fuzzy matcher confirms or asks for clarification
  → Bot asks for location (WhatsApp location share)
  → Finds 5 nearest labs with pricing
  → User selects a lab from an interactive list
  → Booking created, QR code sent

Get Reports:
  → Looks up latest report by phone number
  → Sends PDF URL or returns to menu
```

---

## One-Line Integration (Main App)

The module is already registered in `src/index.ts`. It is **disabled by default** and only activates when `PATHOLOGY_BOT_ENABLED=true` is set:

```typescript
// src/index.ts (already done — no action needed)
import pathologyBotRouter from './pathology-bot/webhook';

if (process.env.PATHOLOGY_BOT_ENABLED === 'true') {
  app.use('/pathology-bot', pathologyBotRouter);
}
```

### To enable:
```env
# .env
PATHOLOGY_BOT_ENABLED=true
```

### To roll back (disable without any code changes):
```env
PATHOLOGY_BOT_ENABLED=false
```

---

## Setup Steps

### 1. Run DB Migration
```bash
npm run bot:migrate
```

To roll back all bot tables (safe — does not touch existing tables):
```bash
npm run bot:rollback
```

### 2. Configure Environment Variables
Fill in `.env`:
```env
PATHOLOGY_BOT_ENABLED=true
WHATSAPP_PHONE_NUMBER_ID=<from Meta Developer Console>
WHATSAPP_ACCESS_TOKEN=<your system user or dev token>
WHATSAPP_VERIFY_TOKEN=pathology_bot_secret_2024
SERVER_BASE_URL=https://your-ngrok-url.io   # must be a public HTTPS URL
```

### 3. Meta Developer Console Setup
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an App → Add **WhatsApp** product
3. Under *WhatsApp → Configuration*, set:
   - **Webhook URL**: `https://your-domain.com/pathology-bot/webhook`
   - **Verify Token**: same value as `WHATSAPP_VERIFY_TOKEN` in `.env`
4. Subscribe to: `messages`
5. Copy **Phone Number ID** and **Access Token** into `.env`

### 4. Local Testing with ngrok
```bash
# Terminal 1: start the server
npm run dev

# Terminal 2: expose port 5000
ngrok http 5000

# Use the ngrok HTTPS URL as SERVER_BASE_URL and Meta webhook URL
```

---

## Run Unit Tests
```bash
npm run bot:test
```
Tests run **offline** with a mock catalog — no DB or WhatsApp credentials needed.

---

## Adding New Tests to the Catalog
```sql
INSERT INTO pathology_tests (canonical_name, aliases, category)
VALUES ('Iron Studies', '["serum iron","iron panel","tibc","ferritin"]', 'Haematology');
```

## Adding Labs and Pricing
```sql
-- Add a lab
INSERT INTO pathology_labs (name, address, lat, lng, nabl)
VALUES ('City Health Lab', '123 Main St, Mumbai', 19.0760, 72.8777, true);

-- Add pricing (get lab id from the row above)
INSERT INTO pathology_lab_pricing (lab_id, test_id, price)
VALUES (1, 1, 350.00),  -- CBC at ₹350
       (1, 2, 450.00);  -- LFT at ₹450
```

## Adding Reports (for "Get Reports" flow)
```sql
INSERT INTO pathology_reports (phone_number, pdf_url, booking_ref)
VALUES ('919876543210', 'http://your-server.com/uploads/report-123.pdf', 'BK-WA-1001');
```
> **Note:** Phone numbers must be in E.164 format without `+` (e.g. `919876543210` for `+91 98765 43210`).

---

## Swapping in UPI Payment Later
The QR payload is currently:
```
PATHOLOGY_BOOKING|ref=BK-WA-1001|amount=750.00|lab_id=3
```
To switch to UPI deep-link, change `qrData` in `services/bookingService.ts`:
```typescript
// Before (placeholder):
const qrData = `PATHOLOGY_BOOKING|ref=${bookingRef}|amount=${...}|lab_id=${...}`;

// After (UPI):
const qrData = `upi://pay?pa=merchant@upi&pn=BookMyPathology&am=${amount}&tn=${bookingRef}`;
```
No other changes needed in the QR service or webhook.

---

## Rollback Checklist
| Step | Command / Action |
|------|-----------------|
| Disable webhook routes | Set `PATHOLOGY_BOT_ENABLED=false` in `.env`, restart server |
| Remove DB tables | `npm run bot:rollback` |
| Unregister Meta webhook | Delete webhook in Meta Developer Console |
| Remove module code | Delete `src/pathology-bot/` folder |
| Remove route registration | Delete the 6-line block in `src/index.ts` |
