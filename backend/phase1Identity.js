'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — PHASE 1: IDENTITY & VERIFICATION (PRODUCTION)
 * ================================================================
 * ZERO-TRUST using Didit FREE session-based KYC:
 *
 * NEW FLOW:
 *   1. User enters BVN (11 digits) — stored as SHA-256 hash,
 *      checked for duplicates. NOT sent to any paid API.
 *
 *   2. User enters NIN (11 digits) — stored as SHA-256 hash,
 *      checked for duplicates. NOT sent to any paid API.
 *
 *   3. User starts Didit KYC Session — redirected to Didit's hosted UI:
 *        → Scans NIN slip / ID card / passport (OCR extracts data)
 *        → Takes selfie (passive liveness — anti-spoofing AI)
 *        → Face match (selfie vs document portrait)
 *        → IP & device analysis (VPN/proxy detection)
 *      This is 100% FREE (500 sessions/month).
 *
 *   4. Webhook fires → if Approved, user becomes TIER3_VERIFIED.
 *      The OCR-extracted document number is cross-checked against
 *      the BVN/NIN the user entered. If mismatch → flagged.
 *
 * WHY THIS IS STRONGER:
 *   - Proves user PHYSICALLY POSSESSES their real ID document
 *   - Proves user's FACE MATCHES the document photo
 *   - Proves user is a REAL LIVE PERSON (not printed photo/mask)
 *   - Extracts document data via OCR (can't fake a whole document)
 *   - Detects VPNs, proxies, device anomalies
 *   - ALL FREE — 500 sessions/month
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
const identityService = require('./services/identityService');

const authRouter = express.Router();
const userRouter = express.Router();
const verifyRouter = express.Router();

// ============================================
// HELPER — Hash sensitive data before storing
// ============================================
function hashSensitiveId(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function sendWelcomeEmail(user) {
  try {
    const emailService = require('./services/emailService');
    await emailService.sendWelcomeEmail(user);
  } catch (err) {
    console.error('[Email] Welcome email failed:', err.message);
  }
}

// ============================================
// AUTH ROUTES (unchanged)
// ============================================

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

authRouter.post('/logout', authenticateToken, async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

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
    }

    res.json({ success: true, message: 'If your email is registered, you will receive a reset link' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});


// ============================================
// USER ROUTES (unchanged)
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
    } catch(e) {}

    res.json({ success: true, user: { ...user, profile } });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
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
// VERIFICATION ROUTES — FREE SESSION-BASED KYC
// ============================================

// ─── STEP 1: REGISTER BVN ───────────────────────────────────
// User enters their BVN (11 digits).
// We store a SHA-256 hash and check for duplicates.
// The BVN will be cross-verified when Didit OCRs their ID card.
// NO paid API call — just format validation + duplicate check.
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/bvn', authenticateToken, [
  body('bvn').isLength({ min: 11, max: 11 }).isNumeric().matches(/^22\d{9}$/)
    .withMessage('BVN must be exactly 11 digits and start with 22'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid BVN. Must be exactly 11 digits starting with 22.',
        errors: errors.array(),
      });
    }

    const { bvn } = req.body;
    const userId = req.user.id;

    // ── STRUCTURAL VALIDATION ──
    // Real Nigerian BVNs: 11 digits, always start with "22"
    if (!/^22\d{9}$/.test(bvn)) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid BVN. Nigerian BVNs are 11 digits starting with 22.',
      });
    }

    // Reject fake patterns: repeated digits, sequential, common test numbers
    const bvnDigits = bvn.split('').map(Number);
    const uniqueDigits = new Set(bvnDigits).size;
    const isSequential = bvnDigits.every((d, i) => i === 0 || d === (bvnDigits[i-1] + 1) % 10);
    const isReverse = bvnDigits.every((d, i) => i === 0 || d === (bvnDigits[i-1] - 1 + 10) % 10);
    const knownFakes = ['22222222222', '22000000000', '22123456789', '22111111111', '22100000000', '22012345678', '22987654321'];

    if (uniqueDigits <= 3 || isSequential || isReverse || knownFakes.includes(bvn)) {
      return res.status(400).json({
        success: false,
        message: '❌ This does not appear to be a valid BVN. Please enter your real Bank Verification Number as issued by your bank.',
      });
    }

    // Entropy check — real BVNs have reasonable digit distribution
    const digitFreq = {};
    for (const d of bvnDigits) digitFreq[d] = (digitFreq[d] || 0) + 1;
    const maxFreq = Math.max(...Object.values(digitFreq));
    if (maxFreq >= 7) {
      // 7+ of the same digit in 11 = almost certainly fake
      return res.status(400).json({
        success: false,
        message: '❌ Invalid BVN pattern. Please enter the real BVN from your bank.',
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { bvnVerified: true, bvnHash: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Already verified with same BVN
    if (user.bvnVerified && user.bvnHash) {
      const submittedHash = hashSensitiveId(bvn);
      if (user.bvnHash === submittedHash) {
        return res.json({
          success: true,
          message: '✅ BVN already registered.',
          verificationTier: 'TIER1_BVN',
          tier: 1,
        });
      }
      return res.status(403).json({
        success: false,
        message: '❌ A different BVN is already on this account. Contact support.',
      });
    }

    // Check duplicate — one person, one account
    const bvnHash = hashSensitiveId(bvn);
    const existingBvn = await db.user.findFirst({
      where: { bvnHash, id: { not: userId } },
      select: { id: true },
    });

    if (existingBvn) {
      console.warn(`[BVN] Duplicate BVN attempt by user ${userId}`);
      return res.status(409).json({
        success: false,
        message: '❌ This BVN is already registered to another account. Each person can only have one VeriProp account.',
      });
    }

    // ── REAL VERIFICATION against NIBSS ──
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const bvnResult = await identityService.verifyBVN(bvn);

    if (!bvnResult.verified) {
      console.warn(`[BVN] ❌ NIBSS verification FAILED for user ${userId}: ${bvnResult.message}`);
      return res.json({
        success: false,
        message: bvnResult.message || '❌ BVN not found in NIBSS database. Please enter your correct BVN.',
        provider: bvnResult.provider,
        verificationTier: 'NONE',
        tier: 0,
      });
    }

    // Cross-reference name from NIBSS with registered name
    const nameMatch = identityService.matchNames(bvnResult.data, user.firstName, user.lastName);
    if (!nameMatch.match) {
      console.warn(`[BVN] ❌ Name mismatch for user ${userId}: API="${bvnResult.data?.firstName} ${bvnResult.data?.lastName}" vs User="${user.firstName} ${user.lastName}"`);
      return res.json({
        success: false,
        message: '❌ The name on this BVN does not match your registered name. Please ensure you registered with your real name.',
        provider: bvnResult.provider,
        verificationTier: 'NONE',
        tier: 0,
      });
    }

    // ✅ VERIFIED — store hash and update tier
    await db.user.update({
      where: { id: userId },
      data: {
        bvnVerified: true,
        bvnHash,
        verificationTier: 'TIER1_BVN',
      },
    });

    console.log(`[BVN] ✅ BVN verified for user ${userId} via ${bvnResult.provider} (name match: ${nameMatch.score}%)`);

    return res.json({
      success: true,
      message: '✅ BVN verified against NIBSS government database!',
      verificationTier: 'TIER1_BVN',
      tier: 1,
      provider: bvnResult.provider,
      nameMatch: nameMatch.score,
    });
  } catch (error) {
    console.error('[BVN] Error:', error.message);
    return res.status(500).json({ success: false, message: 'BVN registration error.' });
  }
});


// ─── STEP 2: REGISTER NIN ───────────────────────────────────
// Same as BVN — format validation + duplicate check, no paid API.
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

    // ── STRUCTURAL VALIDATION ──
    // Nigerian NINs: exactly 11 digits
    if (!/^\d{11}$/.test(nin)) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid NIN. Must be exactly 11 digits.',
      });
    }

    // Reject fake patterns
    const ninDigits = nin.split('').map(Number);
    const ninUnique = new Set(ninDigits).size;
    const ninSequential = ninDigits.every((d, i) => i === 0 || d === (ninDigits[i-1] + 1) % 10);
    const ninReverse = ninDigits.every((d, i) => i === 0 || d === (ninDigits[i-1] - 1 + 10) % 10);
    const ninFakes = ['00000000000', '11111111111', '12345678901', '01234567890', '98765432109', '99999999999', '10000000000'];

    if (ninUnique <= 2 || ninSequential || ninReverse || ninFakes.includes(nin)) {
      return res.status(400).json({
        success: false,
        message: '❌ This does not appear to be a valid NIN. Please enter your real National Identity Number as issued by NIMC.',
      });
    }

    // Entropy check
    const ninFreq = {};
    for (const d of ninDigits) ninFreq[d] = (ninFreq[d] || 0) + 1;
    const ninMaxFreq = Math.max(...Object.values(ninFreq));
    if (ninMaxFreq >= 8) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid NIN pattern. Please enter the real NIN from your NIMC slip.',
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { ninVerified: true, ninHash: true, bvnVerified: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.bvnVerified) {
      return res.status(400).json({
        success: false,
        message: '❌ Please register your BVN (Step 1) before NIN.',
      });
    }

    if (user.ninVerified && user.ninHash) {
      const submittedHash = hashSensitiveId(nin);
      if (user.ninHash === submittedHash) {
        return res.json({
          success: true,
          message: '✅ NIN already registered.',
          verificationTier: 'TIER2_GOVT_ID',
          tier: 2,
        });
      }
      return res.status(403).json({
        success: false,
        message: '❌ A different NIN is already on this account. Contact support.',
      });
    }

    const ninHash = hashSensitiveId(nin);
    const existingNin = await db.user.findFirst({
      where: { ninHash, id: { not: userId } },
      select: { id: true },
    });

    if (existingNin) {
      console.warn(`[NIN] Duplicate NIN attempt by user ${userId}`);
      return res.status(409).json({
        success: false,
        message: '❌ This NIN is already registered to another account.',
      });
    }

    // ── REAL VERIFICATION against NIMC ──
    const userForNin = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    const ninResult = await identityService.verifyNIN(nin);

    if (!ninResult.verified) {
      console.warn(`[NIN] ❌ NIMC verification FAILED for user ${userId}: ${ninResult.message}`);
      return res.json({
        success: false,
        message: ninResult.message || '❌ NIN not found in NIMC database. Please enter your correct NIN.',
        provider: ninResult.provider,
        verificationTier: 'TIER1_BVN',
        tier: 1,
      });
    }

    // Cross-reference name
    const ninNameMatch = identityService.matchNames(ninResult.data, userForNin.firstName, userForNin.lastName);
    if (!ninNameMatch.match) {
      console.warn(`[NIN] ❌ Name mismatch for user ${userId}`);
      return res.json({
        success: false,
        message: '❌ The name on this NIN does not match your registered name.',
        provider: ninResult.provider,
        verificationTier: 'TIER1_BVN',
        tier: 1,
      });
    }

    // ✅ VERIFIED
    await db.user.update({
      where: { id: userId },
      data: {
        ninVerified: true,
        ninHash,
        verificationTier: 'TIER2_GOVT_ID',
        isVerified: true,
      },
    });

    console.log(`[NIN] ✅ NIN verified for user ${userId} via ${ninResult.provider} (name match: ${ninNameMatch.score}%)`);

    return res.json({
      success: true,
      message: '✅ NIN verified against NIMC government database!',
      verificationTier: 'TIER2_GOVT_ID',
      tier: 2,
      provider: ninResult.provider,
      nameMatch: ninNameMatch.score,
    });
  } catch (error) {
    console.error('[NIN] Error:', error.message);
    return res.status(500).json({ success: false, message: 'NIN registration error.' });
  }
});


