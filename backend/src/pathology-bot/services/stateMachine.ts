/**
 * stateMachine.ts — The core conversation state machine.
 *
 * Each incoming WhatsApp message is routed here AFTER the session is loaded.
 * The machine pattern:
 *   currentState + incomingMessage → nextState + outbound reply
 *
 * Escape hatch: "menu", "restart", "hi", "hello", "start" always returns
 * the user to AWAITING_MENU_CHOICE regardless of current state.
 */
import type { PathologySession, WAIncomingMessage, MatchedTest, NearbyLab } from '../types';
import * as session from './sessionService';
import * as sender from './whatsappSender';
import * as matcher from './testMatcherService';
import * as geo from './geoService';
import * as booking from './bookingService';
import * as qr from './qrService';

const RESTART_TRIGGERS = new Set(['hi', 'hello', 'hey', 'menu', 'restart', 'start', 'hii', 'helo']);

function isRestartTrigger(text: string): boolean {
  return RESTART_TRIGGERS.has(text.trim().toLowerCase());
}

function getServerBaseUrl(): string {
  return process.env.SERVER_BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}`;
}

/** Entry point — called from the webhook handler for each message. */
export async function handleMessage(
  currentSession: PathologySession,
  message: WAIncomingMessage
): Promise<void> {
  const phone = currentSession.phone_number;
  const state = currentSession.current_state;
  const ctx = currentSession.context_json ?? {};

  const messageText =
    message.text?.body?.trim() ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    '';

  const messageId =
    message.interactive?.button_reply?.id ??
    message.interactive?.list_reply?.id ??
    messageText;

  // ── Global escape hatch ────────────────────────────────────────────────────
  if (state === 'IDLE' || isRestartTrigger(messageText)) {
    await session.updateSession(phone, 'AWAITING_MENU_CHOICE', {});
    await sender.sendMainMenu(phone);
    return;
  }

  // ── State router ───────────────────────────────────────────────────────────
  switch (state) {

    // ──────────────────────────────────────────────────────────────────────────
    case 'AWAITING_MENU_CHOICE': {
      if (messageId === 'BOOK_TEST' || messageText === '1') {
        await session.updateSession(phone, 'AWAITING_TEST_INPUT', {});
        await sender.sendText(
          phone,
          '🧬 *Book a Test*\n\nPlease type the name(s) of the test(s) you\'d like to book.\n\nExamples:\n• _CBC_\n• _liver function test, thyroid_\n• _complete blood count and sugar test_'
        );
      } else if (messageId === 'GET_REPORTS' || messageText === '2') {
        await handleGetReports(phone);
      } else {
        // User typed something unrecognised — re-prompt
        await sender.sendMainMenu(phone);
      }
      break;
    }

    // ──────────────────────────────────────────────────────────────────────────
    case 'AWAITING_TEST_INPUT': {
      if (!messageText) {
        await sender.sendText(phone, 'Please type the test name(s), e.g. "CBC, thyroid".');
        break;
      }

      const { matched, unmatched } = await matcher.matchTests(messageText);

      if (matched.length === 0 && unmatched.length > 0) {
        // Nothing matched at all
        await session.updateSession(phone, 'AWAITING_TEST_INPUT', ctx);
        await sender.sendText(
          phone,
          `😕 Sorry, I couldn't recognise any tests from: *"${messageText}"*\n\n` +
          `Please try again with standard names like:\n• CBC\n• LFT\n• Thyroid Profile\n• Blood Sugar Fasting`
        );
        break;
      }

      if (unmatched.length > 0) {
        // Partial match — confirm matched ones, ask about the rest
        const matchedNames = matched.map(t => t.canonical_name).join(', ');
        const unmatchedList = unmatched.map(u => `• _"${u}"_`).join('\n');
        await session.updateSession(phone, 'AWAITING_TEST_CLARIFY', {
          ...ctx,
          selectedTests: matched,
          unmatchedSegments: unmatched,
        });
        await sender.sendText(
          phone,
          `✅ I found: *${matchedNames}*\n\n` +
          `❓ But I couldn't recognise:\n${unmatchedList}\n\n` +
          `Please clarify those tests, or reply *"skip"* to proceed with only the matched ones.`
        );
        break;
      }

      // All matched — confirm and move to location
      await proceedToLocation(phone, matched, ctx);
      break;
    }

    // ──────────────────────────────────────────────────────────────────────────
    case 'AWAITING_TEST_CLARIFY': {
      const existingTests: MatchedTest[] = ctx.selectedTests ?? [];
      const unmatched: string[] = ctx.unmatchedSegments ?? [];

      if (messageText.toLowerCase() === 'skip') {
        // Proceed with what we already have
        if (existingTests.length === 0) {
          await session.updateSession(phone, 'AWAITING_TEST_INPUT', {});
          await sender.sendText(phone, 'No tests selected. Please start over and type the test(s) you want.');
          break;
        }
        await proceedToLocation(phone, existingTests, ctx);
        break;
      }

      // Try to match the clarification text
      const { matched: newMatched, unmatched: stillUnmatched } = await matcher.matchTests(messageText);

      const allMatched = [...existingTests, ...newMatched];
      const seenIds = new Set(allMatched.map(t => t.id));
      const dedupedMatched = allMatched.filter((t, idx) => {
        if (seenIds.has(t.id) && allMatched.findIndex(x => x.id === t.id) !== idx) return false;
        return true;
      });

      if (stillUnmatched.length > 0) {
        // Still some unmatched
        const matchedNames = dedupedMatched.map(t => t.canonical_name).join(', ');
        const unmatchedList = stillUnmatched.map(u => `• _"${u}"_`).join('\n');
        await session.updateSession(phone, 'AWAITING_TEST_CLARIFY', {
          ...ctx,
          selectedTests: dedupedMatched,
          unmatchedSegments: stillUnmatched,
        });
        await sender.sendText(
          phone,
          `✅ Tests so far: *${matchedNames}*\n\n` +
          `❓ Still couldn't recognise:\n${unmatchedList}\n\n` +
          `Please clarify, or reply *"skip"* to continue with confirmed tests only.`
        );
      } else {
        await proceedToLocation(phone, dedupedMatched, ctx);
      }
      break;
    }

    // ──────────────────────────────────────────────────────────────────────────
    case 'AWAITING_LOCATION': {
      if (message.type !== 'location' || !message.location) {
        // User sent text instead of location
        await sender.sendLocationRequest(phone);
        break;
      }

      const { latitude, longitude } = message.location;
      const selectedTests: MatchedTest[] = ctx.selectedTests ?? [];
      const testIds = selectedTests.map(t => t.id);

      await sender.sendText(phone, '📍 Location received! Finding the nearest labs...');

      const nearbyLabs = await geo.findNearbyLabs(latitude, longitude, testIds);

      if (nearbyLabs.length === 0) {
        await sender.sendText(
          phone,
          '😔 Sorry, we couldn\'t find any labs within 50 km of your location.\nPlease contact us directly for assistance.'
        );
        await session.resetSession(phone);
        break;
      }

      await session.updateSession(phone, 'AWAITING_LAB_SELECTION', {
        ...ctx,
        nearbyLabs,
      });
      await sender.sendLabsList(phone, nearbyLabs);
      break;
    }

    // ──────────────────────────────────────────────────────────────────────────
    case 'AWAITING_LAB_SELECTION': {
      const nearbyLabs: NearbyLab[] = ctx.nearbyLabs ?? [];
      const selectedTests: MatchedTest[] = ctx.selectedTests ?? [];

      let chosenLab: NearbyLab | undefined;

      // Interactive list reply: id is "LAB_<id>"
      if (messageId.startsWith('LAB_')) {
        const labId = parseInt(messageId.replace('LAB_', ''), 10);
        chosenLab = nearbyLabs.find(l => l.id === labId);
      }

      // Fallback: user typed a number (1–5)
      if (!chosenLab) {
        const idx = parseInt(messageText, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= nearbyLabs.length) {
          chosenLab = nearbyLabs[idx - 1];
        }
      }

      if (!chosenLab) {
        await sender.sendText(
          phone,
          'Please select a lab from the list above, or type a number (1–5).'
        );
        await sender.sendLabsList(phone, nearbyLabs);
        break;
      }

      // Warn about missing tests before confirming
      if (chosenLab.missing_tests.length > 0) {
        await sender.sendText(
          phone,
          `⚠️ Note: *${chosenLab.name}* does not offer:\n` +
          chosenLab.missing_tests.map(t => `• ${t}`).join('\n') +
          `\n\nYou will be charged ₹${chosenLab.total_price.toFixed(0)} for the available tests.`
        );
      }

      // Create booking
      const newBooking = await booking.createBooking({
        phone,
        tests: selectedTests,
        lab: chosenLab,
      });

      // Generate QR
      const baseUrl = getServerBaseUrl();
      let qrImageUrl = `${baseUrl}/uploads/qr/${newBooking.booking_ref}.png`;
      try {
        qrImageUrl = await qr.generateBookingQR(newBooking.qr_data!, newBooking.booking_ref, baseUrl);
      } catch (qrErr) {
        console.error('[pathology-bot] QR generation error:', qrErr);
        // qrImageUrl remains as a fallback URL string
      }

      await session.updateSession(phone, 'BOOKING_CONFIRMED', { selectedLab: chosenLab });

      await sender.sendBookingConfirmation(
        phone,
        newBooking.booking_ref,
        chosenLab.name,
        selectedTests,
        chosenLab.total_price,
        qrImageUrl
      );

      // Reset so user can start a new conversation
      await session.resetSession(phone);
      break;
    }

    // ──────────────────────────────────────────────────────────────────────────
    case 'BOOKING_CONFIRMED': {
      // Edge case: user messages after confirmation (session should have been reset)
      await session.updateSession(phone, 'AWAITING_MENU_CHOICE', {});
      await sender.sendMainMenu(phone);
      break;
    }

    // ──────────────────────────────────────────────────────────────────────────
    default: {
      // Unknown state — reset gracefully
      await session.updateSession(phone, 'AWAITING_MENU_CHOICE', {});
      await sender.sendMainMenu(phone);
    }
  }
}

