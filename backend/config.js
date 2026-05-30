'use strict';

require('dotenv').config();

const config = {
  app: {
    name: process.env.APP_NAME || 'VeriProp Nigeria',
    url: process.env.APP_URL || 'https://veripronigeria.com',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  db: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'VeriProp Nigeria <noreply@veripronigeria.com>',
  },

  sms: {
    termii: {
      apiKey: process.env.TERMII_API_KEY,
      senderId: process.env.TERMII_SENDER_ID || 'VeriPro',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phone: process.env.TWILIO_PHONE,
    },
  },

  payments: {
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    },
    flutterwave: {
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
    },
    escrow: {
      bankAccount: process.env.ESCROW_BANK_ACCOUNT,
      bankCode: process.env.ESCROW_BANK_CODE,
    },
  },

  verification: {
    nibss: { apiKey: process.env.NIBSS_API_KEY },
    smileIdentity: {
      apiKey: process.env.SMILE_IDENTITY_API_KEY,
      partnerId: process.env.SMILE_IDENTITY_PARTNER_ID,
    },
    cac: {
      apiKey: process.env.CAC_API_KEY,
      apiUrl: process.env.CAC_API_URL || 'https://efts.cac.gov.ng/api',
    },
  },

  // ============================================================
  // MULTI-PROVIDER AI CONFIGURATION
  // ============================================================
  ai: {
    provider: process.env.AI_PROVIDER || 'local',

    qwen: {
      apiKey: process.env.QWEN_API_KEY,
      model: process.env.QWEN_MODEL || 'qwen-plus',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },

    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com',
    },

    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      baseUrl: 'https://api.groq.com/openai/v1',
    },

    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },

    // ── OPENROUTER ─────────────────────────────────
    // FREE forever, 11+ models, OpenAI-compatible
    // Get key: openrouter.ai
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      baseUrl: 'https://openrouter.ai/api/v1',
    },

    local: {
      enabled: true,
    },
  },

  // ============================================================
  // RESEND — TRANSACTIONAL EMAIL (3,000 free/month)
  // Sign up: resend.com (no credit card)
  // ============================================================
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    enabled: !!(process.env.RESEND_API_KEY),
  },

  // ============================================================
  // FCM V1 — PUSH NOTIFICATIONS (unlimited free forever)
  // Setup: console.firebase.google.com → Project Settings
  //        → Service Accounts → Generate new private key
  //        → Set FIREBASE_SERVICE_ACCOUNT env var (JSON string)
  //   OR set individual vars: FIREBASE_PROJECT_ID,
  //      FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
  // ============================================================
  fcm: {
    enabled: !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID),
  },

  // ============================================================
  // DIDIT KYC — ZERO-TRUST IDENTITY VERIFICATION
  // ============================================================
  // Sign up: https://business.didit.me (no credit card)
  // 500 FREE verifications/month forever
  //
  // Services used:
  //   - Database Validation: NIN verification
  //   - Session KYC: ID + Liveness + Face Match + IP (500 free/month, then $0.33)
  //   - Passive Liveness: standalone ($0.05/call)
  //
  // ⛔ Without DIDIT_API_KEY, ALL verification routes will FAIL.
  //    This is intentional — no fake verification is allowed.
  // ============================================================
  didit: {
    apiKey: process.env.DIDIT_API_KEY,
    enabled: !!(process.env.DIDIT_API_KEY),
    workflowId: process.env.DIDIT_WORKFLOW_ID,
    webhookSecret: process.env.DIDIT_WEBHOOK_SECRET,
    freeMonthly: 500,
  },

  // ============================================================
  // TELEGRAM BOT — FREE unlimited notifications, login, OTP
  // Setup: Message @BotFather → /newbot → get token
  // ============================================================
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    enabled: !!(process.env.TELEGRAM_BOT_TOKEN),
    channelId: process.env.TELEGRAM_CHANNEL_ID || '@VeriPropNigeria',
  },

  maps: {
    provider: 'openstreetmap',
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    nominatimUrl: 'https://nominatim.openstreetmap.org',
    attribution: '© OpenStreetMap contributors',
    mapboxToken: process.env.MAPBOX_TOKEN || null,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/veripro.log',
  },
};

// ============================================================
// STARTUP VALIDATION
// ============================================================
if (config.app.isProduction) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
  }

  // ⛔ CRITICAL WARNING for verification
  if (!process.env.DIDIT_API_KEY) {
    console.error('');
    console.error('══════════════════════════════════════════════════════════');
    console.error('⛔  DIDIT_API_KEY IS NOT SET — ALL VERIFICATION IS DISABLED');
    console.error('   NIN and biometric checks will FAIL for all users.');
    console.error('   Get your FREE key at: https://business.didit.me');
    console.error('══════════════════════════════════════════════════════════');
    console.error('');
  } else {
    console.log('[CONFIG] 🛡️  Didit KYC: ACTIVE (500 free/month)');
  }

  const recommended = ['PAYSTACK_SECRET_KEY', 'CLOUDINARY_CLOUD_NAME'];
  const missingRec = recommended.filter(key => !process.env[key]);
  if (missingRec.length > 0) {
    console.warn(`[CONFIG] ⚠️  Recommended vars not set: ${missingRec.join(', ')}`);
  }

  console.log(`[CONFIG] 🤖 AI Provider: ${config.ai.provider.toUpperCase()}`);
}

module.exports = config;
