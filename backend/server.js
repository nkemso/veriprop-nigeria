'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const config = require('./config');
const { connect, healthCheck } = require('./persistence');
const { auditLog } = require('./audit/auditLogger');

// Route handlers — Phase 1
const phase1 = require('./phase1Identity');
// Phase 2
const phase2 = require('./phase2Marketplace');
// Phase 3
const phase3 = require('./phase3Transaction');
// Phase 4&5
const phase45 = require('./phase45Operations');
// Legal
const legalService = require('./legalService');
// Chat
const { chatRouter } = require('./chat/chatService');
// Multi-Sig
const multiSigRoutes = require('./multisig/multiSigRoutes');
// Vault/Admin
const vaultRoutes = require('./vaults/vaultRoutes');

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://js.paystack.co'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
      connectSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Global rate limit
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});
app.use('/api/', limiter);

// Strict auth rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts.' },
});

// ============================================================
// GENERAL MIDDLEWARE
// ============================================================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(config.app.isProduction ? 'combined' : 'dev'));

// Request ID & timing
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `VP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Powered-By', 'VeriProp Nigeria');
  next();
});

// ============================================================
// Simple ping - no DB needed - for Railway healthcheck
app.get('/ping', (req, res) => res.json({ ok: true }));
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'VeriProp Nigeria' }));

// /api/v1/ops/health — Diagnostics (NO secrets exposed)
// ============================================================
app.get('/api/v1/ops/health', async (req, res) => {
  const dbHealth = await healthCheck();
  const uptime = process.uptime();

  // ✅ PII MASKING: Only booleans exposed — no keys, no URLs, no internal data
  const isHealthy = dbHealth.status === 'healthy';
  res.json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    version: '2.0.0',
    domains: {
      database: isHealthy,                                  // boolean only
      payments: !!config.payments?.paystack?.secretKey,     // boolean only
      ai_moderation: !!config.ai?.openai?.apiKey,           // boolean only
      sms: !!config.sms?.termii?.apiKey,                    // boolean only
      email: !!config.email?.user,                          // boolean only
      storage: !!config.cloudinary?.cloudName,              // boolean only
      maps: !!config.maps?.googleApiKey,                    // boolean only
    },
    // Raw values, keys, IPs, stack traces: NEVER exposed
  });
});

// Legacy health (backward compat)
app.get('/api/health', async (req, res) => {
  const dbHealth = await healthCheck();
  res.json({ status: 'ok', app: config.app.name, database: dbHealth.status });
});

// ============================================================
// API ROUTES v1
// ============================================================

// Phase 1: Identity & Auth
app.use('/api/v1/auth', authLimiter, phase1.authRouter);
app.use('/api/v1/users', phase1.userRouter);
app.use('/api/v1/verify', phase1.verifyRouter);

// Phase 2: Marketplace
app.use('/api/v1/properties', phase2.propertyRouter);
app.use('/api/v1/search', phase2.searchRouter);
app.use('/api/v1/agents', phase2.agentRouter);

// Phase 3: Transactions & Escrow
app.use('/api/v1/transactions', phase3.transactionRouter);
app.use('/api/v1/escrow', phase3.escrowRouter);
app.use('/api/v1/payments', phase3.paymentRouter);

// Multi-Sig
app.use('/api/v1/multisig', multiSigRoutes);

// Secure Chat
app.use('/api/v1/chat', chatRouter);

// Legal
app.use('/api/v1/legal', legalService.legalRouter);

// Phase 4&5: Admin & Operations
app.use('/api/v1/admin', phase45.adminRouter);
app.use('/api/v1/portfolio', phase45.portfolioRouter);
app.use('/api/v1/support', phase45.supportRouter);
app.use('/api/v1/notifications', phase45.notificationRouter);

// Vault Routes
app.use('/api/v1/vaults', vaultRoutes);

// Legacy aliases (v0 → v1)
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

// ============================================================
// SERVE FRONTEND (Production)
// ============================================================
if (config.app.isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

// ============================================================
// ERROR HANDLERS
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  const duration = Date.now() - (req.startTime || Date.now());
  console.error(`[ERROR] ${req.requestId} (${duration}ms):`, err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS policy violation' });
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Record already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: config.app.isProduction ? 'Internal server error' : err.message,
    requestId: req.requestId,
  });
});

// ============================================================
// START SERVER
// ============================================================
const startServer = async () => {
  try {
    // Start server first so Railway healthcheck can reach it
    const server = app.listen(config.app.port, "0.0.0.0", () => {
      console.log(`
🚀 ============================================
   VeriProp Nigeria API — v2.0.0
   Port:        ${config.app.port}
   Environment: ${config.app.env}
   Health:      http://localhost:${config.app.port}/api/v1/ops/health
==============================================
      `);
    });

    // Connect DB after server is already listening
    try {
      await connect();
      initializeVaults().catch(e => console.warn('[VAULT] Init warning:', e.message));
    } catch (dbError) {
      console.error('[DB] Connection failed - retrying in 5s:', dbError.message);
      setTimeout(async () => {
        try {
          await connect();
          initializeVaults().catch(e => console.warn('[VAULT] Init warning:', e.message));
          console.log('[DB] Reconnected successfully');
        } catch(e) {
          console.error('[DB] Retry failed:', e.message);
        }
      }, 5000);
    }

    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} — Shutting down gracefully...`);
      server.close(async () => {
        const { disconnect } = require('./persistence');
        await disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      console.error('[UNHANDLED]', reason);
    });

    return server;
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
};

// Initialize platform vaults on first startup
const initializeVaults = async () => {
  const db = require('./db');
  const vaultNames = ['platform_fee', 'agent_commission', 'vat_pool', 'wht_pool'];
  for (const name of vaultNames) {
    await db.vault.upsert({
      where: { name },
      update: {},
      create: { name, balance: 0, totalIn: 0, totalOut: 0 },
    });
  }
  console.log('[VAULT] All platform vaults initialized ✅');
};

startServer();
module.exports = app;
