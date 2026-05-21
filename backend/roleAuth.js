'use strict';

const jwt = require('jsonwebtoken');
const config = require('./config');

// ============================================
// ROLES & PERMISSIONS
// ============================================
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  AGENT: 'agent',
  AGENCY: 'agency',
  DEVELOPER: 'developer',
  BUYER: 'buyer',
  SELLER: 'seller',
  TENANT: 'tenant',
  LANDLORD: 'landlord',
  LAWYER: 'lawyer',
  SURVEYOR: 'surveyor',
  GUEST: 'guest',
};

const PERMISSIONS = {
  // Property permissions
  PROPERTY_CREATE: 'property:create',
  PROPERTY_READ: 'property:read',
  PROPERTY_UPDATE: 'property:update',
  PROPERTY_DELETE: 'property:delete',
  PROPERTY_VERIFY: 'property:verify',
  PROPERTY_FEATURE: 'property:feature',

  // User permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_VERIFY: 'user:verify',
  USER_BAN: 'user:ban',

  // Transaction permissions
  TRANSACTION_CREATE: 'transaction:create',
  TRANSACTION_READ: 'transaction:read',
  TRANSACTION_APPROVE: 'transaction:approve',
  TRANSACTION_DISPUTE: 'transaction:dispute',

  // Escrow permissions
  ESCROW_INITIATE: 'escrow:initiate',
  ESCROW_RELEASE: 'escrow:release',
  ESCROW_REFUND: 'escrow:refund',

  // Admin permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_REPORTS: 'admin:reports',
  ADMIN_SETTINGS: 'admin:settings',
  COMPLIANCE_REVIEW: 'compliance:review',
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.PROPERTY_READ, PERMISSIONS.PROPERTY_VERIFY, PERMISSIONS.PROPERTY_FEATURE,
    PERMISSIONS.USER_READ, PERMISSIONS.USER_VERIFY, PERMISSIONS.USER_BAN,
    PERMISSIONS.TRANSACTION_READ, PERMISSIONS.TRANSACTION_APPROVE,
    PERMISSIONS.ADMIN_DASHBOARD, PERMISSIONS.ADMIN_REPORTS,
    PERMISSIONS.COMPLIANCE_REVIEW,
  ],
  [ROLES.COMPLIANCE_OFFICER]: [
    PERMISSIONS.PROPERTY_READ, PERMISSIONS.PROPERTY_VERIFY,
    PERMISSIONS.USER_READ, PERMISSIONS.USER_VERIFY,
    PERMISSIONS.TRANSACTION_READ, PERMISSIONS.COMPLIANCE_REVIEW,
    PERMISSIONS.ADMIN_REPORTS,
  ],
  [ROLES.AGENT]: [
    PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE, PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.TRANSACTION_CREATE, PERMISSIONS.TRANSACTION_READ,
  ],
  [ROLES.AGENCY]: [
    PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE, PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.TRANSACTION_CREATE, PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.USER_READ,
  ],
  [ROLES.DEVELOPER]: [
    PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE, PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.TRANSACTION_CREATE, PERMISSIONS.TRANSACTION_READ,
  ],
  [ROLES.BUYER]: [
    PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.TRANSACTION_CREATE, PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.ESCROW_INITIATE, PERMISSIONS.TRANSACTION_DISPUTE,
  ],
  [ROLES.SELLER]: [
    PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE, PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.TRANSACTION_READ, PERMISSIONS.ESCROW_RELEASE,
  ],
  [ROLES.TENANT]: [
    PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.TRANSACTION_CREATE, PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.ESCROW_INITIATE,
  ],
  [ROLES.LANDLORD]: [
    PERMISSIONS.PROPERTY_CREATE, PERMISSIONS.PROPERTY_READ,
    PERMISSIONS.PROPERTY_UPDATE, PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.TRANSACTION_READ, PERMISSIONS.ESCROW_RELEASE,
  ],
  [ROLES.GUEST]: [PERMISSIONS.PROPERTY_READ],
};

// ============================================
// JWT MIDDLEWARE
// ============================================
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING',
      });
    }

    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired',
            code: 'TOKEN_EXPIRED',
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Invalid token',
          code: 'TOKEN_INVALID',
        });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Optional auth (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

// Role-based access
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }
    next();
  };
};

// Permission-based access
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
        required: permissions,
      });
    }
    next();
  };
};

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  generateTokens,
};
