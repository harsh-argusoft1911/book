// ============================================================
// types.ts — All TypeScript interfaces for the pathology-bot module
// ============================================================

export type SessionState =
  | 'IDLE'
  | 'AWAITING_MENU_CHOICE'
  | 'AWAITING_TEST_INPUT'
  | 'AWAITING_TEST_CLARIFY'
  | 'AWAITING_LOCATION'
  | 'AWAITING_LAB_SELECTION'
  | 'BOOKING_CONFIRMED';

export interface SessionContext {
  selectedTests?: MatchedTest[];    // tests confirmed by the user
  pendingInput?: string;            // raw user text when clarification is needed
  unmatchedSegments?: string[];     // segments that didn't match any test
  nearbyLabs?: NearbyLab[];         // top-5 labs after location share
  selectedLab?: NearbyLab;         // lab chosen by the user
}

export interface PathologySession {
  id: number;
  phone_number: string;
  current_state: SessionState;
  context_json: SessionContext;
  updated_at: Date;
  created_at: Date;
}

export interface PathologyTest {
  id: number;
  canonical_name: string;
  aliases: string[];
  category: string | null;
}

export interface MatchedTest {
  id: number;
  canonical_name: string;
  score: number; // 0–1 similarity score
}

export interface PathologyLab {
  id: number;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  nabl: boolean;
}

export interface NearbyLab extends PathologyLab {
  distance_km: number;   // haversine distance from user
  total_price: number;   // sum of selected test prices at this lab
  missing_tests: string[]; // canonical names of tests this lab doesn't price
}

export interface PathologyBooking {
  id: number;
  booking_ref: string;
  phone_number: string;
  test_ids: number[];
  lab_id: number | null;
  total_amount: number;
  payment_mode: string;
  status: string;
  qr_data: string | null;
  created_at: Date;
}

// ---- WhatsApp Cloud API message shapes (outbound) ----

export interface WATextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string; preview_url?: boolean };
}

export interface WAButtonMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button';
    body: { text: string };
    action: {
      buttons: Array<{ type: 'reply'; reply: { id: string; title: string } }>;
    };
  };
}

export interface WAListMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'list';
    body: { text: string };
    action: {
      button: string;
      sections: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
    };
  };
}

export interface WALocationRequestMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'location_request_message';
    body: { text: string };
    action: { name: 'send_location' };
  };
}

export interface WAImageMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image';
  image: { link: string; caption?: string };
}

export type WAOutboundMessage =
  | WATextMessage
  | WAButtonMessage
  | WAListMessage
  | WALocationRequestMessage
  | WAImageMessage;

// ---- Incoming webhook payload shapes ----

export interface WAIncomingMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'location' | 'image' | 'document' | 'audio' | 'video';
  text?: { body: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface WAWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: 'whatsapp';
      metadata: { display_phone_number: string; phone_number_id: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: WAIncomingMessage[];
    };
    field: string;
  }>;
}

export interface WAWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WAWebhookEntry[];
}
