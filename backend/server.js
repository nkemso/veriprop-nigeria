'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const config = require('./config');

const app = express();

// ── SECURITY ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.allowedOrigins.includes(origin) ||
        config.cors.allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

// ── MIDDLEWARE ─────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

app.use((req, res, next) => {
  req.requestId = `VP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Powered-By', 'VeriProp Nigeria');
  next();
});

// ── HEALTH (no DB required) ────────────────────────────────
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const db = require('./db');
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'healthy';
  } catch (e) {
    dbStatus = 'connecting';
  }
  res.json({
    status: 'ok',
    app: config.app.name,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/ops/health', async (req, res) => {
  let dbOk = false;
  try {
    const db = require('./db');
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbOk = false;
  }
  res.json({
    status: 'ok',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    domains: {
      database: dbOk,
      payments: !!config.payments?.paystack?.secretKey,
      ai_moderation: true,
      email: !!config.email?.user,
    },
  });
});

// ── ROUTES ─────────────────────────────────────────────────
try {
  const phase1 = require('./phase1Identity');
  const phase2 = require('./phase2Marketplace');
  const phase3 = require('./phase3Transaction');
  const phase45 = require('./phase45Operations');
  const legalService = require('./legalService');
  const { chatRouter } = require('./chat/chatService');
  const multiSigRoutes = require('./multisig/multiSigRoutes');
  const vaultRoutes = require('./vaults/vaultRoutes');

  // v1 routes
  app.use('/api/v1/auth', authLimiter, phase1.authRouter);
  app.use('/api/v1/users', phase1.userRouter);
  app.use('/api/v1/verify', phase1.verifyRouter);
  app.use('/api/v1/properties', phase2.propertyRouter);
  app.use('/api/v1/search', phase2.searchRouter);
  app.use('/api/v1/agents', phase2.agentRouter);
  app.use('/api/v1/transactions', phase3.transactionRouter);
  app.use('/api/v1/escrow', phase3.escrowRouter);
  app.use('/api/v1/payments', phase3.paymentRouter);
  app.use('/api/v1/multisig', multiSigRoutes);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/legal', legalService.legalRouter);
  app.use('/api/v1/admin', phase45.adminRouter);
  app.use('/api/v1/portfolio', phase45.portfolioRouter);
  app.use('/api/v1/support', phase45.supportRouter);
  app.use('/api/v1/notifications', phase45.notificationRouter);
  app.use('/api/v1/vaults', vaultRoutes);

  // legacy aliases
  app.use('/api/auth', authLimiter, phase1.authRouter);
  app.use('/api/users', phase1.userRouter);
  app.use('/api/verify', phase1.verifyRouter);
  app.use('/api/properties', phase2.propertyRouter);
  app.use('/api/search', phase2.searchRouter);
  app.use('/api/transactions', phase3.transactionRouter);
  app.use('/api/escrow', phase3.escrowRouter);
  app.use('/api/payments', phase3.paymentRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/legal', legalService.legalRouter);
  app.use('/api/admin', phase45.adminRouter);
  app.use('/api/portfolio', phase45.portfolioRouter);
  app.use('/api/support', phase45.supportRouter);
  app.use('/api/notifications', phase45.notificationRouter);

  console.log('✅ All routes loaded');
} catch (err) {
  console.error('❌ Route loading error:', err.message);
}

// ── 404 & ERROR ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Already exists' });
  if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Not found' });
  res.status(err.status || 500).json({
    success: false,
    message: config.app.isProduction ? 'Internal server error' : err.message,
    requestId: req.requestId,
  });
});

// ── START ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VeriProp Nigeria API running on port ${PORT}`);
});

// Connect DB after server is up
const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const db = require('./db');
      await db.$connect();
      console.log('✅ Database connected');

      // Initialize vaults
      const VAULTS = ['platform_fee', 'agent_commission', 'vat_pool', 'wht_pool'];
      for (const name of VAULTS) {
        await db.vault.upsert({
          where: { name },
          update: {},
          create: { name, balance: 0, totalIn: 0, totalOut: 0 },
        });
      }
      console.log('✅ Vaults initialized');
      return;
    } catch (err) {
      console.warn(`[DB] Attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('[DB] All connection attempts failed - running without DB');
};

connectDB();

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (r) => console.error('[UNHANDLED]', r));

module.exports = app;
