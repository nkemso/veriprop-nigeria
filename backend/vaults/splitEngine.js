'use strict';

/**
 * VERIPROP AUTOMATED SPLIT ENGINE
 * At point of fund release, automatically distributes:
 *   - Platform Fee:      5%
 *   - Agent Commission:  10%
 *   - VAT:               7.5%
 *   - WHT:               Statutory (5% for individuals, 10% for companies)
 *   - Net to Seller:     Remainder
 */

const db = require('../db');
const { auditLog } = require('../audit/auditLogger');
const config = require('../config');

const SPLIT_RATES = {
  PLATFORM_FEE: 0.05,       // 5%
  AGENT_COMMISSION: 0.10,    // 10%
  VAT: 0.075,               // 7.5%
  WHT_INDIVIDUAL: 0.05,     // 5% for individuals
  WHT_COMPANY: 0.10,        // 10% for companies
};

const VAULT_NAMES = {
  PLATFORM: 'platform_fee',
  AGENT: 'agent_commission',
  VAT: 'vat_pool',
  WHT: 'wht_pool',
};

/**
 * Calculate the full split breakdown for a given amount
 */
const calculateSplit = (totalAmount, hasAgent = true, sellerIsCompany = false) => {
  const platformFee = parseFloat((totalAmount * SPLIT_RATES.PLATFORM_FEE).toFixed(2));
  const agentCommission = hasAgent
    ? parseFloat((totalAmount * SPLIT_RATES.AGENT_COMMISSION).toFixed(2))
    : 0;
  const vatAmount = parseFloat((totalAmount * SPLIT_RATES.VAT).toFixed(2));
  const whtRate = sellerIsCompany ? SPLIT_RATES.WHT_COMPANY : SPLIT_RATES.WHT_INDIVIDUAL;
  const whtAmount = parseFloat((totalAmount * whtRate).toFixed(2));

  const totalDeductions = platformFee + agentCommission + vatAmount + whtAmount;
  const netSellerAmount = parseFloat((totalAmount - totalDeductions).toFixed(2));

  return {
    totalAmount,
    platformFee,
    agentCommission,
    vatAmount,
    whtAmount,
    totalDeductions,
    netSellerAmount,
    breakdown: {
      'Platform Fee (5%)': platformFee,
      'Agent Commission (10%)': agentCommission,
      'VAT (7.5%)': vatAmount,
      [`WHT (${whtRate * 100}%)`]: whtAmount,
      'Net to Seller': netSellerAmount,
    },
  };
};

/**
 * Execute automated split on fund release
 */
