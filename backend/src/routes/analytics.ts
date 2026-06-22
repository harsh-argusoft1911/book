import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { labId } = req.query;
    
    if (!labId) {
      return res.status(400).json({ error: 'labId is required' });
    }

    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 6);

    // Stats filtered by labId
    const totalOrders = await prisma.patientOrder.count({
      where: { labId: String(labId) }
    });
    
    const totalEarningsResult = await prisma.patientOrder.aggregate({
      where: { labId: String(labId) },
      _sum: { amountPaid: true }
    });
    
    const uniquePatientsCount = await prisma.patientOrder.groupBy({
      by: ['userId'],
      where: { labId: String(labId) }
    });

    const urgentReports = await prisma.patientOrder.count({
      where: { 
        labId: String(labId),
        priority: 'HIGH', 
        status: { not: 'REPORT_GENERATED' } 
      }
    });

    // Earnings by day (Last 7 days)
    const earningsByDay = [];
    for (let i = 0; i < 7; i++) {
      const day = subDays(today, i);
      const start = startOfDay(day);
      const end = endOfDay(day);

      const dayEarnings = await prisma.patientOrder.aggregate({
        where: {
          labId: String(labId),
          createdAt: { gte: start, lte: end }
        },
        _sum: { amountPaid: true }
      });

      earningsByDay.push({
        day: format(day, 'EEE'),
        amount: dayEarnings._sum.amountPaid || 0
      });
    }

    res.json({
      stats: [
        { label: "Total Tests Booked", value: totalOrders.toLocaleString(), change: "+12.5%", trend: "up" },
        { label: "Total Earnings", value: `₹${(totalEarningsResult._sum.amountPaid || 0).toLocaleString()}`, change: "+8.2%", trend: "up" },
        { label: "Lab Patients", value: uniquePatientsCount.length.toLocaleString(), change: "+5.0%", trend: "up" },
        { label: "Urgent Reports", value: urgentReports.toString(), change: "Critical", trend: "none" },
      ],
      earningsData: earningsByDay.reverse(),
      departmentLoad: [
        { name: "Hematology", load: 75 },
        { name: "Biochemistry", load: 45 },
        { name: "Microbiology", load: 60 },
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
