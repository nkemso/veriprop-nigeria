'use strict';

const db = require('./db');

// Calculate portfolio analytics for a user
const getPortfolioAnalytics = async (userId) => {
  const [properties, buyTransactions, sellTransactions] = await Promise.all([
    db.property.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: { id: true, price: true, status: true, propertyType: true, listingType: true, createdAt: true },
    }),
    db.transaction.findMany({
      where: { buyerId: userId },
      select: { amount: true, status: true, createdAt: true },
    }),
    db.transaction.findMany({
      where: { sellerId: userId },
      select: { amount: true, status: true, createdAt: true },
    }),
  ]);

  const totalPortfolioValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
  const completedSales = sellTransactions.filter(t => t.status === 'completed');
  const totalEarned = completedSales.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSpent = buyTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    totalPortfolioValue,
    totalEarned,
    totalSpent,
    netWorth: totalPortfolioValue + totalEarned - totalSpent,
    propertyCount: properties.length,
    activeListings: properties.filter(p => p.status === 'active').length,
    completedSalesCount: completedSales.length,
    propertyTypes: properties.reduce((acc, p) => {
      acc[p.propertyType] = (acc[p.propertyType] || 0) + 1;
      return acc;
    }, {}),
  };
};

// Get investment recommendations
const getInvestmentRecommendations = async (userId) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { transactions: { take: 5 } },
  });

  return [
    { type: 'land', location: 'Epe, Lagos', reason: 'High growth corridor', roi: '35% in 3 years' },
    { type: 'apartment', location: 'Mowe, Ogun', reason: 'Lagos overspill demand', roi: '25% in 2 years' },
    { type: 'commercial', location: 'Ikeja, Lagos', reason: 'High commercial demand', roi: '20% annually' },
  ];
};

module.exports = { getPortfolioAnalytics, getInvestmentRecommendations };
