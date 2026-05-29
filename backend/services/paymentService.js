'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — PAYSTACK PAYMENT ENGINE
 * ================================================================
 * 
 * FEE STRUCTURE:
 * 
 * WITH AGENT:
 *   Buyer pays: Property price + Agent fee (5-10%) + Platform fee (2.5%)
 *   Landlord gets: 100% of property price
 *   Agent gets: 5-10% (their set rate)
 *   VeriProp gets: 2.5% platform fee
 * 
 * DIRECT LISTING (no agent):
 *   Buyer pays: Property price + VeriProp fee (5%)
 *   Landlord gets: 100% of property price
 *   VeriProp gets: 5% (acting as agent)
 * 
 * VAT: 7.5% on VeriProp's fee (remitted to FIRS)
 * Paystack: 1.5% + ₦100 (auto-deducted)
 * 
 * ESCROW FLOW:
 *   1. Buyer initiates payment → Paystack collects full amount
 *   2. Funds held (manual settlement on subaccounts)
 *   3. Inspection + document verification
 *   4. Buyer approves release
 *   5. Admin confirms → funds split to landlord, agent, platform
 * ================================================================
 */

const config = require('../config');
const db = require('../db');

const PAYSTACK_BASE = 'https://api.paystack.co';

const FEES = {
  PLATFORM_FEE_WITH_AGENT: 0.025,    // 2.5% when agent involved
  PLATFORM_FEE_DIRECT: 0.05,          // 5% when VeriProp acts as agent
  AGENT_MIN: 0.05,                     // Agent minimum 5%
  AGENT_MAX: 0.10,                     // Agent maximum 10%
  VAT_RATE: 0.075,                     // 7.5% VAT on platform fees
  PAYSTACK_RATE: 0.015,                // 1.5% Paystack fee
  PAYSTACK_FLAT: 100,                  // ₦100 Paystack flat fee
  PAYSTACK_CAP: 2000,                  // ₦2,000 Paystack fee cap
};


