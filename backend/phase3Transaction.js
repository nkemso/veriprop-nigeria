'use strict';

const express = require('express');
const axios = require('axios');
const db = require('./db');
const config = require('./config');
const { requireAuth: authenticateToken, requireRole, requireTier, requireAdmin } = require('./middleware/requireAuth');
const { initiateEscrow, fundEscrow, requestRelease, releaseEscrow, initiateDispute } = require('./escrowEngine');
const { createSplitPlan, recordInstallment } = require('./splitEscrowEngine');
const { auditLog } = require('./audit/auditLogger');

const transactionRouter = express.Router();
const escrowRouter = express.Router();
const paymentRouter = express.Router();

// ============================================================
// TRANSACTION ROUTES — ALL protected by requireAuth + TIER1
// ============================================================

// GET /api/v1/transactions — list user transactions
transactionRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {
      OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
      ...(status && { status }),
    };

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true, price: true, images: { take: 1 } } },
          buyer: { select: { id: true, firstName: true, lastName: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          escrow: true,
        },
      }),
      db.transaction.count({ where }),
    ]);

    res.json({ success: true, transactions, total, page: parseInt(page) });
  } catch (error) {
    console.error('[TX] List error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// GET /api/v1/transactions/:id — single transaction
transactionRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tx = await db.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        property: { include: { images: { take: 3 } } },
        buyer: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true } },
        escrow: { include: { multiSigSignatures: true, splitReceipts: true } },
        documents: true,
        chatRoom: { select: { id: true } },
      },
    });

    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    // Only parties + admin can view
    const isParty = [tx.buyerId, tx.sellerId].includes(req.user.id);
    const isAdmin = ['admin', 'super_admin', 'compliance_officer'].includes(req.user.role);
    if (!isParty && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, transaction: tx });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
  }
});

