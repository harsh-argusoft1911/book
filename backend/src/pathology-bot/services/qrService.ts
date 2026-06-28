/**
 * qrService.ts — Generates a QR code as a base64 PNG data URL.
 *
 * Currently encodes booking reference + amount as plain text.
 * To swap in a UPI deep-link or payment URL:
 *   replace `qrData` in bookingService with: `upi://pay?pa=...&am=...&tn=BOOKINGREF`
 * No other changes needed here.
 */
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

const QR_DIR = path.join(process.cwd(), 'uploads', 'qr');

/** Ensure the QR output directory exists. */
function ensureDir(): void {
  if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });
}

/**
 * Generate a QR code PNG and save it to /uploads/qr/<bookingRef>.png
 * Returns the public URL path.
 *
 * @param qrData      The string to encode (booking ref, UPI string, etc.)
 * @param bookingRef  Used as the filename
 * @param baseUrl     Your server's base URL (e.g. https://your-ngrok.io)
 */
export async function generateBookingQR(
  qrData: string,
  bookingRef: string,
  baseUrl: string
): Promise<string> {
  ensureDir();
  const fileName = `${bookingRef}.png`;
  const filePath = path.join(QR_DIR, fileName);

  await QRCode.toFile(filePath, qrData, {
    errorCorrectionLevel: 'M',
    width: 400,
    margin: 2,
  });

  return `${baseUrl}/uploads/qr/${fileName}`;
}

/**
 * Generate a QR code as a base64 data URL (for direct embedding in messages if needed).
 */
export async function generateQRDataURL(qrData: string): Promise<string> {
  return QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    width: 400,
    margin: 2,
  });
}