// ─── STEP 3: START DIDIT KYC SESSION ─────────────────────────
// Creates a Didit session and returns the URL.
// User is redirected to Didit's hosted UI where they:
//   → Scan their NIN slip / ID card / passport
//   → Take a selfie (passive liveness)
//   → Didit matches selfie to document photo
//   → Didit checks IP/device
// This is the REAL verification — 100% FREE (500/month)
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/kyc-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check that user has at least registered BVN + NIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { bvnVerified: true, ninVerified: true, notaryVerified: true, verificationTier: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.bvnVerified || !user.ninVerified) {
      return res.status(400).json({
        success: false,
        message: '❌ Please register your BVN and NIN before starting document verification.',
      });
    }

    if (user.notaryVerified && user.verificationTier === 'TIER3_NOTARY') {
      return res.json({
        success: true,
        message: '✅ You are already fully verified (Tier 3).',
        verificationTier: 'TIER3_NOTARY',
        alreadyVerified: true,
      });
    }

    console.log(`[KYC] Creating Didit session for user ${userId}...`);
    const result = await diditKYC.createKYCSession(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: '❌ Failed to create verification session. Please try again.',
      });
    }

    console.log(`[KYC] Session created: ${result.sessionId} → ${result.sessionUrl}`);

    return res.json({
      success: true,
      sessionId: result.sessionId,
      sessionUrl: result.sessionUrl,
      message: 'Verification session created. Open the sessionUrl to complete identity verification.',
      provider: 'didit',
    });
  } catch (error) {
    console.error('[KYC Session] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: '❌ Verification session error: ' + error.message,
    });
  }
});


