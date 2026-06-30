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
    const { location, days } = req.query;

    const today = startOfDay(new Date());

    // 1. Build Location Filter based on parsed city/pincode mapping
    const locationFilter: any = {};
    if (location && location !== 'All') {
      const locStr = String(location).toLowerCase();
      if (locStr === 'lucknow') {
        locationFilter.patient = {
          OR: [
            { addressLine1: { contains: 'lucknow', mode: 'insensitive' } },
            { addressLine2: { contains: 'lucknow', mode: 'insensitive' } },
            { pincode: { startsWith: '226' } }
          ]
        };
      } else if (locStr === 'noida') {
        locationFilter.patient = {
          OR: [
            { addressLine1: { contains: 'noida', mode: 'insensitive' } },
            { addressLine2: { contains: 'noida', mode: 'insensitive' } },
            { pincode: { startsWith: '2013' } }
          ]
        };
      } else if (locStr === 'delhi') {
        locationFilter.patient = {
          OR: [
            { addressLine1: { contains: 'delhi', mode: 'insensitive' } },
            { addressLine2: { contains: 'delhi', mode: 'insensitive' } },
            { pincode: { startsWith: '110' } }
          ]
        };
      } else if (locStr === 'mumbai') {
        locationFilter.patient = {
          OR: [
            { addressLine1: { contains: 'mumbai', mode: 'insensitive' } },
            { addressLine2: { contains: 'mumbai', mode: 'insensitive' } },
            { pincode: { startsWith: '400' } }
          ]
        };
      } else if (locStr === 'bangalore') {
        locationFilter.patient = {
          OR: [
            { addressLine1: { contains: 'bangalore', mode: 'insensitive' } },
            { addressLine2: { contains: 'bangalore', mode: 'insensitive' } },
            { addressLine1: { contains: 'bengaluru', mode: 'insensitive' } },
            { addressLine2: { contains: 'bengaluru', mode: 'insensitive' } },
            { pincode: { startsWith: '560' } }
          ]
        };
      } else if (locStr === 'kanpur') {
        locationFilter.patient = {
          OR: [
            { addressLine1: { contains: 'kanpur', mode: 'insensitive' } },
            { addressLine2: { contains: 'kanpur', mode: 'insensitive' } },
            { pincode: { startsWith: '208' } }
          ]
        };
      }
    }

    // 2. Build Date Filter
    const dateFilter: any = {};
    if (days && days !== 'all') {
      const numDays = parseInt(days as string);
      const startDate = startOfDay(subDays(new Date(), numDays - 1));
      dateFilter.createdAt = { gte: startDate };
    }

    const whereClause = {
      ...locationFilter,
      ...dateFilter
    };

    // Calculate core metrics
    const totalOrders = await prisma.patientOrder.count({ where: whereClause });
    const totalEarningsResult = await prisma.patientOrder.aggregate({
      where: whereClause,
      _sum: { amountPaid: true }
    });

    const patientWhereClause = locationFilter.patient || {};
    const totalPatients = await prisma.patient.count({ where: patientWhereClause });

    const labWhereClause: any = {};
    if (location && location !== 'All') {
      labWhereClause.address = { contains: String(location).toLowerCase(), mode: 'insensitive' };
    }
    const totalLabs = await prisma.lab.count({ where: labWhereClause });

    // Global earnings by day
    const earningsByDay = [];
    const chartDays = days && days !== 'all' ? parseInt(days as string) : 7;
    for (let i = 0; i < chartDays; i++) {
      const day = subDays(today, i);
      const start = startOfDay(day);
      const end = endOfDay(day);

      const dayEarnings = await prisma.patientOrder.aggregate({
        where: {
          ...locationFilter,
          createdAt: { gte: start, lte: end }
        },
        _sum: { amountPaid: true }
      });

      earningsByDay.push({
        day: format(day, chartDays > 7 ? 'dd MMM' : 'EEE'),
        amount: dayEarnings._sum.amountPaid || 0
      });
    }

    // Top labs by sales
    const labs = await prisma.lab.findMany();
    const labEarningsPromises = labs.map(async (lab) => {
      const aggregate = await prisma.patientOrder.aggregate({
        where: { 
          labId: lab.id,
          ...locationFilter,
          ...dateFilter
        },
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
    labEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Location distribution processing
    const allPatients = await prisma.patient.findMany({
      select: {
        addressLine1: true,
        addressLine2: true,
        pincode: true
      }
    });

    const getCityFromAddress = (pincode: string | null, addr1: string | null, addr2: string | null): string => {
      const addrString = `${addr1 || ''} ${addr2 || ''}`.toLowerCase();
      if (addrString.includes('lucknow') || (pincode && pincode.startsWith('226'))) return 'Lucknow';
      if (addrString.includes('noida') || (pincode && pincode.startsWith('2013'))) return 'Noida';
      if (addrString.includes('delhi') || (pincode && pincode.startsWith('110'))) return 'Delhi';
      if (addrString.includes('mumbai') || (pincode && pincode.startsWith('400'))) return 'Mumbai';
      if (addrString.includes('bangalore') || addrString.includes('bengaluru') || (pincode && pincode.startsWith('560'))) return 'Bangalore';
      if (addrString.includes('kanpur') || (pincode && pincode.startsWith('208'))) return 'Kanpur';
      if (pincode) return `PIN ${pincode}`;
      return 'Other/Remote';
    };

    const cityCounts: { [city: string]: number } = {};
    const pincodeCounts: { [pincode: string]: number } = {};

    allPatients.forEach(p => {
      const city = getCityFromAddress(p.pincode, p.addressLine1, p.addressLine2);
      cityCounts[city] = (cityCounts[city] || 0) + 1;
      if (p.pincode) {
        pincodeCounts[p.pincode] = (pincodeCounts[p.pincode] || 0) + 1;
      }
    });

    const locationStats = Object.entries(cityCounts).map(([city, count]) => ({
      city,
      count
    })).sort((a, b) => b.count - a.count);

    const pincodeStats = Object.entries(pincodeCounts).map(([pincode, count]) => ({
      pincode,
      count
    })).sort((a, b) => b.count - a.count).slice(0, 8);

    // Order status counts
    const statusCounts = await prisma.patientOrder.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true }
    });

    const orderStatusStats = statusCounts.map(item => ({
      status: item.status,
      count: item._count.id
    }));

    // Recent 5 bookings
    const recentOrders = await prisma.patientOrder.findMany({
      where: whereClause,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        lab: {
          select: {
            name: true
          }
        }
      }
    });

    const recentBookings = recentOrders.map(order => ({
      id: order.id,
      bookingId: order.bookingId,
      patientName: order.patient.name,
      patientPhone: order.patient.phone,
      labName: order.lab?.name || 'N/A',
      status: order.status,
      amountPaid: order.amountPaid,
      appointmentDate: order.appointmentDate,
      createdAt: order.createdAt
    }));

    res.json({
      stats: [
        { label: "Global Bookings", value: totalOrders.toLocaleString(), change: "+14.2%", trend: "up" },
        { label: "Gross Revenue", value: `₹${(totalEarningsResult._sum.amountPaid || 0).toLocaleString()}`, change: "+11.5%", trend: "up" },
        { label: "Total Patients", value: totalPatients.toLocaleString(), change: "+6.8%", trend: "up" },
        { label: "Active Partner Labs", value: totalLabs.toLocaleString(), change: "+2 new", trend: "up" }
      ],
      earningsData: earningsByDay.reverse(),
      topLabs: labEarnings,
      locationStats,
      pincodeStats,
      orderStatusStats,
      recentBookings
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
