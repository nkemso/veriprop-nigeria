'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — PHASE 1: IDENTITY & VERIFICATION (PRODUCTION)
 * ================================================================
 * ZERO-TRUST POLICY:
 *   - BVN verified against NIBSS via Didit Database Validation
 *   - NIN verified against NIMC via Didit Database Validation
 *   - Biometric verified via Didit Passive Liveness (real AI)
 *   - NO simulations. NO demo modes. NO fallbacks that auto-pass.
 *   - If Didit is not configured → verification FAILS with clear error.
 * ================================================================
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('./db');
const config = require('./config');
const { generateTokens, authenticateToken, requireRole, ROLES } = require('./roleAuth');
const diditKYC = require('./diditKYCService');

const authRouter = express.Router();
const userRouter = express.Router();
const verifyRouter = express.Router();

// ============================================
// HELPER — Hash sensitive data before storing
// ============================================
function hashSensitiveId(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// ============================================
// HELPER — Send welcome email (placeholder)
// ============================================
async function sendWelcomeEmail(user) {
  // TODO: Wire to real email provider
  console.log(`[Email] Welcome email queued for ${user.email}`);
}

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
  res.json({ success: true, message: 'Logged out successfully' });
});

// Forgot password
authRouter.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await db.passwordReset.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
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

userRouter.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isVerified: true, isActive: true,
        verificationTier: true, fraudScore: true,
        bvnVerified: true, ninVerified: true, phoneVerified: true,
        notaryVerified: true,
        createdAt: true, lastLoginAt: true,
      },
    }).catch(async () => {
      return db.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, role: true, isVerified: true, isActive: true,
          verificationTier: true, fraudScore: true, createdAt: true,
        },
      });
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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
// VERIFICATION ROUTES — REAL GOVERNMENT CHECKS
// ============================================

// ─── VERIFY BVN (Tier 1) ─────────────────────────────────────
// Calls Didit Database Validation → nga_bank_verification_number
// Checks against REAL NIBSS government database
// Cost: $0.80 per successful query
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/bvn', authenticateToken, [
  body('bvn').isLength({ min: 11, max: 11 }).isNumeric()
    .withMessage('BVN must be exactly 11 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid BVN format. Must be exactly 11 digits.',
        errors: errors.array(),
      });
    }

    const { bvn } = req.body;
    const userId = req.user.id;

    // Get user's name for cross-referencing with government database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, bvnVerified: true, bvnHash: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent re-verification with a different BVN
    if (user.bvnVerified && user.bvnHash) {
      const submittedHash = hashSensitiveId(bvn);
      if (user.bvnHash !== submittedHash) {
        return res.status(403).json({
          success: false,
          message: '❌ A different BVN is already verified on this account. Contact support if this is an error.',
        });
      }
      return res.json({
        success: true,
        message: '✅ BVN already verified.',
        verificationTier: 'TIER1_BVN',
        tier: 1,
      });
    }

    // Check if this BVN is already used by another account
    const bvnHash = hashSensitiveId(bvn);
    const existingBvn = await db.user.findFirst({
      where: { bvnHash, id: { not: userId } },
      select: { id: true },
    });

    if (existingBvn) {
      console.warn(`[BVN] Duplicate BVN attempt by user ${userId}. BVN already linked to another account.`);
      return res.status(409).json({
        success: false,
        message: '❌ This BVN is already registered to another account. Each person can only have one VeriProp account.',
      });
    }

    // ── REAL VERIFICATION via Didit ──
    console.log(`[BVN] Verifying BVN for user ${userId} via Didit Database Validation...`);
    const result = await diditKYC.verifyBVN(bvn, user.firstName, user.lastName);

    if (!result.verified) {
      // Log failed attempt
      console.warn(`[BVN] Verification FAILED for user ${userId}: ${result.message}`);
      return res.json({
        success: false,
        message: result.message || '❌ BVN verification failed. The BVN does not match our records.',
        provider: result.provider,
        verificationTier: 'NONE',
        tier: 0,
      });
    }

    // ── VERIFIED — Update database ──
    await db.user.update({
      where: { id: userId },
      data: {
        bvnVerified: true,
        bvnHash,
        verificationTier: 'TIER1_BVN',
      },
    });

    const freshUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationTier: true, isVerified: true, bvnVerified: true },
    });

    console.log(`[BVN] ✅ BVN verified for user ${userId}`);

    return res.json({
      success: true,
      message: '✅ BVN verified against NIBSS government database. Tier 1 unlocked!',
      verificationTier: 'TIER1_BVN',
      tier: 1,
      provider: 'didit',
      user: freshUser,
    });
  } catch (error) {
    console.error('[BVN] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'BVN verification system error. Please try again later.',
    });
  }
});


