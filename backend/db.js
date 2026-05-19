import { PrismaClient } from "@prisma/client";

let prisma = null;

function isConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma() {
  if (!isConfigured()) {
    return null;
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function persistAuditLogDb(entry) {
  const client = getPrisma();
  if (!client) {
    return { persisted: false, reason: "DATABASE_URL missing" };
  }

  await client.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        fromState: entry.fromState ?? null,
        toState: entry.toState,
        changedBy: entry.changedBy ?? null,
        metadata: entry.metadata ?? null,
      },
    });
  });

  return { persisted: true };
}

export async function persistSessionLogDb(session) {
  const client = getPrisma();
  if (!client) {
    return { persisted: false, reason: "DATABASE_URL missing" };
  }

  await client.$transaction(async (tx) => {
    await tx.sessionLog.create({
      data: {
        userId: session.userId,
        mfaVerified: Boolean(session.mfaVerified),
        device: session.device,
        ipAddress: session.ipAddress,
      },
    });
  });

  return { persisted: true };
}

export async function upsertSplitReceiptDb(splitTransactionId, receipt) {
  const client = getPrisma();
  if (!client) {
    return { persisted: false, reason: "DATABASE_URL missing" };
  }

  await client.$transaction(async (tx) => {
    await tx.splitReceipt.upsert({
      where: { splitTransactionId },
      create: {
        splitTransactionId,
        receiptId: receipt.receiptId,
        immutableHash: receipt.immutableHash,
        sellerNet: BigInt(receipt.disbursement.sellerNet),
        platformFee: BigInt(receipt.disbursement.platformFee),
        agentCommission: BigInt(receipt.disbursement.agentCommission),
        withholdingTax: BigInt(receipt.disbursement.withholdingTax),
        status: receipt.status,
      },
      update: {},
    });
  });

  return { persisted: true };
}
