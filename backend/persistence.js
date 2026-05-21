'use strict';

const { PrismaClient } = require('@prisma/client');
const config = require('./config');

// ============================================
// DATABASE PERSISTENCE LAYER
// ============================================

let prisma;

const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: config.app.isProduction
        ? ['error', 'warn']
        : ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }
  return prisma;
};

// Connect to database
const connect = async () => {
  try {
    const db = getPrisma();
    await db.$connect();
    console.log('✅ Database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Disconnect
const disconnect = async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }
};

// Health check
const healthCheck = async () => {
  try {
    const db = getPrisma();
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Pagination helper
const paginate = (page = 1, limit = 20) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const take = Math.min(100, parseInt(limit));
  return { skip, take };
};

// Build pagination response
const paginateResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

// Safe delete (soft delete pattern)
const softDelete = async (model, id) => {
  const db = getPrisma();
  return db[model].update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
};

// Transaction wrapper
const withTransaction = async (callback) => {
  const db = getPrisma();
  return db.$transaction(callback);
};

// Retry wrapper for transient errors
const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`Retry attempt ${attempt}/${maxRetries}:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

module.exports = {
  getPrisma,
  connect,
  disconnect,
  healthCheck,
  paginate,
  paginateResponse,
  softDelete,
  withTransaction,
  withRetry,
};