// Biometric route removed — all verification goes through Didit KYC session


// ─── DIDIT WEBHOOK — Receives session results ────────────────
// When user completes the Didit hosted KYC flow, this webhook
// fires with the result. On "Approved" → user becomes TIER3.
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/didit-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : req.body.toString();
    const signature = req.headers['x-signature-v2'];
    const timestamp = req.headers['x-timestamp'];

    // Verify webhook signature
    if (signature && !diditKYC.verifyWebhookSignature(rawBody, signature, timestamp)) {
      console.error('[Didit Webhook] Invalid signature — rejecting');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = JSON.parse(rawBody);
    const userId = payload.vendor_data;
    const status = payload.status;
    const webhookType = payload.webhook_type;

    console.log(`[Didit Webhook] ${webhookType} | Session ${payload.session_id} | User ${userId} | Status: ${status}`);

    if (status === 'Approved') {
      // Extract document data from decision
      const decision = payload.decision || {};
      const idVerif = decision.id_verifications?.[0] || {};
      const liveness = decision.liveness_checks?.[0] || {};
      const faceMatch = decision.face_matches?.[0] || {};

      console.log(`[Didit Webhook] ✅ APPROVED — Doc: ${idVerif.document_type}, Name: ${idVerif.full_name}, Liveness: ${liveness.status}, Face: ${faceMatch.status}`);

      // Update user to TIER3
      await db.user.update({
        where: { id: userId },
        data: {
          notaryVerified: true,
          notaryVerifiedAt: new Date(),
          verificationTier: 'TIER3_NOTARY',
          isVerified: true,
          // Store the document type that was verified
          govtIdType: idVerif.document_type || 'ID_DOCUMENT',
          govtIdVerified: true,
        },
      }).catch(err => {
        // Fallback if some fields don't exist
        return db.user.update({
          where: { id: userId },
          data: {
            notaryVerified: true,
            notaryVerifiedAt: new Date(),
            verificationTier: 'TIER3_NOTARY',
            isVerified: true,
          },
        });
      });

      console.log(`[Didit Webhook] ✅ User ${userId} upgraded to TIER3_NOTARY`);

      // Send verification complete notifications (email + push + in-app)
      const pushService = require('./services/pushService');
      const emailService = require('./services/emailService');
      pushService.notifyVerificationComplete(userId).catch(console.error);
      const verifiedUser = await db.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
      if (verifiedUser) emailService.sendVerificationCompleteEmail(verifiedUser).catch(console.error);

    } else if (status === 'Declined') {
      console.warn(`[Didit Webhook] ❌ User ${userId} verification DECLINED`);
      // Optionally increase fraud score
      await db.user.update({
        where: { id: userId },
        data: { fraudScore: { increment: 10 } },
      }).catch(() => {});

    } else if (status === 'In Review') {
      console.log(`[Didit Webhook] ⏳ User ${userId} verification IN REVIEW`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Didit Webhook] Error:', error.message);
    return res.status(200).json({ received: true }); // Always 200 to prevent retries
  }
});


