'use strict';

const express = require('express');
const db = require('./db');
const { authenticateToken } = require('./roleAuth');

const legalRouter = express.Router();

// Get legal documents (terms, privacy, etc.)
legalRouter.get('/documents', async (req, res) => {
  try {
    const { type } = req.query;
    const legalContent = require('./legalContentMaster');
    const doc = legalContent[type] || legalContent.terms;
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
});

// Accept terms
legalRouter.post('/accept', authenticateToken, async (req, res) => {
  try {
    const { documentType, version } = req.body;
    await db.legalAcceptance.create({
      data: {
        userId: req.user.id,
        documentType,
        version,
        acceptedAt: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    res.json({ success: true, message: 'Terms accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record acceptance' });
  }
});

// Generate property agreement
legalRouter.post('/agreement/generate', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        property: true,
        buyer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        seller: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const agreement = generatePropertyAgreement(transaction);

    const doc = await db.legalDocument.create({
      data: {
        transactionId,
        type: 'property_agreement',
        content: agreement,
        version: '1.0',
        status: 'draft',
      },
    });

    res.json({ success: true, document: doc, preview: agreement.substring(0, 500) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate agreement' });
  }
});

const generatePropertyAgreement = (transaction) => {
  const date = new Date().toLocaleDateString('en-NG', { dateStyle: 'long' });
  return `
PROPERTY ${transaction.type.toUpperCase()} AGREEMENT

This agreement is entered into on ${date} between:

SELLER: ${transaction.seller.firstName} ${transaction.seller.lastName}
BUYER: ${transaction.buyer.firstName} ${transaction.buyer.lastName}

PROPERTY: ${transaction.property.title}
ADDRESS: ${transaction.property.address}, ${transaction.property.lga}, ${transaction.property.state}
AMOUNT: ₦${transaction.amount.toLocaleString()}

This transaction is secured and verified by VeriPro Nigeria.
Transaction ID: ${transaction.id}
  `.trim();
};

module.exports = { legalRouter };