// POST /api/v1/transactions — initiate new transaction (TIER2 required)
transactionRouter.post('/',
  authenticateToken,
  requireTier('TIER2_GOVT_ID'),
  async (req, res) => {
    try {
      const { propertyId, type, paymentPlan, installments } = req.body;

      const property = await db.property.findUnique({
        where: { id: propertyId, status: 'active', deletedAt: null },
        include: { owner: true },
      });

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found or inactive' });
      }
      if (property.ownerId === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot transact on your own property' });
      }

      // Check no duplicate active transaction
      const existing = await db.transaction.findFirst({
        where: {
          propertyId,
          buyerId: req.user.id,
          status: { notIn: ['cancelled', 'refunded', 'completed'] },
        },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You already have an active transaction for this property' });
      }

      const transaction = await db.transaction.create({
        data: {
          propertyId,
          buyerId: req.user.id,
          sellerId: property.ownerId,
          amount: property.price,
          type: type || property.listingType,
          status: 'initiated',
          paymentPlan: paymentPlan || 'full',
        },
      });

      let escrowResult;
      if (paymentPlan === 'installment' && installments) {
        escrowResult = await createSplitPlan({
          propertyId,
          buyerId: req.user.id,
          sellerId: property.ownerId,
          totalAmount: property.price,
          installments: parseInt(installments),
          startDate: new Date(),
        });
      } else {
        escrowResult = await initiateEscrow({
          transactionId: transaction.id,
          buyerId: req.user.id,
          sellerId: property.ownerId,
          amount: property.price,
          propertyId,
          type: property.listingType,
        });
      }

      // 🔒 IMMUTABLE AUDIT LOG
      await auditLog({
        action: 'transaction_initiated',
        userId: req.user.id,
        transactionId: transaction.id,
        resourceType: 'transaction',
        resourceId: transaction.id,
        description: `Transaction initiated by ${req.user.email} for property ${propertyId}. Amount: ₦${property.price.toLocaleString()}`,
        metadata: { propertyId, amount: property.price, paymentPlan, sellerId: property.ownerId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ success: true, transaction, escrow: escrowResult });
    } catch (error) {
      console.error('[TX] Create error:', error);
      res.status(500).json({ success: false, message: 'Failed to initiate transaction' });
    }
  }
);

// PATCH /api/v1/transactions/:id/approve — buyer approves transaction progress
// ✅ AUDIT GAP 1 FIX: This endpoint was missing
transactionRouter.patch('/:id/approve',
  authenticateToken,
  requireTier('TIER2_GOVT_ID'),
  async (req, res) => {
    try {
      const { stage, notes } = req.body; // stage: 'inspection' | 'documents' | 'release'

      const tx = await db.transaction.findUnique({
        where: { id: req.params.id },
        include: { escrow: true },
      });

      if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
      if (tx.buyerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Only the buyer can approve transaction stages' });
      }

      const validStages = {
        inspection: {
          from: ['escrow_funded'],
          to: 'inspection_passed',
          escrowStatus: 'inspection_passed',
          description: 'Buyer approved property inspection',
        },
        documents: {
          from: ['inspection_passed'],
          to: 'docs_verified',
          escrowStatus: 'locked',
          description: 'Buyer approved document verification',
        },
        release: {
          from: ['docs_verified'],
          to: 'multisig_pending',
          escrowStatus: 'multisig_pending',
          description: 'Buyer requested fund release — awaiting multi-sig',
        },
      };

      const stageConfig = validStages[stage];
      if (!stageConfig) {
        return res.status(400).json({
          success: false,
          message: `Invalid stage. Must be one of: ${Object.keys(validStages).join(', ')}`,
        });
      }

      if (!stageConfig.from.includes(tx.status)) {
        return res.status(409).json({
          success: false,
          message: `Cannot approve '${stage}' from current status '${tx.status}'. Expected: ${stageConfig.from.join(' or ')}`,
        });
      }

      // Update transaction status
      const updated = await db.transaction.update({
        where: { id: tx.id },
        data: { status: stageConfig.to, updatedAt: new Date() },
      });

      // Update escrow status
      if (tx.escrow) {
        await db.escrow.update({
          where: { id: tx.escrow.id },
          data: { status: stageConfig.escrowStatus, updatedAt: new Date() },
        });
      }

      // 🔒 IMMUTABLE AUDIT LOG
      await auditLog({
        action: 'transaction_initiated',
        userId: req.user.id,
        transactionId: tx.id,
        resourceType: 'transaction',
        resourceId: tx.id,
        description: `${stageConfig.description}. Notes: ${notes || 'none'}`,
        metadata: { stage, fromStatus: tx.status, toStatus: stageConfig.to, notes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        transaction: updated,
        message: `Stage '${stage}' approved successfully. Transaction is now: ${stageConfig.to}`,
        nextStep: stage === 'release'
          ? 'Both parties must now sign the Multi-Sig release'
          : `Proceed to ${stage === 'inspection' ? 'document verification' : 'fund release'}`,
      });
    } catch (error) {
      console.error('[TX] Approve error:', error);
      res.status(500).json({ success: false, message: 'Failed to approve transaction stage' });
    }
  }
);

// PATCH /api/v1/transactions/:id/cancel — cancel a transaction
transactionRouter.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const tx = await db.transaction.findUnique({ where: { id: req.params.id }, include: { escrow: true } });

    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const isParty = [tx.buyerId, tx.sellerId].includes(req.user.id);
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isParty && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (['completed', 'cancelled'].includes(tx.status)) {
      return res.status(409).json({ success: false, message: `Cannot cancel a ${tx.status} transaction` });
    }
    if (tx.escrow?.status === 'funded') {
      return res.status(409).json({
        success: false,
        message: 'Cannot cancel — escrow is funded. Please raise a dispute instead.',
      });
    }

    const updated = await db.transaction.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason },
    });

    await auditLog({
      action: 'admin_action',
      userId: req.user.id,
      transactionId: tx.id,
      resourceType: 'transaction',
      resourceId: tx.id,
      description: `Transaction cancelled. Reason: ${reason || 'Not provided'}`,
      metadata: { cancelledBy: req.user.id, reason },
      ipAddress: req.ip,
    });

    res.json({ success: true, transaction: updated, message: 'Transaction cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel transaction' });
  }
});

