'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('./db');
const config = require('./config');
const { generateTokens, authenticateToken, requireRole, ROLES } = require('./roleAuth');
const { moderateUserProfile } = require('./aiModeration');

const authRouter = express.Router();
const userRouter = express.Router();
const verifyRouter = express.Router();

// ============================================
// AUTH ROUTES
// ============================================

// Register
authRouter.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('phone').matches(/^(\+234|0)[789][01]\d{8}$/),
  body('role').isIn(Object.values(ROLES)),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, config.encryption.bcryptRounds);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || ROLES.BUYER,
        isActive: true,
        profile: {
          create: {
            displayName: `${firstName} ${lastName}`,
          },
        },
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isVerified: true, createdAt: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    // Send welcome email (async, don't await)
    sendWelcomeEmail(user).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login
authRouter.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isVerified: true, isActive: true,
        isBanned: true, password: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    const { password: _, ...safeUser } = user;
    const { accessToken, refreshToken } = generateTokens(safeUser);

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: req.ip },
    });

    // 🔒 SESSION LOG — immutable auth trail
    db.sessionLog.create({
      data: {
        userId: user.id,
        event: 'login',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      },
    }).catch(console.error);

    res.json({
      success: true,
      message: 'Login successful',
      user: safeUser,
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Refresh token
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);

    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, isVerified: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    res.json({ success: true, tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

// Logout
authRouter.post('/logout', authenticateToken, async (req, res) => {
  // In production: blacklist the token in Redis
  res.json({ success: true, message: 'Logged out successfully' });
});

// Forgot password
authRouter.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (user) {
      const token = require('crypto').randomBytes(32).toString('hex');
      await db.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      // TODO: Send reset email
    }

    res.json({ success: true, message: 'If your email is registered, you will receive a reset link' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// ============================================
// USER ROUTES
// ============================================

// Get current user profile
userRouter.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isVerified: true, isActive: true,
        verificationTier: true, fraudScore: true,
        createdAt: true, lastLoginAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Get profile separately (may not exist)
    let profile = null;
    try {
      profile = await db.userProfile.findUnique({ where: { userId: req.user.id } });
    } catch(e) { /* profile table may not exist yet */ }
    
    res.json({ success: true, user: { ...user, profile } });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', debug: error.message });
  }
});

// Update profile
userRouter.put('/me', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().matches(/^(\+234|0)[789][01]\d{8}$/),
], async (req, res) => {
  try {
    const { firstName, lastName, phone, bio, avatar } = req.body;
    const user = await db.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        profile: {
          update: {
            ...(bio && { bio }),
            ...(avatar && { avatar }),
            displayName: `${firstName || ''} ${lastName || ''}`.trim(),
          },
        },
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, profile: true,
      },
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// ============================================
// VERIFICATION ROUTES
// ============================================

// Verify NIN
verifyRouter.post('/nin', authenticateToken, [
  body('nin').isLength({ min: 11, max: 11 }).isNumeric(),
], async (req, res) => {
  try {
    const { nin } = req.body;
    // TODO: Integrate with NIBSS/Smile Identity
    // For now, simulate verification
    const isValid = nin.length === 11;

    if (isValid) {
      await db.user.update({
        where: { id: req.user.id },
        data: {
          ninVerified: true,
          ninNumber: nin,
          verificationLevel: 1,
        },
      });
    }

    res.json({
      success: isValid,
      message: isValid ? 'NIN verified successfully' : 'Invalid NIN',
      verificationLevel: isValid ? 1 : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'NIN verification failed' });
  }
});

// Verify BVN
verifyRouter.post('/bvn', authenticateToken, [
  body('bvn').isLength({ min: 11, max: 11 }).isNumeric(),
], async (req, res) => {
  try {
    const { bvn } = req.body;
    const isValid = bvn.length === 11;

    if (isValid) {
      await db.user.update({
        where: { id: req.user.id },
        data: { bvnVerified: true, verificationLevel: 2 },
      });
    }

    res.json({
      success: isValid,
      message: isValid ? 'BVN verified successfully' : 'Invalid BVN',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'BVN verification failed' });
  }
});

// Verify phone (OTP)
verifyRouter.post('/phone/send-otp', authenticateToken, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.otp.create({
      data: {
        userId: req.user.id,
        otp,
        type: 'phone',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });
    // TODO: Send OTP via Termii
    console.log(`[OTP] ${req.user.id}: ${otp}`);
    res.json({ success: true, message: 'OTP sent to your phone number' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

verifyRouter.post('/phone/verify-otp', authenticateToken, [
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res) => {
  try {
    const { otp } = req.body;
    const record = await db.otp.findFirst({
      where: {
        userId: req.user.id,
        otp,
        type: 'phone',
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await Promise.all([
      db.otp.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      db.user.update({
        where: { id: req.user.id },
        data: { phoneVerified: true, isVerified: true },
      }),
    ]);

    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});

// Helper: Welcome email
const sendWelcomeEmail = async (user) => {
  console.log(`[EMAIL] Welcome email to ${user.email}`);
  // TODO: Implement with Nodemailer
};

module.exports = { authRouter, userRouter, verifyRouter };
