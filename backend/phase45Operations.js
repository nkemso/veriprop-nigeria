'use strict';

const express = require('express');
const db = require('./db');
const { authenticateToken, requireRole, ROLES } = require('./roleAuth');
const { releaseEscrow, refundEscrow } = require('./escrowEngine');

const adminRouter = express.Router();
const portfolioRouter = express.Router();
const supportRouter = express.Router();
const notificationRouter = express.Router();

// ============================================
// ADMIN ROUTES (Phase 4)
// ============================================

adminRouter.use(authenticateToken);
adminRouter.use(requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.COMPLIANCE_OFFICER));

// Dashboard stats
adminRouter.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers, totalProperties, totalTransactions,
      pendingReview, activeEscrows, totalRevenue,
    ] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.property.count({ where: { status: 'active' } }),
      db.transaction.count(),
      db.property.count({ where: { moderationStatus: 'review_required' } }),
      db.escrow.count({ where: { status: { in: ['funded', 'inspection_pending'] } } }),
      db.escrow.aggregate({
        where: { status: 'released' },
        _sum: { fee: true },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        totalTransactions,
        pendingReview,
        activeEscrows,
        totalRevenue: totalRevenue._sum.fee || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

// List pending properties for review
adminRouter.get('/properties/pending', async (req, res) => {
  try {
    const properties = await db.property.findMany({
      where: { moderationStatus: 'review_required' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
        images: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, properties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending properties' });
  }
});

// Approve/Reject property
adminRouter.patch('/properties/:id/moderate', async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const updated = await db.property.update({
      where: { id: req.params.id },
      data: {
        moderationStatus: action === 'approve' ? 'approved' : 'rejected',
        status: action === 'approve' ? 'active' : 'rejected',
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationReason: reason,
      },
    });

    res.json({ success: true, property: updated, action });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Moderation failed' });
  }
});

// List all users
adminRouter.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit),
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true,
          role: true, isVerified: true, isActive: true, isBanned: true, createdAt: true,
          _count: { select: { properties: true, transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ]);

    res.json({ success: true, users, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Ban/Unban user
adminRouter.patch('/users/:id/ban', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const updated = await db.user.update({
      where: { id: req.params.id },
      data: { isBanned: ban, banReason: reason, bannedAt: ban ? new Date() : null },
    });
    res.json({ success: true, message: ban ? 'User banned' : 'User unbanned', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// ─── ROLE MANAGEMENT (Super Admin only) ──────────────────────
// Change user role — only super_admin can promote/demote
adminRouter.patch('/users/:id/role', requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { role } = req.body;
    const targetId = req.params.id;

    // Validate role
    const promotableRoles = ['admin', 'compliance_officer', 'agent', 'agency', 'developer', 'buyer', 'seller', 'tenant', 'landlord', 'lawyer', 'surveyor'];
    if (!promotableRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${promotableRoles.join(', ')}`,
        note: 'super_admin role cannot be assigned via this endpoint.',
      });
    }

    // Prevent self-demotion
    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '⛔ You cannot change your own role.',
      });
    }

    // Prevent demoting another super_admin
    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { role: true, email: true, firstName: true, lastName: true },
    });

    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (target.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '⛔ Cannot change the role of a super_admin.',
      });
    }

    const oldRole = target.role;

    const updated = await db.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isVerified: true, isActive: true,
      },
    });

    console.log(`[ADMIN] Role change: ${target.email} ${oldRole} → ${role} by ${req.user.email || req.user.id}`);

    res.json({
      success: true,
      message: `✅ ${target.firstName} ${target.lastName} role changed from ${oldRole} to ${role}`,
      user: updated,
    });
  } catch (error) {
    console.error('[ADMIN] Role change error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to change role' });
  }
});

// ─── LIST ADMIN TEAM ─────────────────────────────────────────
adminRouter.get('/team', async (req, res) => {
  try {
    const adminRoles = ['super_admin', 'admin', 'compliance_officer'];
    const team = await db.user.findMany({
      where: { role: { in: adminRoles } },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isVerified: true, isActive: true, isBanned: true,
        lastLoginAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      team,
      roles: {
        super_admin: 'Full system access. Can manage all users, properties, transactions, and other admins.',
        admin: 'Can moderate properties, manage users (ban/unban), handle escrow and disputes.',
        compliance_officer: 'Can review flagged content, audit transactions, and manage compliance.',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin team' });
  }
});

// ─── VERIFY USER MANUALLY (Admin) ────────────────────────────
adminRouter.patch('/users/:id/verify', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { tier } = req.body;
    const validTiers = ['TIER1_BVN', 'TIER2_GOVT_ID', 'TIER3_NOTARY'];

    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tier. Allowed: ${validTiers.join(', ')}`,
      });
    }

    const data = {
      verificationTier: tier,
      isVerified: true,
    };

    if (tier === 'TIER1_BVN') data.bvnVerified = true;
    if (tier === 'TIER2_GOVT_ID') { data.bvnVerified = true; data.ninVerified = true; }
    if (tier === 'TIER3_NOTARY') {
      data.bvnVerified = true;
      data.ninVerified = true;
      data.notaryVerified = true;
      data.notaryVerifiedAt = new Date();
    }

    const updated = await db.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, verificationTier: true, isVerified: true,
      },
    });

    console.log(`[ADMIN] Manual verification: ${updated.email} → ${tier} by ${req.user.email || req.user.id}`);

    res.json({
      success: true,
      message: `✅ ${updated.firstName} ${updated.lastName} manually verified to ${tier}`,
      user: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify user' });
  }
});

// ─── DEACTIVATE / REACTIVATE USER ────────────────────────────
adminRouter.patch('/users/:id/active', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { active } = req.body;

    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: '⛔ Cannot deactivate your own account.' });
    }

    const target = await db.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
    if (target?.role === 'super_admin') {
      return res.status(403).json({ success: false, message: '⛔ Cannot deactivate a super_admin.' });
    }

    const updated = await db.user.update({
      where: { id: req.params.id },
      data: { isActive: !!active },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
    });

    res.json({
      success: true,
      message: active ? `✅ ${updated.firstName} reactivated` : `⛔ ${updated.firstName} deactivated`,
      user: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

// Release escrow (admin)
adminRouter.post('/escrow/:id/release', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const result = await releaseEscrow(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Refund escrow (admin)
adminRouter.post('/escrow/:id/refund', requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const result = await refundEscrow(req.params.id, req.user.id, req.body.reason);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// PORTFOLIO ROUTES (Phase 5)
// ============================================

portfolioRouter.use(authenticateToken);

portfolioRouter.get('/', async (req, res) => {
  try {
    const [properties, transactions, favorites] = await Promise.all([
      db.property.findMany({
        where: { ownerId: req.user.id, deletedAt: null },
        include: { images: { take: 1 }, _count: { select: { views: true, favorites: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.transaction.findMany({
        where: { OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }] },
        include: { property: { select: { id: true, title: true, images: { take: 1 } } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.favorite.findMany({
        where: { userId: req.user.id },
        include: { property: { include: { images: { take: 1 } } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPortfolioValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);

    res.json({
      success: true,
      portfolio: {
        properties,
        transactions,
        favorites,
        stats: {
          totalProperties: properties.length,
          totalPortfolioValue,
          activeListings: properties.filter(p => p.status === 'active').length,
          totalViews: properties.reduce((sum, p) => sum + p._count.views, 0),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
  }
});

// ============================================
// SUPPORT ROUTES
// ============================================

supportRouter.post('/ticket', authenticateToken, async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    const ticket = await db.supportTicket.create({
      data: {
        userId: req.user.id,
        subject,
        message,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open',
        ticketNumber: `VP-${Date.now()}`,
      },
    });
    res.status(201).json({ success: true, ticket, message: 'Support ticket created. We will respond within 24 hours.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
});

supportRouter.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await db.supportTicket.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// ============================================
// NOTIFICATION ROUTES
// ============================================

notificationRouter.use(authenticateToken);

notificationRouter.get('/', async (req, res) => {
  try {
    const notifications = await db.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await db.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

notificationRouter.patch('/read-all', async (req, res) => {
  try {
    await db.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

module.exports = { adminRouter, portfolioRouter, supportRouter, notificationRouter };

// ─── DISPUTES (Admin) ─────────────────────────────────────────
adminRouter.get('/disputes', async (req, res) => {
  try {
    const disputes = await db.dispute.findMany({
      where: { status: { not: 'closed' } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ success: true, disputes });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch disputes' }); }
});

adminRouter.post('/disputes/:id/resolve', async (req, res) => {
  try {
    const { resolution, outcome } = req.body;
    const dispute = await db.dispute.update({
      where: { id: req.params.id },
      data: { status: `resolved_${outcome}`, resolution, resolvedBy: req.user.id, resolvedAt: new Date() },
    });
    res.json({ success: true, dispute });
  } catch { res.status(500).json({ success: false, message: 'Failed to resolve dispute' }); }
});

// ─── AUDIT TRAIL (Admin) ──────────────────────────────────────
adminRouter.get('/audit', async (req, res) => {
  try {
    const { getAuditTrail } = require('./audit/auditLogger');
    const result = await getAuditTrail(req.query, parseInt(req.query.page) || 1, 50);
    res.json({ success: true, ...result });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch audit trail' }); }
});