// ============================================================
// ESCROW ROUTES
// ============================================================

escrowRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const escrow = await db.escrow.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: { include: { property: { select: { title: true, address: true } } } },
        buyer: { select: { id: true, firstName: true, lastName: true, verificationTier: true } },
        seller: { select: { id: true, firstName: true, lastName: true, verificationTier: true } },
        multiSigSignatures: {
          include: { signer: { select: { firstName: true, lastName: true, role: true } } },
        },
        splitReceipts: true,
        disputes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });

    const isParty = [escrow.buyerId, escrow.sellerId].includes(req.user.id);
    const isAdmin = ['admin', 'super_admin', 'compliance_officer'].includes(req.user.role);
    if (!isParty && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, escrow });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch escrow' });
  }
});

escrowRouter.post('/:id/release', authenticateToken, requireTier('TIER2_GOVT_ID'), async (req, res) => {
  try {
    const result = await requestRelease(req.params.id, req.user.id, req.body.conditions);
    await auditLog({
      action: 'escrow_funded',
      userId: req.user.id,
      resourceType: 'escrow',
      resourceId: req.params.id,
      description: `Release requested by ${req.user.role} for escrow ${req.params.id}`,
      ipAddress: req.ip,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

escrowRouter.post('/:id/dispute', authenticateToken, async (req, res) => {
  try {
    const { reason, evidence } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Dispute reason is required' });
    const result = await initiateDispute(req.params.id, req.user.id, reason, evidence);
    await auditLog({
      action: 'dispute_opened',
      userId: req.user.id,
      resourceType: 'escrow',
      resourceId: req.params.id,
      description: `Dispute opened: ${reason.substring(0, 100)}`,
      ipAddress: req.ip,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// PAYMENT ROUTES
// ============================================================

// ════════════════════════════════════════════════════════════
// PAYMENT ROUTES — VeriProp Fee Engine
// ════════════════════════════════════════════════════════════
// Fee Structure:
//   WITH AGENT:    Buyer pays property + agent(5-10%) + platform(2.5%)
//   DIRECT LISTING: Buyer pays property + VeriProp(5%, acting as agent)
//   Landlord ALWAYS gets 100% of property price
// ════════════════════════════════════════════════════════════

const paymentService = require('./services/paymentService');

// ─── FEE CALCULATOR — Preview fees before payment ────────────
paymentRouter.post('/calculate-fees', authenticateToken, async (req, res) => {
  try {
    const { propertyPrice, agentRate, hasAgent } = req.body;
    if (!propertyPrice) {
      return res.status(400).json({ success: false, message: 'propertyPrice required' });
    }

    const fees = paymentService.calculateFees(propertyPrice, agentRate, hasAgent !== false);
    res.json({ success: true, fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── LIST BANKS — For bank account setup ─────────────────────
paymentRouter.get('/banks', authenticateToken, async (req, res) => {
  try {
    const banks = await paymentService.listBanks();
    res.json({ success: true, banks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── VERIFY BANK ACCOUNT — Resolve account name ──────────────
paymentRouter.post('/verify-bank', authenticateToken, async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ success: false, message: 'accountNumber and bankCode required' });
    }
    const result = await paymentService.verifyBankAccount(accountNumber, bankCode);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── INITIALIZE PAYMENT — Buyer starts payment ──────────────
paymentRouter.post('/initialize', authenticateToken, requireTier('TIER3_NOTARY'), async (req, res) => {
  try {
    const { transactionId, propertyPrice, agentRate, hasAgent } = req.body;
    if (!transactionId || !propertyPrice) {
      return res.status(400).json({ success: false, message: 'transactionId and propertyPrice required' });
    }

    // Get buyer's email
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: { email: true },
    });

    // Get transaction details
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: { property: { select: { title: true } } },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.buyerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the buyer can initiate payment' });
    }

    const result = await paymentService.initializeTransaction({
      email: user.email,
      propertyPrice,
      agentRate: agentRate || 0.05,
      hasAgent: hasAgent !== false && !!transaction.agentId,
      transactionId,
      propertyTitle: transaction.property?.title || 'Property',
    });

    await auditLog({
      action: 'payment_initialized',
      userId: req.user.id,
      transactionId,
      resourceType: 'payment',
      description: `Payment initialized: ₦${result.fees.totalBuyerPays.toLocaleString()} (Property: ₦${propertyPrice.toLocaleString()} + Fees)`,
      metadata: { reference: result.reference, fees: result.fees },
      ipAddress: req.ip,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[PAY] Init error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to initialize payment: ' + error.message });
  }
});

// ─── VERIFY PAYMENT — Confirm payment was successful ─────────
paymentRouter.get('/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const result = await paymentService.verifyTransaction(req.params.reference);

    if (result.success && result.metadata?.transaction_id) {
      const transactionId = result.metadata.transaction_id;

      await db.transaction.update({
        where: { id: transactionId },
        data: { status: 'escrow_funded', paymentReference: result.reference, paidAt: new Date(result.paidAt) },
      }).catch(err => console.error('[PAY] Transaction update:', err.message));

      // Update escrow
      await db.escrow.updateMany({
        where: { transactionId },
        data: {
          status: 'funded',
          paymentReference: result.reference,
          fundedAt: new Date(),
          totalDeposited: result.amount,
          platformFee: result.metadata.platform_fee || 0,
          agentCommission: result.metadata.agent_commission || 0,
          vatAmount: result.metadata.vat_amount || 0,
          netSellerAmount: result.metadata.property_price || 0,
        },
      }).catch(err => console.error('[PAY] Escrow update:', err.message));

      await auditLog({
        action: 'escrow_funded',
        userId: req.user.id,
        transactionId,
        resourceType: 'escrow',
        description: `Payment verified: ₦${result.amount.toLocaleString()}. Ref: ${result.reference}`,
        metadata: { reference: result.reference, amount: result.amount },
        ipAddress: req.ip,
      });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment verification failed: ' + error.message });
  }
});

// ─── PAYSTACK WEBHOOK — Receives payment events ─────────────
paymentRouter.post('/webhook', async (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-paystack-signature'];

    if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
      console.error('[PAY] ⛔ Invalid Paystack webhook signature');
      return res.sendStatus(401);
    }

    const { event, data } = req.body;
    console.log(`[PAY] Webhook: ${event}`);

    await paymentService.handlePaymentWebhook(event, data);

    res.sendStatus(200);
  } catch (error) {
    console.error('[PAY] Webhook error:', error.message);
    res.sendStatus(200); // Always 200 to prevent retries
  }
});

// ─── RELEASE ESCROW — Admin releases funds to landlord ───────
paymentRouter.post('/escrow/:id/release', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await paymentService.releaseEscrow(req.params.id, req.user.id);

    await auditLog({
      action: 'escrow_released',
      userId: req.user.id,
      resourceType: 'escrow',
      resourceId: req.params.id,
      description: `Escrow released by admin ${req.user.id}`,
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── REFUND — Return funds to buyer ──────────────────────────
paymentRouter.post('/refund', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reference, amount } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Payment reference required' });
    }

    const result = await paymentService.refundTransaction(reference, amount);

    await auditLog({
      action: 'payment_refunded',
      userId: req.user.id,
      resourceType: 'payment',
      description: `Refund processed: ${reference}`,
      metadata: { reference, amount },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { transactionRouter, escrowRouter, paymentRouter };
