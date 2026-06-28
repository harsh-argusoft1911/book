/**
 * bookingService.ts — Creates bookings in pathology_bookings and
 * fetches reports from pathology_reports.
 */
import { botPool } from '../db';
import type { PathologyBooking, MatchedTest, NearbyLab } from '../types';

/** Generate a booking reference like BK-WA-1001 */
async function generateBookingRef(): Promise<string> {
  const result = await botPool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM pathology_bookings`
  );
  const row = result.rows[0];
  const count = row ? parseInt(row.count, 10) : 0;
  return `BK-WA-${1001 + count}`;
}

export interface CreateBookingInput {
  phone: string;
  tests: MatchedTest[];
  lab: NearbyLab;
}

/**
 * Create a confirmed booking.
 * Returns the new booking record.
 */
export async function createBooking(input: CreateBookingInput): Promise<PathologyBooking> {
  const { phone, tests, lab } = input;
  const bookingRef = await generateBookingRef();
  const testIds = tests.map(t => t.id);

  // QR payload — placeholder for UPI/payment link; structured for easy swap later:
  // Format: "PATHOLOGY_BOOKING|ref=BK-WA-1001|amount=750.00|lab_id=3"
  const qrData = `PATHOLOGY_BOOKING|ref=${bookingRef}|amount=${lab.total_price.toFixed(2)}|lab_id=${lab.id}`;

  const result = await botPool.query<PathologyBooking>(
    `INSERT INTO pathology_bookings
       (booking_ref, phone_number, test_ids, lab_id, total_amount, payment_mode, status, qr_data)
     VALUES ($1, $2, $3, $4, $5, 'pay_on_delivery', 'confirmed', $6)
     RETURNING *`,
    [
      bookingRef,
      phone,
      JSON.stringify(testIds),
      lab.id,
      lab.total_price,
      qrData,
    ]
  );

  const row = result.rows[0];
  if (!row) throw new Error(`[pathology-bot] Failed to create booking for ${phone}`);
  return row;
}

/**
 * Get the most recent report for a phone number.
 * Returns { pdf_url, booking_ref } or null if not found.
 */
export async function getLatestReport(phone: string): Promise<{ pdf_url: string; booking_ref: string | null } | null> {
  const result = await botPool.query<{ pdf_url: string; booking_ref: string | null }>(
    `SELECT pdf_url, booking_ref
     FROM pathology_reports
     WHERE phone_number = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone]
  );
  return result.rows[0] ?? null;
}
