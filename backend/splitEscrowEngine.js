'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('./config');

// ============================================
// SPLIT ESCROW ENGINE
// For installmental / mortgage-style payments
// ============================================

const SPLIT_STATUS = {
  ACTIVE: 'active',
  PARTIAL: 'partial',
  COMPLETE: 'complete',
  DEFAULTED: 'defaulted',
  CANCELLED: 'cancelled',
};

// Create split payment plan
const createSplitPlan = async ({
  propertyId, buyerId, sellerId, totalAmount,
  installments, intervalDays = 30, startDate
}) => {
  try {
    const downPaymentPercent = 0.20; // 20% down payment
    const downPayment = totalAmount * downPaymentPercent;
    const balance = totalAmount - downPayment;
    const installmentAmount = balance / installments;

    const schedule = Array.from({ length: installments }, (_, i) => ({
      installmentNumber: i + 1,
      amount: installmentAmount,
      dueDate: new Date(
        new Date(startDate).getTime() + (i + 1) * intervalDays * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: 'pending',
    }));

    const splitEscrow = await prisma.splitEscrow.create({
      data: {
        propertyId,
        buyerId,
        sellerId,
        totalAmount,
        downPayment,
        balance,
        installmentAmount,
        totalInstallments: installments,
        paidInstallments: 0,
        schedule,
        status: SPLIT_STATUS.ACTIVE,
        intervalDays,
        nextDueDate: schedule[0].dueDate,
      },
    });

    return {
      success: true,
      splitEscrow,
      summary: {
        totalAmount: `₦${totalAmount.toLocaleString()}`,
        downPayment: `₦${downPayment.toLocaleString()}`,
        monthlyPayment: `₦${installmentAmount.toLocaleString()}`,
        duration: `${installments} months`,
        totalInstallments: installments,
      },
    };
  } catch (error) {
    console.error('Split escrow creation error:', error);
    throw new Error('Failed to create split payment plan');
  }
};

// Record installment payment
const recordInstallment = async (splitEscrowId, paymentReference, amount) => {
  try {
    const split = await prisma.splitEscrow.findUnique({ where: { id: splitEscrowId } });
    if (!split) throw new Error('Split escrow not found');

    const updatedSchedule = split.schedule.map((inst, i) => {
      if (i === split.paidInstallments) {
        return { ...inst, status: 'paid', paidAt: new Date().toISOString(), paymentReference };
      }
      return inst;
    });

    const paidInstallments = split.paidInstallments + 1;
    const isComplete = paidInstallments >= split.totalInstallments;
    const nextInstallment = updatedSchedule[paidInstallments];

    const updated = await prisma.splitEscrow.update({
      where: { id: splitEscrowId },
      data: {
        paidInstallments,
        schedule: updatedSchedule,
        status: isComplete ? SPLIT_STATUS.COMPLETE : SPLIT_STATUS.PARTIAL,
        nextDueDate: nextInstallment?.dueDate || null,
        completedAt: isComplete ? new Date() : null,
      },
    });

    return {
      success: true,
      splitEscrow: updated,
      isComplete,
      remaining: split.totalInstallments - paidInstallments,
    };
  } catch (error) {
    throw error;
  }
};

// Check overdue installments
const checkOverdueInstallments = async () => {
  try {
    const overdue = await prisma.splitEscrow.findMany({
      where: {
        status: { in: [SPLIT_STATUS.ACTIVE, SPLIT_STATUS.PARTIAL] },
        nextDueDate: { lt: new Date() },
      },
      include: { buyer: true, property: true },
    });

    for (const split of overdue) {
      const daysPastDue = Math.floor(
        (Date.now() - new Date(split.nextDueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPastDue > 30) {
        await prisma.splitEscrow.update({
          where: { id: split.id },
          data: { status: SPLIT_STATUS.DEFAULTED },
        });
      }

      console.log(`[SPLIT] Overdue: ${split.id} by ${daysPastDue} days`);
    }

    return { processed: overdue.length };
  } catch (error) {
    console.error('Overdue check error:', error);
  }
};

module.exports = {
  SPLIT_STATUS,
  createSplitPlan,
  recordInstallment,
  checkOverdueInstallments,
};
