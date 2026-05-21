'use strict';

/**
 * VERIPROP SECURE CHAT SERVICE
 * - Closed-loop: all messages stay on platform
 * - AI Redaction applied on every message
 * - Messages tied to transactions only
 * - Real-time via WebSockets (Socket.IO)
 */

const express = require('express');
const db = require('../db');
const { requireAuth, requireTier } = require('../middleware/requireAuth');
const { chatRedactionMiddleware } = require('../middleware/aiRedaction');
const { auditLog } = require('../audit/auditLogger');

const chatRouter = express.Router();

// ─── GET ALL ROOMS FOR USER ───────────────────────────────────
chatRouter.get('/rooms', requireAuth, async (req, res) => {
  try {
    const rooms = await db.chatRoom.findMany({
      where: {
        participants: { some: { userId: req.user.id } },
        isActive: true,
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, profile: { select: { avatar: true } } } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        transaction: {
          select: { id: true, status: true, property: { select: { title: true, images: { take: 1 } } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
  }
});

// ─── GET OR CREATE CHAT ROOM FOR TRANSACTION ─────────────────
chatRouter.post('/rooms/transaction/:transactionId', requireAuth, requireTier('TIER1_BVN'), async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, buyerId: true, sellerId: true, agentId: true, status: true },
    });

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const isParty = [transaction.buyerId, transaction.sellerId, transaction.agentId].includes(req.user.id);
    if (!isParty && !['admin', 'super_admin', 'compliance_officer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not a party to this transaction' });
    }

    // Get or create room
    let room = await db.chatRoom.findUnique({ where: { transactionId } });

    if (!room) {
      const participants = [transaction.buyerId, transaction.sellerId];
      if (transaction.agentId) participants.push(transaction.agentId);

      room = await db.chatRoom.create({
        data: {
          transactionId,
          name: `Transaction ${transactionId.slice(-8).toUpperCase()}`,
          participants: {
            createMany: {
              data: [...new Set(participants)].map(uid => ({ userId: uid })),
            },
          },
        },
        include: { participants: true },
      });
    }

    res.json({ success: true, room });
  } catch (err) {
    console.error('[CHAT] Create room error:', err);
    res.status(500).json({ success: false, message: 'Failed to create chat room' });
  }
});

// ─── GET MESSAGES ─────────────────────────────────────────────
chatRouter.get('/rooms/:roomId/messages', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is in room
    const participant = await db.chatParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: req.user.id } },
    });
    if (!participant && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not a member of this room' });
    }

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where: { roomId },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, role: true, profile: { select: { avatar: true } } },
          },
        },
      }),
      db.chatMessage.count({ where: { roomId } }),
    ]);

    // Mark as read
    db.chatParticipant.update({
      where: { roomId_userId: { roomId, userId: req.user.id } },
      data: { lastReadAt: new Date() },
    }).catch(() => {});

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// ─── SEND MESSAGE (with redaction middleware) ─────────────────
chatRouter.post(
  '/rooms/:roomId/messages',
  requireAuth,
  requireTier('TIER1_BVN'),
  chatRedactionMiddleware,    // ← AI Redaction applied here
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { content, originalContent, isRedacted, messageType = 'text', fileUrl, fileName } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ success: false, message: 'Message content required' });
      }

      // Verify participant
      const participant = await db.chatParticipant.findUnique({
        where: { roomId_userId: { roomId, userId: req.user.id } },
      });
      if (!participant) {
        return res.status(403).json({ success: false, message: 'Not a member of this room' });
      }

      const message = await db.chatMessage.create({
        data: {
          roomId,
          senderId: req.user.id,
          content,
          originalContent: isRedacted ? originalContent : null,
          messageType,
          isRedacted: !!isRedacted,
          redactedAt: isRedacted ? new Date() : null,
          redactedReason: isRedacted ? 'Policy violation: off-platform contact attempt' : null,
          redactedBy: isRedacted ? 'system' : null,
          fileUrl,
          fileName,
        },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, profile: { select: { avatar: true } } },
          },
        },
      });

      // Update room timestamp
      db.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } }).catch(() => {});

      // Audit if redacted
      if (isRedacted) {
        await auditLog({
          action: 'chat_redacted',
          userId: req.user.id,
          resourceType: 'chat_message',
          resourceId: message.id,
          description: `Message redacted in room ${roomId}`,
          metadata: { violations: req.redactionResult?.violations, riskLevel: req.redactionResult?.riskLevel },
          ipAddress: req.ip,
        });
      }

      res.status(201).json({
        success: true,
        message,
        redactionNotice: isRedacted
          ? '⚠️ Your message contained off-platform contact information and was redacted per VeriProp policy.'
          : null,
      });
    } catch (err) {
      console.error('[CHAT] Send message error:', err);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }
);

// ─── ADMIN: GET FLAGGED MESSAGES ──────────────────────────────
chatRouter.get('/admin/flagged', requireAuth, async (req, res) => {
  if (!['admin', 'super_admin', 'compliance_officer'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const flagged = await db.chatMessage.findMany({
    where: { isRedacted: true },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, email: true } },
      room: { select: { id: true, transactionId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ success: true, flagged, total: flagged.length });
});

module.exports = { chatRouter };
