'use strict';

const db = require('./db');

// Advanced property search with filters and ranking
const searchProperties = async (params) => {
  const {
    q, state, lga, propertyType, listingType,
    minPrice, maxPrice, bedrooms, bathrooms,
    amenities, verified, featured,
    lat, lng, radius,
    sortBy = 'relevance',
    page = 1, limit = 20,
  } = params;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {
    status: 'active',
    deletedAt: null,
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { lga: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(state && { state: { equals: state, mode: 'insensitive' } }),
    ...(lga && { lga: { contains: lga, mode: 'insensitive' } }),
    ...(propertyType && { propertyType }),
    ...(listingType && { listingType }),
    ...(bedrooms && { bedrooms: { gte: parseInt(bedrooms) } }),
    ...(bathrooms && { bathrooms: { gte: parseInt(bathrooms) } }),
    ...(featured && { isFeatured: true }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
    ...(amenities?.length && { amenities: { hasEvery: amenities } }),
    ...(verified && { owner: { isVerified: true } }),
  };

  const orderBy = sortBy === 'price_asc' ? { price: 'asc' }
    : sortBy === 'price_desc' ? { price: 'desc' }
    : sortBy === 'newest' ? { createdAt: 'desc' }
    : sortBy === 'oldest' ? { createdAt: 'asc' }
    : [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

  const [results, total] = await Promise.all([
    db.property.findMany({
      where, skip, take: parseInt(limit),
      orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
      include: {
        images: { take: 3, orderBy: { isPrimary: 'desc' } },
        owner: {
          select: {
            id: true, firstName: true, lastName: true,
            role: true, isVerified: true, profile: { select: { avatar: true } },
          },
        },
        _count: { select: { views: true, favorites: true } },
      },
    }),
    db.property.count({ where }),
  ]);

  return {
    results,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
    hasNext: parseInt(page) * parseInt(limit) < total,
    hasPrev: parseInt(page) > 1,
  };
};

// Get related properties
const getRelatedProperties = async (propertyId, limit = 6) => {
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { state: true, propertyType: true, listingType: true, price: true },
  });

  if (!property) return [];

  return db.property.findMany({
    where: {
      id: { not: propertyId },
      state: property.state,
      propertyType: property.propertyType,
      listingType: property.listingType,
      status: 'active',
      deletedAt: null,
      price: {
        gte: property.price * 0.7,
        lte: property.price * 1.3,
      },
    },
    take: limit,
    include: { images: { take: 1 } },
    orderBy: { isFeatured: 'desc' },
  });
};

// Get trending searches
const getTrendingSearches = async () => {
  return [
    '3 bedroom apartment Lagos',
    'Land for sale Abuja',
    'Duplex Lekki',
    '2 bedroom flat Port Harcourt',
    'Commercial property Lagos Island',
  ];
};

module.exports = { searchProperties, getRelatedProperties, getTrendingSearches };
