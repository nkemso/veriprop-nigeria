'use strict';

/**
 * VERIPROP IMMUTABLE AUDIT LOGGER
 * Every significant action is recorded — cannot be deleted by any user.
 */

const db = require('../db');

const auditLog = async ({
  action,
  userId = null,
  transactionId = null,
  resourceType = null,
  resourceId = null,
  description,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await db.auditLog.create({
      data: {
        action,
        userId,
        transactionId,
        resourceType,
        resourceId,
        description,
        metadata,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    // Audit log failures should never crash the app, but should be alerted
    console.error('[AUDIT] Failed to write audit log:', err.message, { action, userId });
  }
};

const getAuditTrail = async (filters = {}, page = 1, limit = 50) => {
  const where = {
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.transactionId && { transactionId: filters.transactionId }),
    ...(filters.action && { action: filters.action }),
    ...(filters.from && { createdAt: { gte: new Date(filters.from) } }),
    ...(filters.to && { createdAt: { lte: new Date(filters.to) } }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total, page, totalPages: Math.ceil(total / limit) };
};

module.exports = { auditLog, getAuditTrail };
