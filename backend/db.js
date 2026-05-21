'use strict';

const { PrismaClient } = require('@prisma/client');

// Singleton Prisma instance
const globalForPrisma = globalThis;

const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

module.exports = db;
