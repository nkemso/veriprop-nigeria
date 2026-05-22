'use strict';

const express = require('express');
const axios = require('axios');
const db = require('./db');
const config = require('./config');
const { requireAuth: authenticateToken, requireRole, requireTier, requireAdmin } = require('./middleware/requireAuth');
const { initiateEscrow, fundEscrow, requestRelease, releaseEscrow, initiateDispute } = require('./escrowEngine');
const { createSplitPlan, recordInstallment } = require('./splitEscrowEngine');

const transactionRouter = express.Router();
const escrowRouter = express.Router();
const paymentRouter = express.Router();

// ============================================
// TRANSACTION ROUTES
// ============================================

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
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

transactionRouter.post('/', authenticateToken, async (req, res) => {
  try {
    const { propertyId, type, paymentPlan, installments } = req.body;

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: { owner: true },
    });

    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.ownerId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot transact on your own property' });
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

    res.status(201).json({ success: true, transaction, escrow: escrowResult });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate transaction' });
  }
});

// ============================================
// ESCROW ROUTES
// ============================================

escrowRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const escrow = await db.escrow.findUnique({
      where: { id: req.params.id },
      include: {
        transaction: { include: { property: true } },
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!escrow) return res.status(404).json({ success: false, message: 'Escrow not found' });
    if (escrow.buyerId !== req.user.id && escrow.sellerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.json({ success: true, escrow });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch escrow' });
  }
});

escrowRouter.post('/:id/release', authenticateToken, async (req, res) => {
  try {
    const result = await requestRelease(req.params.id, req.user.id, req.body.conditions);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

escrowRouter.post('/:id/dispute', authenticateToken, async (req, res) => {
  try {
    const { reason, evidence } = req.body;
    const result = await initiateDispute(req.params.id, req.user.id, reason, evidence);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// PAYMENT ROUTES
// ============================================

// Initialize Paystack payment
paymentRouter.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const { amount, email, transactionId, metadata } = req.body;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email || req.user.email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference: `VP-${transactionId}-${Date.now()}`,
        callback_url: `${config.app.frontendUrl}/payment/callback`,
        metadata: {
          transactionId,
          userId: req.user.id,
          ...metadata,
        },
      },
      { headers: { Authorization: `Bearer ${config.payments.paystack.secretKey}` } }
    );

    res.json({ success: true, data: response.data.data });
  } catch (error) {
    console.error('Payment init error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to initialize payment' });
  }
});

// Verify Paystack payment
paymentRouter.get('/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${req.params.reference}`,
      { headers: { Authorization: `Bearer ${config.payments.paystack.secretKey}` } }
    );

    const data = response.data.data;
    if (data.status === 'success') {
      const transactionId = data.metadata?.transactionId;
      if (transactionId) {
        await db.transaction.update({
          where: { id: transactionId },
          data: { status: 'paid', paymentReference: data.reference, paidAt: new Date() },
        });

        const escrow = await db.escrow.findFirst({ where: { transactionId } });
        if (escrow) await fundEscrow(escrow.id, data.reference);
      }
    }

    res.json({ success: true, status: data.status, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// Paystack Webhook
paymentRouter.post('/webhook/paystack', async (req, res) => {
  try {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', config.payments.paystack.webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log(`[WEBHOOK] Paystack event: ${event}`);

    if (event === 'charge.success') {
      const transactionId = data.metadata?.transactionId;
      if (transactionId) {
        await db.transaction.update({
          where: { id: transactionId },
          data: { status: 'paid', paymentReference: data.reference },
        });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

module.exports = { transactionRouter, escrowRouter, paymentRouter };
