import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Signup - Step 1: Name & Email
router.post('/signup/step1', async (req, res) => {
  try {
    const { name, email } = req.body;
    // We don't create the user yet, just return success or check if email exists
    const existing = await prisma.patient.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Full Signup
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
      weight
    } = req.body;

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
        age: parseInt(age) || null,
        gender,
        height: parseFloat(height) || null,
        weight: parseFloat(weight) || null
      }
    });

    res.json({ ...patient, role: 'patient' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
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
