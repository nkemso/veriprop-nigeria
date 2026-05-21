'use strict';

/**
 * VERIPROP MULTI-SIG ESCROW ENGINE
 * Funds released ONLY when (Buyer + Seller) OR (Buyer/Seller + Platform Legal)
 * signs the release payload. Every signature is hashed + stored immutably.
 */

const crypto = require('crypto');
const db = require('../db');
const { auditLog } = require('../audit/auditLogger');

const SIG_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  PLATFORM_LEGAL: 'platform_legal',
  NOTARY: 'notary',
};

// Required combinations for release approval
const RELEASE_QUORUMS = [
  [SIG_ROLES.BUYER, SIG_ROLES.SELLER],
  [SIG_ROLES.BUYER, SIG_ROLES.PLATFORM_LEGAL],
  [SIG_ROLES.SELLER, SIG_ROLES.PLATFORM_LEGAL],
];

/**
 * Hash the signature payload (deterministic, tamper-evident)
 */
const hashSignaturePayload = (escrowId, signerId, signerRole, timestamp) => {
  const payload = `${escrowId}:${signerId}:${signerRole}:${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Submit a multi-sig signature for an escrow
 */
const submitSignature = async ({ escrowId, signerId, signerRole, ipAddress, userAgent }) => {
  const escrow = await db.escrow.findUnique({
    where: { id: escrowId },
    include: { multiSigSignatures: true, transaction: true },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (!['funded', 'locked', 'multisig_pending'].includes(escrow.status)) {
    throw new Error(`Cannot sign escrow in status: ${escrow.status}`);
  }

  // Verify signer is a party to this escrow
  const allowedSigners = {
    [SIG_ROLES.BUYER]: escrow.buyerId,
    [SIG_ROLES.SELLER]: escrow.sellerId,
    [SIG_ROLES.PLATFORM_LEGAL]: null, // any platform legal can sign
    [SIG_ROLES.NOTARY]: null,
  };

  if (signerRole === SIG_ROLES.BUYER && escrow.buyerId !== signerId) {
    throw new Error('Unauthorized: Not the buyer for this escrow');
  }
  if (signerRole === SIG_ROLES.SELLER && escrow.sellerId !== signerId) {
    throw new Error('Unauthorized: Not the seller for this escrow');
  }

  // Check for duplicate signature
  const existing = escrow.multiSigSignatures.find(s => s.signerRole === signerRole);
  if (existing) throw new Error(`Role "${signerRole}" has already signed this escrow`);

  const timestamp = new Date().toISOString();
  const signatureHash = hashSignaturePayload(escrowId, signerId, signerRole, timestamp);

  // Record signature
  const signature = await db.multiSigSignature.create({
    data: {
      escrowId,
      signerId,
      signerRole,
      signedAt: new Date(timestamp),
      signatureHash,
      ipAddress,
      userAgent,
      metadata: { escrowAmount: escrow.totalDeposited, propertyId: escrow.propertyId },
    },
  });

  // Reload all signatures
  const allSignatures = await db.multiSigSignature.findMany({ where: { escrowId } });
  const signedRoles = allSignatures.map(s => s.signerRole);

  // Check if any quorum is satisfied
  const quorumMet = RELEASE_QUORUMS.some(quorum =>
    quorum.every(role => signedRoles.includes(role))
  );

  let newMultiSigStatus = 'pending';
  if (signedRoles.includes(SIG_ROLES.BUYER) && !signedRoles.includes(SIG_ROLES.SELLER)) {
    newMultiSigStatus = 'buyer_signed';
  } else if (signedRoles.includes(SIG_ROLES.SELLER) && !signedRoles.includes(SIG_ROLES.BUYER)) {
    newMultiSigStatus = 'seller_signed';
  } else if (quorumMet) {
    newMultiSigStatus = 'fully_approved';
  }

  // Update escrow multi-sig status
  await db.escrow.update({
    where: { id: escrowId },
    data: {
      multiSigStatus: newMultiSigStatus,
      status: quorumMet ? 'release_approved' : 'multisig_pending',
    },
  });

  // Audit
  await auditLog({
    action: 'multisig_signed',
    userId: signerId,
    transactionId: escrow.transactionId,
    resourceType: 'escrow',
    resourceId: escrowId,
    description: `Multi-sig signed by ${signerRole}. Quorum met: ${quorumMet}`,
    metadata: { signerRole, signatureHash, quorumMet, signedRoles },
    ipAddress,
  });

  return {
    success: true,
    signature,
    quorumMet,
    multiSigStatus: newMultiSigStatus,
    signedRoles,
    message: quorumMet
      ? '✅ Quorum achieved. Funds are ready for release.'
      : `Signature recorded (${signerRole}). Awaiting additional signatures.`,
  };
};

/**
 * Get multi-sig status for an escrow
 */
const getMultiSigStatus = async (escrowId) => {
  const escrow = await db.escrow.findUnique({
    where: { id: escrowId },
    include: {
      multiSigSignatures: {
        include: { signer: { select: { firstName: true, lastName: true, role: true } } },
      },
    },
  });

  if (!escrow) throw new Error('Escrow not found');

  const signedRoles = escrow.multiSigSignatures.map(s => s.signerRole);
  const quorumMet = RELEASE_QUORUMS.some(q => q.every(r => signedRoles.includes(r)));
  const pendingRoles = Object.values(SIG_ROLES).filter(r => !signedRoles.includes(r));

  return {
    escrowId,
    multiSigStatus: escrow.multiSigStatus,
    quorumMet,
    signatures: escrow.multiSigSignatures,
    signedRoles,
    pendingRoles,
    requiredQuorums: RELEASE_QUORUMS,
  };
};

module.exports = { submitSignature, getMultiSigStatus, SIG_ROLES, RELEASE_QUORUMS };
