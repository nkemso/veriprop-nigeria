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

// ── COMMS STACK HEALTH ──────────────────────────────────────
app.get('/api/v1/ops/comms', async (req, res) => {
  const results = {};
  try {
    const emailService = require('./services/emailService');
    results.email = await emailService.testConnection();
  } catch (e) { results.email = { connected: false, message: e.message }; }
  results.otp = {
    connected: true,
    provider: 'resend_email',
    message: '✅ Email OTP via Resend (₦0 — FREE forever)',
  };
  try {
    const pushService = require('./services/pushService');
    results.push = await pushService.testConnection();
  } catch (e) { results.push = { connected: false, message: e.message }; }
  try {
    const telegramService = require('./services/telegramService');
    results.telegram = await telegramService.testConnection();
  } catch (e) { results.telegram = { connected: false, message: e.message }; }
  try {
    const identityService = require('./services/identityService');
    results.identity = await identityService.testConnection();
  } catch (e) { results.identity = { connected: false, message: e.message }; }
  try {
    const storageService = require('./services/storageService');
    results.storage = await storageService.testConnection();
  } catch (e) { results.storage = { connected: false, message: e.message }; }
  try {
    const paymentService = require('./services/paymentService');
    results.payments = await paymentService.testConnection();
  } catch (e) { results.payments = { connected: false, message: e.message }; }
  res.json({ status: 'ok', comms: results, timestamp: new Date().toISOString() });
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
    version: '2.1.0',
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
  const { setupRouter: adminSetup } = require('./adminSetup');
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
  app.use('/api/v1/admin', adminSetup); // setup + promote (setup requires key, promote requires super_admin auth)
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

  // ── TELEGRAM BOT WEBHOOK ──────────────────────────────────
  app.post('/api/v1/telegram/webhook', express.json(), async (req, res) => {
    try {
      const tg = require('./services/telegramService');
      await tg.handleBotUpdate(req.body);
      res.json({ ok: true });
    } catch (err) {
      console.error('[Telegram Webhook]', err.message);
      res.json({ ok: true }); // Always 200 for Telegram
    }
  });

  // ── TELEGRAM LOGIN VERIFY ──────────────────────────────────
  app.post('/api/v1/auth/telegram', express.json(), async (req, res) => {
    try {
      const tg = require('./services/telegramService');
      const result = tg.verifyTelegramLogin(req.body);

      if (!result.valid) {
        return res.status(401).json({ success: false, message: result.message });
      }

      const { telegramId, firstName, lastName, username, photoUrl } = result.user;
      const db = require('./db');
      const { generateTokens } = require('./roleAuth');

      // Find or create user by Telegram ID
      let user = await db.user.findFirst({
        where: { email: `tg_${telegramId}@veriprop.telegram` },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true, isActive: true },
      });

      if (!user) {
        // Create new account from Telegram login
        const bcrypt = require('bcryptjs');
        const tempPassword = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 10);

        user = await db.user.create({
          data: {
            email: `tg_${telegramId}@veriprop.telegram`,
            password: tempPassword,
            firstName: firstName || 'Telegram',
            lastName: lastName || 'User',
            phone: '+2340000000000', // Placeholder — user updates later
            role: 'buyer',
            isActive: true,
            profile: { create: { displayName: `${firstName} ${lastName}`.trim() } },
          },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true, isActive: true },
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated' });
      }

      const { accessToken, refreshToken } = generateTokens(user);

      res.json({
        success: true,
        message: 'Logged in via Telegram',
        user,
        tokens: { accessToken, refreshToken },
        isNewUser: !user.isVerified,
      });
    } catch (err) {
      console.error('[Telegram Login]', err.message);
      res.status(500).json({ success: false, message: 'Telegram login failed' });
    }
  });

  // ── MEDIA PROXY (serves Telegram-stored files) ──────────────
  app.get('/api/v1/media/:fileId', async (req, res) => {
    try {
      const storage = require('./services/storageService');
      const file = await storage.proxyFile(req.params.fileId);
      if (!file) return res.status(404).json({ error: 'File not found' });

      res.set('Content-Type', file.contentType);
      res.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache 1 year
      res.send(file.buffer);
    } catch (err) {
      res.status(500).json({ error: 'File retrieval failed' });
    }
  });

  // ── IMAGE UPLOAD ENDPOINT ──────────────────────────────────
  app.post('/api/v1/media/upload', express.json({ limit: '20mb' }), async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return res.status(401).json({ success: false, message: 'Auth required' });

      const storage = require('./services/storageService');
      const { image, filename, caption } = req.body;

      if (!image) return res.status(400).json({ success: false, message: 'Image data required' });

      const result = await storage.uploadImage(image, filename || 'upload.jpg', caption || '');
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── BATCH IMAGE UPLOAD ─────────────────────────────────────
  app.post('/api/v1/media/upload-batch', express.json({ limit: '50mb' }), async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return res.status(401).json({ success: false, message: 'Auth required' });

      const storage = require('./services/storageService');
      const { images, title } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ success: false, message: 'Images array required' });
      }

      if (images.length > 20) {
        return res.status(400).json({ success: false, message: 'Maximum 20 images per upload' });
      }

      const results = await storage.uploadPropertyImages(images, title || 'Property');
      const urls = results.filter(r => r.success).map(r => r.url);

      res.json({ success: true, urls, count: urls.length, provider: results[0]?.provider });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Auto-setup Telegram webhook on startup
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const tg = require('./services/telegramService');
    const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN
      : 'https://veriprop-nigeria-production.up.railway.app';
    tg.setWebhook(backendUrl + '/api/v1/telegram/webhook')
      .then(r => console.log('[Telegram] Webhook set:', r.ok ? '✅' : '❌', r.description || ''))
      .catch(e => console.error('[Telegram] Webhook setup failed:', e.message));

    // Set bot commands menu
    tg.tgFetch('setMyCommands', {
      commands: [
        { command: 'start', description: 'Welcome & get started' },
        { command: 'link', description: 'Link your VeriProp account' },
        { command: 'status', description: 'Check your verification status' },
        { command: 'help', description: 'Get help & support' },
      ],
    }).catch(() => {});
  }

  console.log('✅ All routes loaded');
} catch (err) {
  console.error('❌ Route loading error:', err.message, err.stack);
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
// deploy 1780092575
