'use strict';

/**
 * VERIPROP JWT AUTH MIDDLEWARE
 * requireAuth — protects all transaction and chat endpoints
 * requireTier — enforces verification tier gates
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

// Standard JWT auth
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_MISSING',
        message: 'Authentication required. Please login.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
        message: err.name === 'TokenExpiredError'
          ? 'Session expired. Please login again.'
          : 'Invalid authentication token.',
      });
    }

    // Fetch fresh user data (catches banned/deactivated users mid-session)
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isVerified: true, isActive: true, isBanned: true,
        verificationTier: true, fraudScore: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, code: 'ACCOUNT_INACTIVE', message: 'Account deactivated' });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, code: 'ACCOUNT_BANNED', message: 'Account suspended. Contact support.' });
    }
    if (user.fraudScore >= 100) {
      return res.status(403).json({ success: false, code: 'HIGH_FRAUD_RISK', message: 'Account flagged. Contact compliance.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH] Middleware error:', err);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Optional auth (does not fail if no token)
const optionalAuth = async (req, res, next) => {
  const token = req.headers['authorization']?.slice(7);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isVerified: true, verificationTier: true },
    });
    if (user) req.user = user;
  } catch (_) {}
  next();
};

// Role-based guard
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      code: 'INSUFFICIENT_ROLE',
      message: 'You do not have permission to perform this action.',
      required: roles,
      current: req.user.role,
    });
  }
  next();
};

// Verification tier gate
// Tier 1 = NIN, Tier 2 = Document KYC (Didit), Tier 3 = Full Verified
const requireTier = (minTier) => (req, res, next) => {
  const tierOrder = ['NONE', 'TIER1_NIN', 'TIER2_DOCUMENT', 'TIER3_NOTARY'];
  const userTierIndex = tierOrder.indexOf(req.user?.verificationTier || 'NONE');
  const requiredIndex = tierOrder.indexOf(minTier);

  if (userTierIndex < requiredIndex) {
    return res.status(403).json({
      success: false,
      code: 'VERIFICATION_REQUIRED',
      message: `This action requires ${minTier} verification.`,
      currentTier: req.user?.verificationTier,
      requiredTier: minTier,
      upgradeUrl: '/verify',
    });
  }
  next();
};

// Admin guard
const requireAdmin = requireRole('admin', 'super_admin');
const requireCompliance = requireRole('admin', 'super_admin', 'compliance_officer');

module.exports = { requireAuth, optionalAuth, requireRole, requireTier, requireAdmin, requireCompliance };