// ================================================================
// HELPER — Call Paystack API
// ================================================================
async function paystackFetch(endpoint, method = 'GET', body = null) {
  const secretKey = config.payments?.paystack?.secretKey;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY not configured');

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${PAYSTACK_BASE}${endpoint}`, opts);
  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || `Paystack error: ${res.status}`);
  }

  return data;
}


// ================================================================
// 1. CALCULATE FEES — Breakdown for any transaction
// ================================================================
function calculateFees(propertyPrice, agentRate = 0, hasAgent = true) {
  const price = parseFloat(propertyPrice);

  // Validate agent rate
  let agentPercent = hasAgent ? Math.min(Math.max(parseFloat(agentRate) || FEES.AGENT_MIN, FEES.AGENT_MIN), FEES.AGENT_MAX) : 0;

  // Platform fee (VeriProp's revenue — kept in full)
  const platformPercent = hasAgent ? FEES.PLATFORM_FEE_WITH_AGENT : FEES.PLATFORM_FEE_DIRECT;
  const platformFee = Math.round(price * platformPercent);

  // Agent commission
  const agentCommission = hasAgent ? Math.round(price * agentPercent) : 0;

  // VAT — 7.5% ADDED ON TOP of platform fee (paid by buyer, remitted to FIRS)
  // VeriProp collects this on behalf of FIRS. It is NOT deducted from platform revenue.
  const vatAmount = Math.round(platformFee * FEES.VAT_RATE);

  // Total buyer pays (property + agent + platform fee + VAT on platform fee)
  const totalBuyerPays = price + agentCommission + platformFee + vatAmount;

  // Paystack fee (on total amount)
  const paystackFee = Math.min(
    Math.round(totalBuyerPays * FEES.PAYSTACK_RATE) + FEES.PAYSTACK_FLAT,
    FEES.PAYSTACK_CAP
  );

  // VeriProp keeps 100% of platform fee. VAT is separate — held for FIRS.
  const platformNet = platformFee; // Full amount — VAT is NOT deducted from this

  return {
    propertyPrice: price,
    agentCommission,
    agentPercent: agentPercent * 100,
    platformFee,
    platformPercent: platformPercent * 100,
    platformNet,
    vatAmount,
    vatNote: 'VAT is collected from buyer on behalf of FIRS. Not deducted from platform revenue.',
    paystackFee,
    totalBuyerPays,
    landlordReceives: price,
    hasAgent,

    // Human-readable breakdown
    breakdown: {
      'Property Price': `₦${price.toLocaleString()}`,
      ...(hasAgent && { [`Agent Fee (${(agentPercent * 100)}%)`]: `₦${agentCommission.toLocaleString()}` }),
      [`Platform Fee (${(platformPercent * 100)}%)`]: `₦${platformFee.toLocaleString()}`,
      'VAT (7.5% on platform fee)': `₦${vatAmount.toLocaleString()} — collected for FIRS`,
      'Total You Pay': `₦${totalBuyerPays.toLocaleString()}`,
      '---': '---',
      'Landlord Receives': `₦${price.toLocaleString()} (100%)`,
      ...(hasAgent && { 'Agent Receives': `₦${agentCommission.toLocaleString()}` }),
      'VeriProp Keeps': `₦${platformFee.toLocaleString()} (full platform fee)`,
      'FIRS Gets': `₦${vatAmount.toLocaleString()} (VAT — remitted by VeriProp)`,
      'Paystack Fee': `₦${paystackFee.toLocaleString()} (auto-deducted)`,
    },
  };
}


// ================================================================
// 2. CREATE SUBACCOUNT — For agents and landlords
//    Called when verified user adds their bank details
// ================================================================
async function createSubaccount(bankCode, accountNumber, businessName, email) {
  const data = await paystackFetch('/subaccount', 'POST', {
    business_name: businessName,
    bank_code: bankCode,
    account_number: accountNumber,
    percentage_charge: 0, // We handle splits manually
    settlement_schedule: 'manual', // ESCROW — we release manually
    primary_contact_email: email,
  });

  return {
    success: true,
    subaccountCode: data.data.subaccount_code,
    accountName: data.data.account_name,
    bank: data.data.settlement_bank,
  };
}


// ================================================================
// 3. INITIALIZE TRANSACTION — Create Paystack payment
//    Buyer pays full amount (property + agent + platform fees)
// ================================================================
async function initializeTransaction({
  email,
  propertyPrice,
  agentRate,
  hasAgent,
  transactionId,
  propertyTitle,
  callbackUrl,
}) {
  const fees = calculateFees(propertyPrice, agentRate, hasAgent);

  // Amount in kobo (Paystack uses kobo)
  const amountInKobo = fees.totalBuyerPays * 100;

  const data = await paystackFetch('/transaction/initialize', 'POST', {
    email,
    amount: amountInKobo,
    currency: 'NGN',
    reference: `VP-TXN-${transactionId}-${Date.now()}`,
    callback_url: callbackUrl || `https://veriprop-nigeriang.vercel.app/transaction/success`,
    metadata: {
      transaction_id: transactionId,
      property_title: propertyTitle,
      property_price: propertyPrice,
      agent_commission: fees.agentCommission,
      platform_fee: fees.platformFee,
      vat_amount: fees.vatAmount,
      has_agent: hasAgent,
      custom_fields: [
        { display_name: 'Property', variable_name: 'property', value: propertyTitle },
        { display_name: 'Transaction ID', variable_name: 'txn_id', value: transactionId },
        { display_name: 'Platform Fee', variable_name: 'platform_fee', value: `₦${fees.platformFee.toLocaleString()}` },
      ],
    },
  });

  return {
    success: true,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
    fees,
  };
}


// ================================================================
// 4. VERIFY TRANSACTION — Confirm payment was successful
// ================================================================
async function verifyTransaction(reference) {
  const data = await paystackFetch(`/transaction/verify/${reference}`);

  return {
    success: data.data.status === 'success',
    status: data.data.status,
    amount: data.data.amount / 100, // Convert from kobo
    reference: data.data.reference,
    paidAt: data.data.paid_at,
    channel: data.data.channel,
    metadata: data.data.metadata,
    customer: data.data.customer,
  };
}


