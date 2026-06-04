import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { connectDB } from './db/connect';
import authRoutes  from './routes/authRoutes';
import visitRoutes from './routes/visitRoutes';
import hostRoutes  from './routes/hostRoutes';
import guardRoutes from './routes/guardRoutes';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { Visit } from './models/Visit';
import adminRoutes from './routes/adminRoutes';
import { seedAdminFromEnv } from './utils/seedAdmin';

dotenv.config();

const app = express();
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
]);

// ── SECURITY MIDDLEWARES ───────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.has(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));  // 10mb for base64 QR images
app.use(cookieParser());

// ── RATE LIMITING ──────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      10,
  message:  { success: false, message: 'Too many login attempts, try again later' },
});
app.use('/api/auth/login',    loginLimiter);
app.use('/api/auth/register', loginLimiter);

// ── ROUTES ─────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/host',   hostRoutes);
app.use('/api/guard',  guardRoutes);
app.use('/api/admin', adminRoutes);

// ── HEALTH CHECK ───────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'GatePass API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      visits: '/api/visits',
      admin: '/api/admin',
      guard: '/api/guard',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GatePass API is running ✅' });
});

// ── ERROR HANDLER (must be last) ───────────────────────────
app.use(errorMiddleware);

// ── CRON: Expire old QR codes (runs daily at midnight) ─────
cron.schedule('0 0 * * *', async () => {
  const result = await Visit.updateMany(
    { status: 'APPROVED', qrExpiresAt: { $lt: new Date() } },
    { status: 'EXPIRED' }
  );
  console.log(`🕛 Cron: Expired ${result.modifiedCount} old QR codes`);
});

// ── START SERVER ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedAdminFromEnv();

  app.listen(PORT, () => {
    console.log(`🚀 GatePass server running on http://localhost:${PORT}`);
  });
});
