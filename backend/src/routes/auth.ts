import express from 'express';
import { PrismaClient } from '@prisma/client';
import { otpStore } from '../utils/otpStore';
import { sendEmailOTP, sendSMSOTP } from '../utils/notification';

const router = express.Router();
const prisma = new PrismaClient();

// Helper validation functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

// Signup - Step 1: Name & Email Validation
router.post('/signup/step1', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const existing = await prisma.patient.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Signup step 1 error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup - Send OTP
router.post('/signup/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required to send verification code' });
    }
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }

    const existingEmail = await prisma.patient.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

    const existingPhone = await prisma.patient.findUnique({ where: { phone } });
    if (existingPhone) return res.status(400).json({ error: 'Phone number already registered' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (valid for 5 minutes)
    const otpKey = `signup:${email}`;
    otpStore.set(otpKey, otp, 5 * 60 * 1000);

    // Send OTP via Email and SMS
    const emailSent = await sendEmailOTP(email, otp);
    const smsSent = await sendSMSOTP(phone, otp);

    res.json({ 
      success: true, 
      message: 'Verification code sent to your email and phone number',
      emailSent,
      smsSent
    });
  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Full Signup with OTP Verification
router.post('/signup', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password,
      addressLine1,
      addressLine2,
      pincode,
      dob,
      age,
      gender,
      height,
      weight,
      otp
    } = req.body;

    // Backend validations
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (pincode && !isValidPincode(pincode)) {
      return res.status(400).json({ error: 'Pincode must be exactly 6 digits' });
    }
    if (age) {
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
        return res.status(400).json({ error: 'Age must be a valid number between 1 and 120' });
      }
    }
    if (height) {
      const parsedHeight = parseFloat(height);
      if (isNaN(parsedHeight) || parsedHeight <= 30 || parsedHeight > 250) {
        return res.status(400).json({ error: 'Height must be between 30 and 250 cm' });
      }
    }
    if (weight) {
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 2 || parsedWeight > 300) {
        return res.status(400).json({ error: 'Weight must be between 2 and 300 kg' });
      }
    }

    // Verify OTP
    if (!otp) {
      return res.status(400).json({ error: 'Verification code (OTP) is required' });
    }
    const otpKey = `signup:${email}`;
    const isValid = otpStore.verify(otpKey, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Check unique constraints again
    const existingEmail = await prisma.patient.findUnique({ where: { email } });
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

    const existingPhone = await prisma.patient.findUnique({ where: { phone } });
    if (existingPhone) return res.status(400).json({ error: 'Phone number already registered' });

    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        password, // In real app, hash this
        addressLine1,
        addressLine2,
        pincode,
        dob: dob ? new Date(dob) : null,
        age: age ? parseInt(age) : null,
        gender,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null
      }
    });

    res.json({ ...patient, role: 'patient' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Forgot Password - Step 1: Send OTP (Only for patients)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) {
      return res.status(404).json({ error: 'No patient account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory (valid for 5 minutes)
    const otpKey = `forgot:${email}`;
    otpStore.set(otpKey, otp, 5 * 60 * 1000);

    // Send OTP via Email and SMS
    const emailSent = await sendEmailOTP(email, otp);
    let smsSent = false;
    if (patient.phone) {
      smsSent = await sendSMSOTP(patient.phone, otp);
    }

    res.json({
      success: true,
      message: 'Reset code sent to your email and phone',
      emailSent,
      smsSent
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
});

// Forgot Password - Step 2: Verify OTP and Reset Password (Only for patients)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!otp) {
      return res.status(400).json({ error: 'Verification code is required' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify OTP
    const otpKey = `forgot:${email}`;
    const isValid = otpStore.verify(otpKey, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { email } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient account not found' });
    }

    // Update patient password
    await prisma.patient.update({
      where: { email },
      data: { password: newPassword }
    });

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check for admin credentials first
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    if (phone === adminPhone && password === adminPassword) {
      return res.json({ id: 'admin', name: 'Super Admin', phone: adminPhone, role: 'admin' });
    }

    const patient = await prisma.patient.findUnique({
      where: { phone }
    });

    if (!patient || patient.password !== password) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    res.json({ ...patient, role: 'patient' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Lab Login
router.post('/lab/login', async (req, res) => {
  try {
    const { labId, password } = req.body;
    const lab = await prisma.lab.findUnique({
      where: { id: labId }
    });

    if (!lab || lab.password !== password) {
      return res.status(401).json({ error: 'Invalid Lab ID or password' });
    }

    res.json({ ...lab, role: 'lab' });
  } catch (error) {
    res.status(500).json({ error: 'Lab login failed' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const adminPhone = process.env.ADMIN_PHONE || '9999999999';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

    if (phone !== adminPhone || password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid admin phone number or password' });
    }

    res.json({ id: 'admin', name: 'Super Admin', phone: adminPhone, role: 'admin' });
  } catch (error) {
    res.status(500).json({ error: 'Admin login failed' });
  }
});

export default router;
