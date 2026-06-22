import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Multer setup – save PDFs to /uploads with unique filenames
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `report-${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, fileFilter: (_req, file, cb) => {
  cb(null, file.mimetype === 'application/pdf');
}});

// Get all orders (optionally for a specific patient)
router.get('/', async (req, res) => {
  try {
    const { patientId, labId } = req.query;
    const where: any = {};
    if (patientId) {
      where.OR = [
        { userId: String(patientId) },
        { bookedById: String(patientId) }
      ];
    }
    if (labId) where.labId = String(labId);

    const orders = await prisma.patientOrder.findMany({
      where,
      include: {
        patient: true,
        tests: true,
        lab: true,
        aiInsight: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { patientId, bookedById, labId, testIds, timeSlot, priority, amountPaid, totalCost, comments } = req.body;
    const finalAmount = amountPaid ?? totalCost ?? 0; // accept either field
    
    const orderCount = await prisma.patientOrder.count();
    const bookingId = `BK-${1001 + orderCount}`;

    const newOrder = await prisma.patientOrder.create({
      data: {
        bookingId,
        userId: patientId,
        bookedById: bookedById || null,
        labId: labId || null,
        timeSlot,
        priority: priority || 'MEDIUM',
        amountPaid: finalAmount,
        status: 'SCHEDULED',
        tests: testIds && testIds.length > 0 ? {
          connect: testIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        tests: true,
        lab: true
      }
    });

    // Award reward points (10% of amountPaid) — only for real patients
    if (finalAmount > 0) {
      try {
        const pointsEarned = Math.floor(finalAmount * 0.1);
        await prisma.patient.update({
          where: { id: patientId },
          data: { rewardPoints: { increment: pointsEarned } }
        });
      } catch (_) {
        // Swallow if patient not found (e.g., demo data)
      }
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order', details: String(error) });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedOrder = await prisma.patientOrder.update({
      where: { id },
      data: { status },
    });
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Upload a PDF file and return its URL
router.post('/upload', upload.single('report'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file received' });
    }
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Upload report + auto-finalize in one atomic operation
router.patch('/:id/report', async (req, res) => {
  try {
    const { id } = req.params;
    const { reportUrl } = req.body;
    
    const updatedOrder = await prisma.patientOrder.update({
      where: { id },
      data: { 
        reportUrl,
        status: 'COMPLETED'  // Atomically finalize when report is uploaded
      },
      include: {
        patient: true,
        tests: true,
        lab: true,
        aiInsight: true
      }
    });
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Report upload failed:', error);
    res.status(500).json({ error: 'Failed to upload report', details: String(error) });
  }
});

export default router;
