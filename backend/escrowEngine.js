'use strict';

const config = require('./config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================
// VERIPRO ESCROW ENGINE
// Secure Property Transaction Management
// ============================================

const ESCROW_STATUS = {
  INITIATED: 'initiated',
  FUNDED: 'funded',
  INSPECTION_PENDING: 'inspection_pending',
  INSPECTION_PASSED: 'inspection_passed',
  DOCUMENTS_VERIFIED: 'documents_verified',
  RELEASE_REQUESTED: 'release_requested',
  RELEASED: 'released',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

const ESCROW_FEES = {
  percentage: 0.015, // 1.5% VeriPro fee
  minFee: 5000,      // Minimum ₦5,000
  maxFee: 500000,    // Maximum ₦500,000
};

// Calculate escrow fee
const calculateFee = (amount) => {
  const fee = amount * ESCROW_FEES.percentage;
  return Math.min(Math.max(fee, ESCROW_FEES.minFee), ESCROW_FEES.maxFee);
};

// Initiate escrow
const initiateEscrow = async ({ transactionId, buyerId, sellerId, amount, propertyId, type }) => {
  try {
    const fee = calculateFee(amount);
    const totalAmount = amount + fee;

    const escrow = await prisma.escrow.create({
      data: {
        transactionId,
        buyerId,
        sellerId,
        propertyId,
        amount,
        fee,
        totalAmount,
        type: type || 'sale',
        status: ESCROW_STATUS.INITIATED,
        timeline: {
          initiated: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      success: true,
      escrow,
      paymentDetails: {
        amount: totalAmount,
        breakdown: {
          propertyAmount: amount,
          veriproFee: fee,
          total: totalAmount,
        },
        bankAccount: config.payments.escrow.bankAccount,
        bankCode: config.payments.escrow.bankCode,
        reference: `VP-ESC-${escrow.id}`,
      },
    };
  } catch (error) {
    console.error('Escrow initiation error:', error);
    throw new Error('Failed to initiate escrow');
  }
};

// Fund escrow (payment confirmed)
const fundEscrow = async (escrowId, paymentReference) => {
  try {
    const escrow = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: ESCROW_STATUS.FUNDED,
        paymentReference,
        fundedAt: new Date(),
        timeline: {
          update: { funded: new Date().toISOString() },
        },
      },
    });

    // Notify both parties
    await notifyEscrowParties(escrow, 'funded');

    return { success: true, escrow };
  } catch (error) {
    throw new Error('Failed to fund escrow');
  }
};

// Request escrow release (buyer approves)
const requestRelease = async (escrowId, buyerId, conditions = {}) => {
  try {
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });

    if (!escrow) throw new Error('Escrow not found');
    if (escrow.buyerId !== buyerId) throw new Error('Unauthorized');
    if (escrow.status !== ESCROW_STATUS.INSPECTION_PASSED &&
        escrow.status !== ESCROW_STATUS.DOCUMENTS_VERIFIED) {
      throw new Error('Cannot release escrow at current stage');
    }

    const updated = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: ESCROW_STATUS.RELEASE_REQUESTED,
        releaseConditions: conditions,
        releaseRequestedAt: new Date(),
      },
    });

    return { success: true, escrow: updated };
  } catch (error) {
    throw error;
  }
};

// Release escrow funds to seller
const releaseEscrow = async (escrowId, adminId) => {
  try {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { seller: true },
    });

    if (!escrow) throw new Error('Escrow not found');
    if (escrow.status !== ESCROW_STATUS.RELEASE_REQUESTED) {
      throw new Error('Escrow not in releasable state');
    }

    // Process payment to seller via Paystack
    const paymentResult = await processSellerPayout(escrow);

    const updated = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: ESCROW_STATUS.RELEASED,
        releasedAt: new Date(),
        releasedBy: adminId,
        payoutReference: paymentResult.reference,
      },
    });

    await notifyEscrowParties(updated, 'released');

    return { success: true, escrow: updated, payout: paymentResult };
  } catch (error) {
    throw error;
  }
};

// Initiate dispute
const initiateDispute = async (escrowId, userId, reason, evidence = []) => {
  try {
    const escrow = await prisma.escrow.findUnique({ where: { id: escrowId } });

    if (!escrow) throw new Error('Escrow not found');
    if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
      throw new Error('Unauthorized');
    }

    const dispute = await prisma.dispute.create({
      data: {
        escrowId,
        initiatedBy: userId,
        reason,
        evidence,
        status: 'open',
      },
    });

    await prisma.escrow.update({
      where: { id: escrowId },
      data: { status: ESCROW_STATUS.DISPUTED, disputeId: dispute.id },
    });

    return { success: true, dispute };
  } catch (error) {
    throw error;
  }
};

// Refund escrow to buyer
const refundEscrow = async (escrowId, adminId, reason) => {
  try {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { buyer: true },
    });

    if (!escrow) throw new Error('Escrow not found');

    const refundResult = await processBuyerRefund(escrow);

    const updated = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: ESCROW_STATUS.REFUNDED,
        refundedAt: new Date(),
        refundedBy: adminId,
        refundReason: reason,
        refundReference: refundResult.reference,
      },
    });

    await notifyEscrowParties(updated, 'refunded');

    return { success: true, escrow: updated };
  } catch (error) {
    throw error;
  }
};

// Process seller payout via Paystack
const processSellerPayout = async (escrow) => {
  try {
    const axios = require('axios');
    const response = await axios.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: escrow.amount * 100, // Paystack uses kobo
        recipient: escrow.seller.paystackRecipientCode,
        reason: `VeriPro Property Payment - ${escrow.propertyId}`,
      },
      {
        headers: {
          Authorization: `Bearer ${config.payments.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      reference: response.data.data.reference,
      transferCode: response.data.data.transfer_code,
    };
  } catch (error) {
    console.error('Payout error:', error.response?.data || error.message);
    throw new Error('Failed to process seller payout');
  }
};

// Process buyer refund
const processBuyerRefund = async (escrow) => {
  // Similar to processSellerPayout but to buyer
  return {
    success: true,
    reference: `REF-${escrow.id}-${Date.now()}`,
  };
};

// Notify escrow parties
const notifyEscrowParties = async (escrow, event) => {
  const messages = {
    funded: 'Escrow has been funded. Inspection can now proceed.',
    released: 'Payment has been released to the seller. Transaction complete!',
    refunded: 'Escrow has been refunded to buyer.',
    disputed: 'A dispute has been raised. Our team will review within 24 hours.',
  };

  console.log(`[ESCROW] ${event.toUpperCase()}: ${messages[event]} | Escrow: ${escrow.id}`);
  // TODO: Send actual email/SMS notifications
};

module.exports = {
  ESCROW_STATUS,
  calculateFee,
  initiateEscrow,
  fundEscrow,
  requestRelease,
  releaseEscrow,
  initiateDispute,
  refundEscrow,
};