// ================================================================
// 5. PROCESS WEBHOOK — Handle Paystack payment events
// ================================================================
function verifyWebhookSignature(body, signature) {
  const crypto = require('crypto');
  const secretKey = config.payments?.paystack?.secretKey;
  if (!secretKey) return false;

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(body)
    .digest('hex');

  return hash === signature;
}

async function handlePaymentWebhook(event, data) {
  switch (event) {
    case 'charge.success': {
      const meta = data.metadata || {};
      const transactionId = meta.transaction_id;

      if (!transactionId) {
        console.warn('[Payment] Webhook received without transaction_id');
        return;
      }

      console.log(`[Payment] ✅ Payment confirmed for transaction ${transactionId}: ₦${(data.amount / 100).toLocaleString()}`);

      // Update transaction status
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'paid',
          paymentReference: data.reference,
          paidAt: new Date(data.paid_at),
        },
      }).catch(err => console.error('[Payment] Transaction update error:', err.message));

      // Update escrow to funded
      await db.escrow.update({
        where: { transactionId },
        data: {
          status: 'funded',
          paymentReference: data.reference,
          fundedAt: new Date(),
          totalDeposited: data.amount / 100,
          platformFee: meta.platform_fee || 0,
          agentCommission: meta.agent_commission || 0,
          vatAmount: meta.vat_amount || 0,
          netSellerAmount: meta.property_price || 0,
        },
      }).catch(err => console.error('[Payment] Escrow update error:', err.message));

      // Send notifications
      try {
        const pushService = require('./pushService');
        const emailService = require('./emailService');

        const transaction = await db.transaction.findUnique({
          where: { id: transactionId },
          include: {
            buyer: { select: { id: true, email: true, firstName: true } },
            seller: { select: { id: true, email: true, firstName: true } },
            property: { select: { title: true } },
          },
        });

        if (transaction) {
          // Notify buyer
          pushService.notifyUser(transaction.buyerId, {
            title: '✅ Payment Confirmed',
            message: `Your payment of ₦${(data.amount / 100).toLocaleString()} for "${transaction.property.title}" has been received and is held in escrow.`,
            type: 'transaction',
            email: true,
            push: true,
          });

          // Notify seller
          pushService.notifyUser(transaction.sellerId, {
            title: '💰 Payment Received',
            message: `Buyer has paid ₦${(meta.property_price || 0).toLocaleString()} for "${transaction.property.title}". Funds are in escrow pending your delivery.`,
            type: 'transaction',
            email: true,
            push: true,
          });
        }
      } catch (err) {
        console.error('[Payment] Notification error:', err.message);
      }

      break;
    }

    case 'transfer.success': {
      console.log(`[Payment] ✅ Transfer completed: ${data.reference}`);
      break;
    }

    case 'transfer.failed': {
      console.error(`[Payment] ❌ Transfer failed: ${data.reference} — ${data.reason}`);
      break;
    }

    default:
      console.log(`[Payment] Webhook event: ${event}`);
  }
}


