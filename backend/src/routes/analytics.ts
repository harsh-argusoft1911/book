import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

router.get('/labs-map', async (req, res) => {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const labs = await prisma.lab.findMany();

    const labsWithStats = await Promise.all(labs.map(async (lab) => {
      const todayOrders = await prisma.patientOrder.count({
        where: { labId: lab.id, createdAt: { gte: todayStart, lte: todayEnd } }
      });
      const todayRevenue = await prisma.patientOrder.aggregate({
        where: { labId: lab.id, createdAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amountPaid: true }
      });
      const totalRevenue = await prisma.patientOrder.aggregate({
        where: { labId: lab.id },
        _sum: { amountPaid: true }
      });
      const totalBookings = await prisma.patientOrder.count({
        where: { labId: lab.id }
      });

      return {
        id: lab.id,
        name: lab.name,
        address: lab.address,
        lat: lab.lat,
        lng: lab.lng,
        rating: lab.rating,
        nabl: lab.nabl,
        homeCollection: lab.homeCollection,
        discount: lab.discount,
        todayBookings: todayOrders,
        todayRevenue: todayRevenue._sum.amountPaid || 0,
        totalRevenue: totalRevenue._sum.amountPaid || 0,
        totalBookings,
      };
    }));

    res.json(labsWithStats);
  } catch (error) {
    console.error('Labs map data failed:', error);
    res.status(500).json({ error: 'Failed to fetch labs map data' });
  }
});

router.get('/admin', async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const totalOrders = await prisma.patientOrder.count();
    const totalEarningsResult = await prisma.patientOrder.aggregate({
      _sum: { amountPaid: true }
    });
    const totalPatients = await prisma.patient.count();
    const totalLabs = await prisma.lab.count();

    // Global earnings by day (Last 7 days)
    const earningsByDay = [];
    for (let i = 0; i < 7; i++) {
      const day = subDays(today, i);
      const start = startOfDay(day);
      const end = endOfDay(day);

      const dayEarnings = await prisma.patientOrder.aggregate({
        where: {
          createdAt: { gte: start, lte: end }
        },
        _sum: { amountPaid: true }
      });

      earningsByDay.push({
        day: format(day, 'EEE'),
        amount: dayEarnings._sum.amountPaid || 0
      });
    }

    // Top labs by sales
    const labs = await prisma.lab.findMany();
    const labEarningsPromises = labs.map(async (lab) => {
      const aggregate = await prisma.patientOrder.aggregate({
        where: { labId: lab.id },
        _sum: { amountPaid: true },
        _count: { id: true }
      });
      return {
        id: lab.id,
        name: lab.name,
        totalEarnings: aggregate._sum.amountPaid || 0,
        bookingCount: aggregate._count.id || 0,
        rating: lab.rating,
        address: lab.address
      };
    });
    const labEarnings = await Promise.all(labEarningsPromises);
    // Sort by earnings descending
    labEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings);

    res.json({
      stats: [
        { label: "Global Bookings", value: totalOrders.toLocaleString(), change: "+14.2%", trend: "up" },
        { label: "Gross Revenue", value: `₹${(totalEarningsResult._sum.amountPaid || 0).toLocaleString()}`, change: "+11.5%", trend: "up" },
        { label: "Total Patients", value: totalPatients.toLocaleString(), change: "+6.8%", trend: "up" },
        { label: "Active Partner Labs", value: totalLabs.toLocaleString(), change: "+2 new", trend: "up" }
      ],
      earningsData: earningsByDay.reverse(),
      topLabs: labEarnings
    });
  } catch (error) {
    console.error('Admin analytics failed:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

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
