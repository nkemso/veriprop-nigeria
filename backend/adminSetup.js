'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — ADMIN ACCOUNT SETUP
 * ================================================================
 * Creates the super_admin account. Run ONCE, then delete or disable.
 *
 * Usage (via API):
 *   POST /api/v1/admin/setup
 *   Body: { "setupKey": "<ADMIN_SETUP_KEY from env>", "email": "...", "password": "...", "firstName": "...", "lastName": "...", "phone": "..." }
 *
 * Security:
 *   - Requires ADMIN_SETUP_KEY env var (one-time secret)
 *   - Checks if super_admin already exists — blocks if so
 *   - Logs setup attempt with IP
 *   - Remove ADMIN_SETUP_KEY from Railway after setup
 * ================================================================
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const config = require('./config');
const { generateTokens } = require('./roleAuth');

const setupRouter = express.Router();

// ─── ONE-TIME ADMIN SETUP ────────────────────────────────────
setupRouter.post('/setup', async (req, res) => {
  try {
    const { setupKey, email, password, firstName, lastName, phone } = req.body;

    // 1. Require setup key from env
    const validKey = process.env.ADMIN_SETUP_KEY;
    if (!validKey) {
      return res.status(403).json({
        success: false,
        message: '⛔ Admin setup is disabled. Set ADMIN_SETUP_KEY in Railway to enable.',
      });
    }

    if (!setupKey || setupKey !== validKey) {
      console.warn(`[ADMIN SETUP] ⛔ Invalid setup key attempt from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: '⛔ Invalid setup key.',
      });
    }

    // 2. Check if super_admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'super_admin' },
      select: { id: true, email: true },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: `⛔ Super admin already exists (${existingAdmin.email}). Only one super_admin is allowed.`,
      });
    }

    // 3. If email provided, check if user exists — upgrade them directly
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      // Upgrade existing user to super_admin
      const upgraded = await db.user.update({
        where: { email },
        data: {
          role: 'super_admin',
          isVerified: true,
          verificationTier: 'TIER3_NOTARY',
          notaryVerified: true,
          bvnVerified: true,
          ninVerified: true,
        },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isVerified: true,
        },
      });

      const tokens = generateTokens(upgraded);
      console.log(`[ADMIN SETUP] ✅ Existing user ${email} upgraded to super_admin from ${req.ip}`);

      return res.json({
        success: true,
        message: `✅ User ${email} upgraded to super_admin. Remove ADMIN_SETUP_KEY from Railway now!`,
        user: upgraded,
        tokens,
        adminUrl: '/admin/dashboard',
      });
    }

    // 4. For new accounts, validate all fields
    if (!password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'New admin account requires: email, password (12+ chars), firstName, lastName, phone',
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Admin password must be at least 12 characters.',
      });
    }

    // 5. Create new super_admin account
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'super_admin',
        isActive: true,
        isVerified: true,
        verificationTier: 'TIER3_NOTARY',
        notaryVerified: true,
        bvnVerified: true,
        ninVerified: true,
        profile: {
          create: {
            displayName: `${firstName} ${lastName}`,
          },
        },
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isVerified: true,
      },
    });

    const tokens = generateTokens(admin);

    console.log(`[ADMIN SETUP] ✅ Super admin created: ${email} from ${req.ip}`);

    return res.status(201).json({
      success: true,
      message: `✅ Super admin account created! IMPORTANT: Remove ADMIN_SETUP_KEY from Railway immediately!`,
      user: admin,
      tokens,
      adminUrl: '/admin/dashboard',
      nextSteps: [
        '1. Remove ADMIN_SETUP_KEY from Railway environment variables',
        '2. Log in at /admin/login with your email and password',
        '3. Use admin dashboard to manage users, properties, and transactions',
      ],
    });
  } catch (error) {
    console.error('[ADMIN SETUP] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Admin setup failed: ' + error.message,
    });
  }
});

// ─── PROMOTE USER TO ADMIN (requires super_admin auth) ───────
setupRouter.post('/promote', async (req, res) => {
  try {
    // This requires authentication — check in server.js
    const { userId, role } = req.body;
    const validRoles = ['admin', 'compliance_officer'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${validRoles.join(', ')}`,
      });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    console.log(`[ADMIN] User ${user.email} promoted to ${role}`);

    return res.json({
      success: true,
      message: `✅ ${user.firstName} ${user.lastName} promoted to ${role}`,
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { setupRouter };
