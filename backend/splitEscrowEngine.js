export function calculateSplit(amountNgn) {
  const gross = Number(amountNgn);
  const platformFee = Math.round(gross * 0.015);
  const agentCommission = Math.round(gross * 0.02);
  const withholdingTax = Math.round(gross * 0.05);
  const sellerNet = gross - platformFee - agentCommission - withholdingTax;

  return {
    gross,
    platformFee,
    agentCommission,
    withholdingTax,
    sellerNet,
  };
}

export function createSplitEscrowTransaction({ id, propertyId, amountNgn }) {
  return {
    id,
    propertyId,
    status: "SPLIT_PENDING",
    ...calculateSplit(amountNgn),
    verification: {
      buyer: false,
      seller: false,
      platform: false,
    },
    createdAt: new Date().toISOString(),
  };
}

export function verifySplitParty(transaction, party) {
  if (!transaction.verification[party]) {
    transaction.verification[party] = true;
  }

  const complete = Object.values(transaction.verification).every(Boolean);
  transaction.status = complete ? "SPLIT_VERIFIED" : "SPLIT_IN_PROGRESS";
  return transaction;
}

export function getSplitProgress(transaction) {
  const values = Object.values(transaction.verification);
  const approved = values.filter(Boolean).length;
  return Math.round((approved / values.length) * 100);
}