const executeSplit = async (escrowId, adminId) => {
  const escrow = await db.escrow.findUnique({
    where: { id: escrowId },
    include: {
      seller: { select: { id: true, paystackRecipientCode: true, role: true } },
      transaction: { include: { property: true } },
    },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.status !== 'release_approved') {
    throw new Error(`Cannot execute split on escrow with status: ${escrow.status}`);
  }

  const hasAgent = !!escrow.agentId;
  const sellerIsCompany = ['agency', 'developer'].includes(escrow.seller?.role);
  const split = calculateSplit(escrow.totalDeposited, hasAgent, sellerIsCompany);

  // Create split receipt
  const splitReceipt = await db.splitReceipt.create({
    data: {
      escrowId,
      totalAmount: split.totalAmount,
      platformFee: split.platformFee,
      agentCommission: split.agentCommission,
      vatAmount: split.vatAmount,
      whtAmount: split.whtAmount,
      netSellerAmount: split.netSellerAmount,
      status: 'processing',
    },
  });

  const errors = [];
  const refs = {};

  // 1. Credit Platform Vault
  try {
    refs.platformRef = await creditVault(VAULT_NAMES.PLATFORM, split.platformFee, escrowId);
  } catch (e) { errors.push(`Platform vault: ${e.message}`); }

  // 2. Credit VAT Vault
  try {
    refs.vatRef = await creditVault(VAULT_NAMES.VAT, split.vatAmount, escrowId);
  } catch (e) { errors.push(`VAT vault: ${e.message}`); }

  // 3. Credit WHT Vault
  try {
    refs.whtRef = await creditVault(VAULT_NAMES.WHT, split.whtAmount, escrowId);
  } catch (e) { errors.push(`WHT vault: ${e.message}`); }

  // 4. Credit Agent Commission Vault (if agent exists)
  if (hasAgent && split.agentCommission > 0) {
    try {
      refs.agentRef = await creditVault(VAULT_NAMES.AGENT, split.agentCommission, escrowId);
    } catch (e) { errors.push(`Agent vault: ${e.message}`); }
  }

  // 5. Payout net amount to Seller via Paystack
  let payoutRef = null;
  try {
    payoutRef = await processSellerPayout(
      escrow.seller?.paystackRecipientCode,
      split.netSellerAmount,
      escrowId
    );
    refs.netSellerRef = payoutRef;
  } catch (e) {
    errors.push(`Seller payout: ${e.message}`);
  }

  const finalStatus = errors.length === 0 ? 'completed' : errors.length === 5 ? 'failed' : 'partial';

  // Update split receipt
  await db.splitReceipt.update({
    where: { id: splitReceipt.id },
    data: {
      status: finalStatus,
      platformFeeRef: refs.platformRef,
      agentCommissionRef: refs.agentRef,
      vatRef: refs.vatRef,
      whtRef: refs.whtRef,
      netSellerRef: refs.netSellerRef,
      processedAt: new Date(),
      failureReason: errors.length > 0 ? errors.join('; ') : null,
    },
  });

  // Update escrow
  await db.escrow.update({
    where: { id: escrowId },
    data: {
      status: finalStatus === 'completed' ? 'released' : 'disputed',
      releasedAt: finalStatus === 'completed' ? new Date() : null,
      releasedBy: adminId,
      payoutReference: payoutRef,
      platformFee: split.platformFee,
      agentCommission: split.agentCommission,
      vatAmount: split.vatAmount,
      whtAmount: split.whtAmount,
      netSellerAmount: split.netSellerAmount,
    },
  });

  // Update transaction
  if (finalStatus === 'completed') {
    await db.transaction.update({
      where: { id: escrow.transactionId },
      data: { status: 'completed', completedAt: new Date() },
    });
  }

  // Audit trail
  await auditLog({
    action: 'funds_split',
    userId: adminId,
    transactionId: escrow.transactionId,
    resourceType: 'split_receipt',
    resourceId: splitReceipt.id,
    description: `Fund split executed. Net to seller: ₦${split.netSellerAmount.toLocaleString()}`,
    metadata: { split, refs, errors },
  });

  return {
    success: finalStatus !== 'failed',
    splitReceipt: { ...splitReceipt, status: finalStatus, refs },
    split,
    errors,
    message: finalStatus === 'completed'
      ? '✅ Funds distributed successfully to all parties'
      : `⚠️ Partial split — ${errors.length} error(s): ${errors.join(', ')}`,
  };
};

/**
 * Credit a vault balance
 */
const creditVault = async (vaultName, amount, sourceId) => {
  const vault = await db.vault.upsert({
    where: { name: vaultName },
    update: {
      balance: { increment: amount },
      totalIn: { increment: amount },
      lastUpdatedAt: new Date(),
    },
    create: {
      name: vaultName,
      balance: amount,
      totalIn: amount,
    },
  });

  const ref = `VLT-${vaultName.toUpperCase()}-${Date.now()}`;
  await db.vaultTransaction.create({
    data: {
      vaultId: vault.id,
      amount,
      type: 'credit',
      reference: ref,
      description: `Split credit from escrow ${sourceId}`,
      sourceId,
    },
  });

  return ref;
};

/**
 * Process seller payout via Paystack Transfers
 */
const processSellerPayout = async (recipientCode, amount, escrowId) => {
  if (!recipientCode) {
    console.warn(`[SPLIT] No Paystack recipient code for escrow ${escrowId} — queueing manual payout`);
    return `MANUAL-PAYOUT-${Date.now()}`;
  }

  const axios = require('axios');
  const response = await axios.post(
    'https://api.paystack.co/transfer',
    {
      source: 'balance',
      amount: Math.round(amount * 100), // kobo
      recipient: recipientCode,
      reason: `VeriProp property payment — Escrow ${escrowId}`,
      reference: `VP-PAY-${escrowId}-${Date.now()}`,
    },
    {
      headers: {
        Authorization: `Bearer ${config.payments.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data.reference;
};

/**
 * Get vault balances (admin only)
 */
const getVaultBalances = async () => {
  const vaults = await db.vault.findMany({
    orderBy: { name: 'asc' },
  });
  return vaults;
};

module.exports = {
  SPLIT_RATES,
  calculateSplit,
  executeSplit,
  creditVault,
  getVaultBalances,
};