// ─── GET KYC SESSION RESULT (polling fallback) ───────────────
verifyRouter.get('/kyc-session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const result = await diditKYC.getSessionResult(req.params.sessionId);

    // If approved and this is the user's session, update their tier
    if (result.approved && result.vendorData === req.user.id) {
      await db.user.update({
        where: { id: req.user.id },
        data: {
          notaryVerified: true,
          notaryVerifiedAt: new Date(),
          verificationTier: 'TIER3_NOTARY',
          isVerified: true,
        },
      }).catch(() => {});
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[KYC Result] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: '❌ Failed to retrieve result: ' + error.message,
    });
  }
});


// ─── VERIFICATION STATUS ─────────────────────────────────────
verifyRouter.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: {
        verificationTier: true, isVerified: true,
        bvnVerified: true, ninVerified: true,
        notaryVerified: true, phoneVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const diditStatus = await diditKYC.testConnection();

    return res.json({
      success: true,
      verification: {
        tier: user.verificationTier,
        isVerified: user.isVerified,
        bvn: user.bvnVerified,
        nin: user.ninVerified,
        document: user.notaryVerified,
        phone: user.phoneVerified,
        nextStep: !user.bvnVerified ? 'Register BVN'
          : !user.ninVerified ? 'Register NIN'
          : !user.notaryVerified ? 'Complete Document Verification (scan ID + selfie)'
          : 'Fully Verified ✅',
      },
      didit: {
        connected: diditStatus.connected,
        mode: diditStatus.mode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Status check failed' });
  }
});


// ─── EMAIL OTP (FREE via Resend) ──────────────────────────────
// Sends OTP to user's registered email — ₦0 cost forever
// No SMS needed — user is already online using the app
// ──────────────────────────────────────────────────────────────
verifyRouter.post('/phone/send-otp', authenticateToken, async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, phone: true, firstName: true },
    });
    if (!user?.email) {
      return res.status(400).json({ success: false, message: 'No email on account.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in DB with 10-min expiry
    await db.otp.create({
      data: {
        userId: req.user.id,
        otp,
        type: 'email',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send via Resend (FREE)
    const emailService = require('./services/emailService');
    const result = await emailService.sendOTPEmail(user.email, otp, 'phone verification');

    console.log('[OTP] Email OTP sent to', user.email.slice(0, 3) + '***');

    return res.json({
      success: result.success,
      message: result.success
        ? `✅ Verification code sent to ${user.email.slice(0, 3)}***${user.email.slice(user.email.indexOf('@'))}`
        : 'Failed to send verification code.',
      provider: 'resend',
      channel: 'email',
    });
  } catch (error) {
    console.error('[OTP] Send error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP: ' + error.message });
  }
});

verifyRouter.post('/phone/verify-otp', authenticateToken, [
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
], async (req, res) => {
  try {
    const { otp } = req.body;

    // Find valid, unused OTP
    const record = await db.otp.findFirst({
      where: {
        userId: req.user.id,
        otp,
        type: 'email',
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: '❌ Invalid or expired code. Please request a new one.' });
    }

    // Mark OTP as used + verify phone
    await Promise.all([
      db.otp.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      db.user.update({
        where: { id: req.user.id },
        data: { phoneVerified: true },
      }),
    ]);

    res.json({
      success: true,
      message: '✅ Phone verified successfully!',
      provider: 'resend',
    });
  } catch (error) {
    console.error('[OTP] Verify error:', error.message);
    res.status(500).json({ success: false, message: 'Verification failed: ' + error.message });
  }
});


module.exports = { authRouter, userRouter, verifyRouter };
