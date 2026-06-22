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

export default router;
