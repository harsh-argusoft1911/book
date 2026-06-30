import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Email configuration
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'BookMyPathology <noreply@example.com>';

let emailTransporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  emailTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

// Twilio configuration
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: any = null;
if (twilioSid && twilioToken) {
  twilioClient = twilio(twilioSid, twilioToken);
}

/**
 * Send an OTP code to a patient's email.
 */
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: 'Your BookMyPathology Verification Code',
    text: `Your 6-digit verification code is: ${otp}. This code is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; text-align: center; margin-bottom: 24px;">BookMyPathology</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Use the following 6-digit verification code to complete your request. This code is valid for 5 minutes:</p>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">If you did not request this code, you can safely ignore this email.</p>
      </div>
    `
  };

  if (emailTransporter) {
    try {
      await emailTransporter.sendMail(mailOptions);
      console.log(`[EMAIL] OTP ${otp} successfully sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`[EMAIL] Failed to send OTP to ${email}:`, error);
      return false;
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[DEV FALLBACK] EMAIL OTP FOR ${email}: ${otp}`);
    console.log(`======================================================\n`);
    return true;
  }
}

/**
 * Send an OTP code to a patient's phone number.
 */
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  // Normalize phone number (ensure country code, e.g. +91 for India if not present and starts with 10 digits)
  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.length === 10) {
      formattedPhone = '+91' + formattedPhone;
    } else {
      formattedPhone = '+' + formattedPhone;
    }
  }

  if (twilioClient && twilioPhone) {
    try {
      await twilioClient.messages.create({
        body: `Your BookMyPathology verification code is: ${otp}. Valid for 5 minutes.`,
        from: twilioPhone,
        to: formattedPhone
      });
      console.log(`[SMS] OTP ${otp} successfully sent to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error(`[SMS] Failed to send OTP to ${formattedPhone}:`, error);
      return false;
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[DEV FALLBACK] SMS OTP FOR ${formattedPhone}: ${otp}`);
    console.log(`======================================================\n`);
    return true;
  }
}