// ─── VERIFY NIN (Tier 2) ─────────────────────────────────────
// Calls Didit Database Validation → nga_national_id
// Checks against REAL NIMC government database
// Cost: $0.08 per successful query
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/nin', authenticateToken, [
  body('nin').isLength({ min: 11, max: 11 }).isNumeric()
    .withMessage('NIN must be exactly 11 digits'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid NIN format. Must be exactly 11 digits.',
        errors: errors.array(),
      });
    }

    const { nin } = req.body;
    const userId = req.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, ninVerified: true, ninHash: true, bvnVerified: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Enforce tier order: BVN must be verified first
    if (!user.bvnVerified) {
      return res.status(400).json({
        success: false,
        message: '❌ Please verify your BVN (Tier 1) before proceeding to NIN verification.',
      });
    }

    // Prevent re-verification with a different NIN
    if (user.ninVerified && user.ninHash) {
      const submittedHash = hashSensitiveId(nin);
      if (user.ninHash !== submittedHash) {
        return res.status(403).json({
          success: false,
          message: '❌ A different NIN is already verified on this account. Contact support if this is an error.',
        });
      }
      return res.json({
        success: true,
        message: '✅ NIN already verified.',
        verificationTier: 'TIER2_GOVT_ID',
        tier: 2,
      });
    }

    // Check if this NIN is already used by another account
    const ninHash = hashSensitiveId(nin);
    const existingNin = await db.user.findFirst({
      where: { ninHash, id: { not: userId } },
      select: { id: true },
    });

    if (existingNin) {
      console.warn(`[NIN] Duplicate NIN attempt by user ${userId}. NIN already linked to another account.`);
      return res.status(409).json({
        success: false,
        message: '❌ This NIN is already registered to another account. Each person can only have one VeriProp account.',
      });
    }

    // ── REAL VERIFICATION via Didit ──
    console.log(`[NIN] Verifying NIN for user ${userId} via Didit Database Validation...`);
    const result = await diditKYC.verifyNIN(nin, user.firstName, user.lastName);

    if (!result.verified) {
      console.warn(`[NIN] Verification FAILED for user ${userId}: ${result.message}`);
      return res.json({
        success: false,
        message: result.message || '❌ NIN verification failed. The NIN does not match NIMC records.',
        provider: result.provider,
        verificationTier: 'TIER1_BVN',
        tier: 1,
      });
    }

    // ── VERIFIED — Update database ──
    await db.user.update({
      where: { id: userId },
      data: {
        ninVerified: true,
        ninHash,
        verificationTier: 'TIER2_GOVT_ID',
        isVerified: true,
      },
    });

    const freshUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationTier: true, isVerified: true, ninVerified: true },
    });

    console.log(`[NIN] ✅ NIN verified for user ${userId}`);

    return res.json({
      success: true,
      message: '✅ NIN verified against NIMC government database. Tier 2 unlocked!',
      verificationTier: 'TIER2_GOVT_ID',
      tier: 2,
      provider: 'didit',
      user: freshUser,
    });
  } catch (error) {
    console.error('[NIN] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'NIN verification system error. Please try again later.',
    });
  }
});


// ─── VERIFY BIOMETRIC (Tier 3) — Didit Passive Liveness ──────
// Calls Didit /v3/passive-liveness/ — real AI liveness detection
// NO fallbacks. NO demo modes. If Didit fails → user retries.
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/biometric', authenticateToken, async (req, res) => {
  try {
    const { selfieImage } = req.body;

    // Hard requirement: real base64 image
    if (!selfieImage || selfieImage.length < 1000) {
      return res.status(400).json({
        success: false,
        message: '❌ A real selfie image is required. Please capture your face clearly.',
      });
    }

    const userId = req.user.id;

    // Get user and check tier prerequisites
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { bvnVerified: true, ninVerified: true, notaryVerified: true, verificationTier: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Enforce tier order
    if (!user.bvnVerified || !user.ninVerified) {
      return res.status(400).json({
        success: false,
        message: '❌ Please complete BVN (Tier 1) and NIN (Tier 2) verification before biometric scan.',
      });
    }

    if (user.notaryVerified) {
      return res.json({
        success: true,
        message: '✅ Biometric already verified. You are Tier 3.',
        verificationTier: 'TIER3_NOTARY',
        tier: 3,
      });
    }

    // ── REAL LIVENESS CHECK via Didit ──
    console.log(`[Biometric] Running Didit passive liveness for user ${userId}...`);

    const result = await diditKYC.checkPassiveLiveness(selfieImage);

    if (!result.isLive) {
      console.warn(`[Biometric] Liveness FAILED for user ${userId}: score=${result.score}, status=${result.status}`);
      return res.json({
        success: false,
        message: result.message || '❌ Liveness check failed. Please ensure good lighting and try again.',
        livenessScore: result.score || 0,
        provider: 'didit',
      });
    }

    // ── LIVENESS PASSED — Update database ──
    await db.user.update({
      where: { id: userId },
      data: {
        notaryVerified: true,
        notaryVerifiedAt: new Date(),
        verificationTier: 'TIER3_NOTARY',
        isVerified: true,
      },
    });

    const freshUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationTier: true, isVerified: true, notaryVerified: true },
    });

    console.log(`[Biometric] ✅ Liveness verified for user ${userId} (score: ${result.score})`);

    return res.json({
      success: true,
      message: '🎉 Biometric verified! You are now Tier 3 Verified.',
      verificationTier: 'TIER3_NOTARY',
      isVerified: true,
      livenessScore: result.score,
      provider: 'didit',
      user: freshUser,
    });
  } catch (error) {
    console.error('[Biometric] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: '❌ Biometric verification failed: ' + error.message,
    });
  }
});


