import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Search patient by phone
router.get('/search/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const patient = await prisma.patient.findFirst({
      where: { phone }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Create new patient (for walk-in)
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const { email, phone } = data;

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const patient = await prisma.patient.create({
      data: {
        ...data,
        password: data.password || 'walkin123', // Default password for walk-ins
      }
    });
    res.json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Get patient stats (for dashboard)
router.get('/:patientId/stats', async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { name: true }
    });

    const orders = await prisma.patientOrder.findMany({
      where: { userId: patientId },
      include: { tests: true, lab: true },
      orderBy: { appointmentDate: 'asc' }
    });

    // Active = not yet COMPLETED
    const activeOrdersCount = orders.filter(
      o => o.status !== 'COMPLETED'
    ).length;

    // Total spending = sum of all amountPaid across all orders
    const totalSpending = orders.reduce((sum, o) => sum + o.amountPaid, 0);

    // Reward points = 10% of total spending (recalculated live from orders)
    const rewardPoints = Math.floor(totalSpending * 0.10);

    // Sync the recalculated points back to the patient record
    await prisma.patient.update({
      where: { id: patientId },
      data: { rewardPoints }
    });

    // Savings = lab discounts (based on lab.discount %) + reward points rupee value
    const discountSavings = orders.reduce((sum, o) => {
      const discountPct = o.lab?.discount || 0;
      const originalPrice = o.amountPaid / (1 - discountPct / 100);
      return sum + (originalPrice - o.amountPaid);
    }, 0);
    const pointsValue = rewardPoints * 0.5;
    const totalSaved = Math.floor(discountSavings + pointsValue);

    // Last completed test info
    const lastCompleted = orders.filter(o => o.status === 'COMPLETED').pop();
    const lastTestName = lastCompleted?.tests?.[0]?.name || 'None';
    const lastTestDate = lastCompleted
      ? lastCompleted.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      : 'N/A';

    // Recent earnings history (per order, what points were earned)
    const recentEarnings = orders.map(o => ({
      bookingId: o.bookingId,
      pointsEarned: Math.floor(o.amountPaid * 0.10),
      amountPaid: o.amountPaid,
      status: o.status,
      reason: `Booking ${o.bookingId} — Test completed`,
      date: o.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }));

    // Get real Health Score from latest AI Insight
    const latestInsight = await prisma.aIInsight.findFirst({
      where: {
        order: {
          userId: patientId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const healthScore = latestInsight 
      ? `${(latestInsight.insightData as any).overallHealthScore}/100`
      : "N/A";

    const healthTip = latestInsight
      ? (latestInsight.insightData as any).oneLineTip || "Your health metrics are being monitored. Keep up the good work!"
      : "Personalized insights based on your diagnostic history are being calculated. Check back soon for AI-driven health optimization.";

    res.json({
      activeBookings: activeOrdersCount.toString().padStart(2, '0'),
      totalSpending: `₹${totalSpending.toLocaleString()}`,
      totalOrders: orders.length,
      lastTest: lastTestName,
      lastTestDate,
      healthScore,
      spendingSubtext: `${orders.length} Total Orders`,
      rewardPoints,
      totalSaved: `₹${totalSaved.toLocaleString()}`,
      healthTip,
      patientName: patient?.name || "Patient",
      recentEarnings
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch patient stats' });
  }
});

// Get patient profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
});

// Update patient profile
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Clean up data
    if (data.dob) {
      data.dob = new Date(data.dob);
    }
    
    // Remove fields that shouldn't be updated directly via profile
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data
    });

    res.json(updatedPatient);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
});

export default router;