// ================================================================
// 6. RELEASE ESCROW — Transfer funds to landlord + agent
//    Called by admin after buyer confirms satisfaction
// ================================================================
async function releaseEscrow(escrowId, adminId) {
  const escrow = await db.escrow.findUnique({
    where: { id: escrowId },
    include: {
      seller: { select: { id: true, email: true, firstName: true, paystackRecipientCode: true, bankAccountNumber: true, bankCode: true, bankAccountName: true } },
      transaction: { include: { property: { select: { title: true } } } },
    },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.status !== 'funded' && escrow.status !== 'release_requested') {
    throw new Error(`Cannot release escrow in "${escrow.status}" status`);
  }

  const results = { landlordPayout: null, agentPayout: null };

  // Create recipient for landlord if not exists
  if (!escrow.seller.paystackRecipientCode && escrow.seller.bankAccountNumber) {
    try {
      const recipientData = await paystackFetch('/transferrecipient', 'POST', {
        type: 'nuban',
        name: escrow.seller.bankAccountName || `${escrow.seller.firstName}`,
        account_number: escrow.seller.bankAccountNumber,
        bank_code: escrow.seller.bankCode,
        currency: 'NGN',
      });

      await db.user.update({
        where: { id: escrow.sellerId },
        data: { paystackRecipientCode: recipientData.data.recipient_code },
      });

      escrow.seller.paystackRecipientCode = recipientData.data.recipient_code;
    } catch (err) {
      console.error('[Payment] Failed to create recipient:', err.message);
      throw new Error('Failed to create payment recipient for landlord');
    }
  }

  // Transfer to landlord (property price = 100%)
  if (escrow.seller.paystackRecipientCode) {
    try {
      const transfer = await paystackFetch('/transfer', 'POST', {
        source: 'balance',
        amount: escrow.netSellerAmount * 100, // kobo
        recipient: escrow.seller.paystackRecipientCode,
        reason: `VeriProp Property Payment — ${escrow.transaction?.property?.title || escrow.transactionId}`,
        reference: `VP-PAY-${escrow.id}-${Date.now()}`,
      });

      results.landlordPayout = {
        success: true,
        amount: escrow.netSellerAmount,
        reference: transfer.data.reference,
        transferCode: transfer.data.transfer_code,
      };
    } catch (err) {
      console.error('[Payment] Landlord payout failed:', err.message);
      results.landlordPayout = { success: false, error: err.message };
    }
  }

  // TODO: Transfer agent commission (if agent has recipient code)
  // Similar to landlord payout but with agentCommission amount

  // Update escrow status
  await db.escrow.update({
    where: { id: escrowId },
    data: {
      status: 'released',
      releasedAt: new Date(),
      releasedBy: adminId,
    },
  });

  // Notify parties
  try {
    const pushService = require('./pushService');
    pushService.notifyEscrowUpdate(escrow.sellerId, 'Released', escrow.netSellerAmount);
    pushService.notifyEscrowUpdate(escrow.buyerId, 'Completed', escrow.netSellerAmount);
  } catch {}

  console.log(`[Payment] ✅ Escrow ${escrowId} released. Landlord: ₦${escrow.netSellerAmount.toLocaleString()}`);

  return { success: true, escrow: { id: escrowId, status: 'released' }, payouts: results };
}


// ================================================================
// 7. REFUND — Return funds to buyer
// ================================================================
async function refundTransaction(reference, amount = null) {
  const body = { transaction: reference };
  if (amount) body.amount = amount * 100; // kobo

  const data = await paystackFetch('/refund', 'POST', body);

  return {
    success: true,
    refundReference: data.data.id,
    amount: data.data.amount / 100,
    status: data.data.status,
  };
}


// ================================================================
// 8. LIST BANKS — For user bank account setup
// ================================================================
async function listBanks() {
  const data = await paystackFetch('/bank?country=nigeria&perPage=100');
  return data.data.map(b => ({ name: b.name, code: b.code, type: b.type }));
}

// Verify bank account
async function verifyBankAccount(accountNumber, bankCode) {
  const data = await paystackFetch(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
  return {
    success: true,
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
    bankId: data.data.bank_id,
  };
}


// ================================================================
// 9. HEALTH CHECK
// ================================================================
async function testConnection() {
  try {
    await paystackFetch('/balance');
    return { connected: true, provider: 'paystack', message: '✅ Paystack connected (VeriProp Nigeria)' };
  } catch (err) {
    return { connected: false, provider: 'paystack', message: '❌ ' + err.message };
  }
}


module.exports = {
  FEES,
  calculateFees,
  createSubaccount,
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
  handlePaymentWebhook,
  releaseEscrow,
  refundTransaction,
  listBanks,
  verifyBankAccount,
  testConnection,
};
