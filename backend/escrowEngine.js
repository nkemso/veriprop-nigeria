export function getEscrowStatus(transaction) {
  const approvals = transaction.approvals;
  const approvedCount = approvals.filter((item) => item.state === "APPROVED").length;
  const total = approvals.length;
  const participantApproved = approvals.some(
    (item) => item.state === "APPROVED" && ["BUYER", "SELLER"].includes(item.role),
  );
  const authorityApproved = approvals.some(
    (item) => item.state === "APPROVED" && ["PLATFORM", "LEGAL"].includes(item.role),
  );
  const complete = participantApproved && authorityApproved;

  return {
    approvedCount,
    total,
    progress: Math.round((approvedCount / total) * 100),
    complete,
    participantApproved,
    authorityApproved,
  };
}

export function applyApproval(transaction, role, state = "APPROVED") {
  const nextApprovals = transaction.approvals.map((entry) =>
    entry.role === role ? { ...entry, state, signedAt: new Date().toISOString() } : entry,
  );

  const nextTransaction = { ...transaction, approvals: nextApprovals };
  const status = getEscrowStatus(nextTransaction);

  return {
    ...nextTransaction,
    status: status.complete ? "COMPLETED" : "MULTISIG_IN_PROGRESS",
  };
}
