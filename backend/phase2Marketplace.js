'use strict';

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('./db');
const { authenticateToken, optionalAuth, requirePermission, PERMISSIONS } = require('./roleAuth');
const { requireTier } = require('./middleware/requireAuth');
const { moderateListing } = require('./aiModeration');

const propertyRouter = express.Router();
const searchRouter = express.Router();
const agentRouter = express.Router();

// ============================================
// PROPERTY ROUTES
// ============================================

// ============================================================
// LOW-DATA MODE MIDDLEWARE
// ✅ AUDIT GAP 2 FIX: Returns text-first optimised payload
// when X-Low-Data: true header is present
// ============================================================
const lowDataMode = (req, res, next) => {
  req.isLowData = req.headers['x-low-data'] === 'true' ||
                  req.query.lowdata === '1' ||
                  req.query.low_data === 'true';
  next();
};

// Get all properties (public)
propertyRouter.get('/', optionalAuth, lowDataMode, async (req, res) => {
  try {
    const {
      page = 1, limit = 20, type, listingType, state, lga,
      minPrice, maxPrice, bedrooms, bathrooms, featured, status = 'active'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      status,
      deletedAt: null,
      ...(type && { propertyType: type }),
      ...(listingType && { listingType }),
      ...(state && { state }),
      ...(lga && { lga }),
      ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
      ...(bathrooms && { bathrooms: parseInt(bathrooms) }),
      ...(featured && { isFeatured: featured === 'true' }),
      ...(minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      },
    };

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, role: true } },
          images: { take: 5 },
          _count: { select: { views: true, favorites: true } },
        },
      }),
      db.property.count({ where }),
    ]);

    // LOW-DATA MODE: strip images, trim fields, reduce payload ~70%
    if (req.isLowData) {
      const slimProperties = properties.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        listingType: p.listingType,
        propertyType: p.propertyType,
        state: p.state,
        lga: p.lga,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        isVerified: p.isVerified,
        isFeatured: p.isFeatured,
      }));
      return res.json({
        success: true,
        mode: 'low-data',
        data: slimProperties,
        pagination: { total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) },
      });
    }

    res.json({
      success: true,
      data: properties,
      pagination: {
        total, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
});

// Get single property
propertyRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await db.property.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true, firstName: true, lastName: true, phone: true,
            role: true, profile: true, isVerified: true,
          },
        },
        images: true,
        documents: { where: { isPublic: true } },
        _count: { select: { views: true, favorites: true } },
      },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Track view
    db.propertyView.create({
      data: { propertyId: property.id, userId: req.user?.id, ip: req.ip },
    }).catch(() => {});

    res.json({ success: true, property });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch property' });
  }
});

// Create property listing
propertyRouter.post('/', authenticateToken,
  requirePermission(PERMISSIONS.PROPERTY_CREATE),
  requireTier('TIER3_NOTARY'),  // 🔒 Must complete full Didit KYC to list properties
  [
    body('title').trim().isLength({ min: 10, max: 200 }),
    body('description').trim().isLength({ min: 50 }),
    body('price').isFloat({ min: 0 }),
    body('propertyType').isIn(['apartment', 'house', 'land', 'commercial', 'shortlet', 'office']),
    body('listingType').isIn(['sale', 'rent', 'lease', 'shortlet']),
    body('state').notEmpty(),
    body('lga').notEmpty(),
    body('address').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        title, description, price, propertyType, listingType,
        state, lga, address, bedrooms, bathrooms, toilets,
        size, sizeUnit, amenities, images, coordinates,
      } = req.body;

      // AI Moderation
      const moderation = await moderateListing({
        title, description, price, propertyType, listingType,
        state, lga, address, images,
      });

      const property = await db.property.create({
        data: {
          title, description, price: parseFloat(price),
          propertyType, listingType, state, lga, address,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          toilets: toilets ? parseInt(toilets) : null,
          size: size ? parseFloat(size) : null,
          sizeUnit: sizeUnit || 'sqm',
          amenities: amenities || [],
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          ownerId: req.user.id,
          status: moderation.status === 'rejected' ? 'pending' : 'active',
          moderationStatus: moderation.status,
          moderationData: moderation,
          images: images ? {
            createMany: { data: images.map((url, i) => ({ url, isPrimary: i === 0 })) },
          } : undefined,
        },
        include: { images: true },
      });

      res.status(201).json({
        success: true,
        property,
        moderation: {
          status: moderation.status,
          message: moderation.status === 'approved'
            ? 'Listing approved and live!'
            : moderation.status === 'review_required'
              ? 'Listing under review. Will be live within 24 hours.'
              : 'Listing rejected. Please review and resubmit.',
        },
      });
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({ success: false, message: 'Failed to create listing' });
    }
  }
);

// Update property
propertyRouter.put('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await db.property.findUnique({ where: { id: req.params.id } });
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    if (property.ownerId !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await db.property.update({
      where: { id: req.params.id },
      data: { ...req.body, updatedAt: new Date() },
      include: { images: true },
    });

    res.json({ success: true, property: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update property' });
  }
});

// Delete property (soft delete)
propertyRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await db.property.findUnique({ where: { id: req.params.id } });
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    if (property.ownerId !== req.user.id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.property.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });

    res.json({ success: true, message: 'Property removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
});

// Toggle favorite
propertyRouter.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const existing = await db.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user.id, propertyId: req.params.id } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return res.json({ success: true, favorited: false });
    }

    await db.favorite.create({ data: { userId: req.user.id, propertyId: req.params.id } });
    res.json({ success: true, favorited: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle favorite' });
  }
});

// ============================================
// SEARCH ROUTES
// ============================================
searchRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const { q, state, lga, type, listingType, minPrice, maxPrice, bedrooms, page = 1, limit = 20 } = req.query;

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
        ],
      }),
      ...(state && { state: { equals: state, mode: 'insensitive' } }),
      ...(lga && { lga: { equals: lga, mode: 'insensitive' } }),
      ...(type && { propertyType: type }),
      ...(listingType && { listingType }),
      ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      }),
    };

    const [results, total] = await Promise.all([
      db.property.findMany({
        where, skip, take: parseInt(limit),
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: { images: { take: 1 }, owner: { select: { firstName: true, lastName: true, isVerified: true } } },
      }),
      db.property.count({ where }),
    ]);

    res.json({
      success: true,
      results,
      query: q,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// ============================================
// AGENT ROUTES
// ============================================
agentRouter.get('/', async (req, res) => {
  try {
    const { state, page = 1, limit = 20 } = req.query;
    const agents = await db.user.findMany({
      where: {
        role: { in: ['agent', 'agency'] },
        isActive: true,
        isVerified: true,
        ...(state && { profile: { state } }),
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      select: {
        id: true, firstName: true, lastName: true, role: true,
        profile: true, isVerified: true,
        _count: { select: { properties: true } },
      },
    });
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch agents' });
  }
});

module.exports = { propertyRouter, searchRouter, agentRouter };