// ─── CREATE DIDIT KYC SESSION (Full hosted flow) ─────────────
// Alternative path: redirect user to Didit's hosted UI for
// full ID + Liveness + Face Match + IP Analysis
// 500 FREE sessions/month
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/kyc-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await diditKYC.createKYCSession(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: '❌ Failed to create verification session: ' + (result.error || 'Unknown error'),
      });
    }

    return res.json({
      success: true,
      sessionId: result.sessionId,
      sessionUrl: result.sessionUrl,
      message: 'Verification session created. Redirect user to sessionUrl.',
      provider: 'didit',
    });
  } catch (error) {
    console.error('[KYC Session] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: '❌ KYC session creation failed: ' + error.message,
    });
  }
});


// ─── DIDIT WEBHOOK — Receives verification results ──────────
verifyRouter.post('/didit-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = req.body.toString();
    const signature = req.headers['x-signature-v2'];
    const timestamp = req.headers['x-timestamp'];

    // Verify webhook signature
    if (!diditKYC.verifyWebhookSignature(rawBody, signature, timestamp)) {
      console.error('[Didit Webhook] Invalid signature — rejecting');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const userId = payload.vendor_data;
    const status = payload.status;

    console.log(`[Didit Webhook] Session ${payload.session_id} for user ${userId}: ${status}`);

    if (status === 'Approved') {
      await db.user.update({
        where: { id: userId },
        data: {
          notaryVerified: true,
          notaryVerifiedAt: new Date(),
          verificationTier: 'TIER3_NOTARY',
          isVerified: true,
        },
      });
      console.log(`[Didit Webhook] ✅ User ${userId} upgraded to TIER3_NOTARY`);
    } else if (status === 'Declined') {
      console.warn(`[Didit Webhook] ❌ User ${userId} verification declined`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Didit Webhook] Error:', error.message);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});


// ─── GET KYC SESSION RESULT ──────────────────────────────────
verifyRouter.get('/kyc-session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const result = await diditKYC.getSessionResult(req.params.sessionId);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[KYC Result] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: '❌ Failed to retrieve verification result: ' + error.message,
    });
  }
});


// ─── VERIFICATION STATUS ─────────────────────────────────────
verifyRouter.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: {
        verificationTier: true,
        isVerified: true,
        bvnVerified: true,
        ninVerified: true,
        notaryVerified: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check Didit connectivity
    const diditStatus = await diditKYC.testConnection();

    return res.json({
      success: true,
      verification: {
        tier: user.verificationTier,
        isVerified: user.isVerified,
        bvn: user.bvnVerified,
        nin: user.ninVerified,
        biometric: user.notaryVerified,
        phone: user.phoneVerified,
      },
      didit: {
        connected: diditStatus.connected,
        mode: diditStatus.mode,
        message: diditStatus.message,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Status check failed' });
  }
});


// ─── PHONE OTP ───────────────────────────────────────────────
verifyRouter.post('/phone/send-otp', authenticateToken, async (req, res) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.otp.create({
      data: {
        userId: req.user.id,
        otp,
        type: 'phone',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    // TODO: Send OTP via Termii / Didit Phone Verification
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
        data: { phoneVerified: true },
      }),
    ]);

    res.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP verification failed' });
  }
});


module.exports = { authRouter, userRouter, verifyRouter };
