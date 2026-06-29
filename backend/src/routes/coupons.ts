import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ message: 'Invalid or expired coupon code' });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Get all coupons (Admin Route)
router.get('/', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create a new coupon (Admin Route)
router.post('/', async (req, res) => {
  try {
    const { code, discountPercent, description, expiryDate } = req.body;

    if (!code || !discountPercent) {
      return res.status(400).json({ error: 'Code and discount percent are required' });
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });
    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountPercent: parseInt(discountPercent),
        description,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: true
      }
    });

    res.json(coupon);
  } catch (error) {
    console.error('Failed to create coupon:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

export default router;
