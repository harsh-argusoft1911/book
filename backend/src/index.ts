import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded reports statically
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
import bookingRoutes from './routes/bookings';
import testRoutes from './routes/tests';
import analyticsRoutes from './routes/analytics';
import labsRoutes from './routes/labs';
import couponsRoutes from './routes/coupons';
import patientsRoutes from './routes/patients';
import familyRoutes from './routes/family';
import aiRoutes from './routes/ai';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';

// ── Pathology Bot (isolated module — toggle via env flag) ──────────────────────
import pathologyBotRouter from './pathology-bot/webhook';




app.use('/api/bookings', bookingRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/labs', labsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// ── Pathology Bot: mount only when PATHOLOGY_BOT_ENABLED=true ─────────────────
if (process.env.PATHOLOGY_BOT_ENABLED === 'true') {
  app.use('/pathology-bot', pathologyBotRouter);
  console.log('[pathology-bot] Module enabled at /pathology-bot');
}

// Serve frontend in production
const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  
  // Handle SPA routing - send all non-API GET requests to index.html
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      next();
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Access the app at: http://localhost:${port}`);
});

export { prisma };
