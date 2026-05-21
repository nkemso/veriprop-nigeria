'use strict';

require('dotenv').config();

const config = {
  app: {
    name: process.env.APP_NAME || 'VeriPro Nigeria',
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
    from: process.env.EMAIL_FROM || 'VeriPro Nigeria <noreply@veripronigeria.com>',
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
    nibss: {
      apiKey: process.env.NIBSS_API_KEY,
    },
    smileIdentity: {
      apiKey: process.env.SMILE_IDENTITY_API_KEY,
      partnerId: process.env.SMILE_IDENTITY_PARTNER_ID,
    },
    cac: {
      apiKey: process.env.CAC_API_KEY,
      apiUrl: process.env.CAC_API_URL || 'https://efts.cac.gov.ng/api',
    },
  },

  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    },
  },

  maps: {
    googleApiKey: process.env.GOOGLE_MAPS_API_KEY,
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

// Validate critical config in production
if (config.app.isProduction) {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PAYSTACK_SECRET_KEY',
    'OPENAI_API_KEY',
  ];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;
