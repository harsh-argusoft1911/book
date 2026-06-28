#!/usr/bin/env bash
# =============================================================
# test_bot.sh — Simulate a full WhatsApp conversation via curl
#
# Usage:
#   chmod +x test_bot.sh
#   ./test_bot.sh
#
# The server must be running: cd backend && npm run dev
# Watch the SERVER TERMINAL — bot replies print there in simulation mode.
# =============================================================

BASE="http://localhost:5000/pathology-bot/webhook"
PHONE="919876543210"   # fake phone number — change if you like

# Colour helpers
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

send() {
  local label="$1"
  local body="$2"
  echo -e "\n${CYAN}▶ Sending:${NC} ${YELLOW}${label}${NC}"
  curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
    -X POST "$BASE" \
    -H "Content-Type: application/json" \
    -d "$body"
  sleep 0.8   # small pause so server logs stay readable
}

# ── Helpers to build WhatsApp webhook payloads ─────────────────────────────────

text_msg() {
  local text="$1"
  cat <<JSON
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "ENTRY1",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "1234567890", "phone_number_id": "PHONEID" },
        "contacts": [{ "profile": { "name": "Test User" }, "wa_id": "${PHONE}" }],
        "messages": [{
          "id": "MSG$(date +%s%N)",
          "from": "${PHONE}",
          "timestamp": "$(date +%s)",
          "type": "text",
          "text": { "body": "${text}" }
        }]
      }
    }]
  }]
}
JSON
}

button_reply() {
  local id="$1"
  local title="$2"
  cat <<JSON
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "ENTRY1",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "1234567890", "phone_number_id": "PHONEID" },
        "contacts": [{ "profile": { "name": "Test User" }, "wa_id": "${PHONE}" }],
        "messages": [{
          "id": "MSG$(date +%s%N)",
          "from": "${PHONE}",
          "timestamp": "$(date +%s)",
          "type": "interactive",
          "interactive": {
            "type": "button_reply",
            "button_reply": { "id": "${id}", "title": "${title}" }
          }
        }]
      }
    }]
  }]
}
JSON
}

list_reply() {
  local id="$1"
  local title="$2"
  cat <<JSON
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "ENTRY1",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "1234567890", "phone_number_id": "PHONEID" },
        "contacts": [{ "profile": { "name": "Test User" }, "wa_id": "${PHONE}" }],
        "messages": [{
          "id": "MSG$(date +%s%N)",
          "from": "${PHONE}",
          "timestamp": "$(date +%s)",
          "type": "interactive",
          "interactive": {
            "type": "list_reply",
            "list_reply": { "id": "${id}", "title": "${title}" }
          }
        }]
      }
    }]
  }]
}
JSON
}

location_msg() {
  local lat="$1"
  local lng="$2"
  cat <<JSON
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "ENTRY1",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "1234567890", "phone_number_id": "PHONEID" },
        "contacts": [{ "profile": { "name": "Test User" }, "wa_id": "${PHONE}" }],
        "messages": [{
          "id": "MSG$(date +%s%N)",
          "from": "${PHONE}",
          "timestamp": "$(date +%s)",
          "type": "location",
          "location": { "latitude": ${lat}, "longitude": ${lng}, "name": "My Location" }
        }]
      }
    }]
  }]
}
JSON
}

# ══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Pathology Bot — Full Conversation Simulation  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "  Phone: ${PHONE}"
echo -e "  Watch the SERVER TERMINAL for bot replies\n"
echo -e "  ${YELLOW}STEP 1: User says 'hi' → expect main menu${NC}"
# ══════════════════════════════════════════════════════════════

send "hi" "$(text_msg 'hi')"

echo -e "\n  ${YELLOW}STEP 2: User taps 'Book a Test' button${NC}"
send "BOOK_TEST button" "$(button_reply 'BOOK_TEST' 'Book a Test')"

echo -e "\n  ${YELLOW}STEP 3: User types test names (free text)${NC}"
send "cbc and lft" "$(text_msg 'cbc and lft')"

echo -e "\n  ${YELLOW}STEP 4: User shares GPS location (Mumbai coords)${NC}"
send "location: Mumbai" "$(location_msg 19.0760 72.8777)"

echo -e "\n  ${YELLOW}STEP 5: User picks lab from list (lab id=1)${NC}"
send "LAB_1 selection" "$(list_reply 'LAB_1' 'Metropolis Lab - Andheri')"

echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Flow complete! Check server logs above.       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}\n"

echo -e "\n${CYAN}── Bonus: test partial match (only 1 of 2 tests recognised) ──${NC}"
send "cbc and faketest" "$(text_msg 'cbc and faketest')"
echo -e "  ${YELLOW}→ Bot should ask to clarify 'faketest', not drop it silently${NC}"

echo -e "\n${CYAN}── Bonus: test restart mid-flow (say 'menu' at any point) ──${NC}"
send "menu" "$(text_msg 'menu')"
echo -e "  ${YELLOW}→ Bot should reset to main menu regardless of state${NC}"

echo -e "\n${CYAN}── Bonus: test 'Get Reports' path ──${NC}"
send "GET_REPORTS button" "$(button_reply 'GET_REPORTS' 'Get My Reports')"
echo -e "  ${YELLOW}→ No report seeded for this number, so bot offers to book instead${NC}"

echo ""