// ─── Sub-flow helpers ──────────────────────────────────────────────────────────

async function handleGetReports(phone: string): Promise<void> {
  const report = await booking.getLatestReport(phone);

  if (!report) {
    await sender.sendButtons(
      phone,
      "We couldn't find any reports linked to this number. 😔\n\nWould you like to book a test instead?",
      [{ id: 'BOOK_TEST', title: '🧬 Book a Test' }]
    );
    await session.updateSession(phone, 'AWAITING_MENU_CHOICE', {});
    return;
  }

  // Send report PDF as a document
  try {
    await sender.sendText(
      phone,
      `📄 Here is your latest report:\n${report.pdf_url}\n\nThank you for choosing Book My Pathology! 🙏`
    );
  } catch (err) {
    await sender.sendText(phone, `Your report is available at: ${report.pdf_url}`);
  }

  await session.resetSession(phone);
}

async function proceedToLocation(
  phone: string,
  tests: MatchedTest[],
  existingCtx: any
): Promise<void> {
  const testList = tests.map(t => `• ${t.canonical_name}`).join('\n');
  await sender.sendText(
    phone,
    `✅ *Tests selected:*\n${testList}\n\nNow please share your location so we can find the nearest labs 📍`
  );
  await session.updateSession(phone, 'AWAITING_LOCATION', {
    ...existingCtx,
    selectedTests: tests,
    unmatchedSegments: undefined,
  });
  await sender.sendLocationRequest(phone);
}
