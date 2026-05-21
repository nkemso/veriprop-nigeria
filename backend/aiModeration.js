'use strict';

const config = require('./config');

// ============================================
// AI MODERATION ENGINE
// VeriPro Nigeria - Property Listing Moderation
// ============================================

const FRAUD_KEYWORDS = [
  'send money', 'western union', 'moneygram', 'gift card', 'bitcoin payment',
  'pay outside platform', 'advance fee', 'wire transfer', '419', 'scam',
  'deal quickly', 'urgent sale', 'traveling abroad', 'contact via whatsapp only',
  'no inspection', 'key handover after payment', 'trust me',
];

const SUSPICIOUS_PRICE_THRESHOLDS = {
  minRentMonthly: 5000,
  maxRentMonthly: 50000000,
  minSalePrice: 500000,
  maxSalePrice: 50000000000,
};

// ============================================
// LOCAL MODERATION (No API cost)
// ============================================
const localModerate = (listing) => {
  const issues = [];
  const warnings = [];
  let riskScore = 0;

  const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();

  // Check fraud keywords
  FRAUD_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      issues.push(`Suspicious keyword detected: "${keyword}"`);
      riskScore += 25;
    }
  });

  // Check price anomalies
  if (listing.price) {
    const price = parseFloat(listing.price);
    if (listing.listingType === 'rent') {
      if (price < SUSPICIOUS_PRICE_THRESHOLDS.minRentMonthly) {
        warnings.push('Price is unusually low for rent');
        riskScore += 15;
      }
      if (price > SUSPICIOUS_PRICE_THRESHOLDS.maxRentMonthly) {
        warnings.push('Price is unusually high for rent');
        riskScore += 10;
      }
    } else if (listing.listingType === 'sale') {
      if (price < SUSPICIOUS_PRICE_THRESHOLDS.minSalePrice) {
        warnings.push('Sale price is unusually low');
        riskScore += 15;
      }
    }
  }

  // Check required fields
  if (!listing.title || listing.title.length < 10) {
    issues.push('Title is too short or missing');
    riskScore += 10;
  }
  if (!listing.description || listing.description.length < 50) {
    warnings.push('Description is very short');
    riskScore += 5;
  }
  if (!listing.images || listing.images.length === 0) {
    issues.push('No images provided');
    riskScore += 20;
  }
  if (!listing.address || !listing.state || !listing.lga) {
    issues.push('Incomplete location information');
    riskScore += 15;
  }

  const status = riskScore >= 50 ? 'rejected' :
    riskScore >= 25 ? 'review_required' : 'approved';

  return {
    status,
    riskScore,
    issues,
    warnings,
    moderatedAt: new Date().toISOString(),
    method: 'local',
  };
};

// ============================================
// AI MODERATION (OpenAI)
// ============================================
const aiModerate = async (listing) => {
  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: config.ai.openai.apiKey });

    const prompt = `
You are a property listing moderation AI for VeriPro Nigeria, Nigeria's most trusted property marketplace.

Analyze this property listing for fraud, policy violations, and quality issues:

Title: ${listing.title}
Description: ${listing.description}
Price: ₦${listing.price?.toLocaleString()} (${listing.listingType})
Location: ${listing.address}, ${listing.lga}, ${listing.state}
Property Type: ${listing.propertyType}
Bedrooms: ${listing.bedrooms}
Images: ${listing.images?.length || 0} provided

Respond in JSON format:
{
  "status": "approved|review_required|rejected",
  "riskScore": 0-100,
  "issues": ["list of serious issues"],
  "warnings": ["list of minor concerns"],
  "qualityScore": 0-100,
  "suggestions": ["improvements for the listing"],
  "reasoning": "brief explanation"
}
`;

    const response = await openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return { ...result, moderatedAt: new Date().toISOString(), method: 'ai' };
  } catch (error) {
    console.error('AI moderation failed, falling back to local:', error.message);
    return localModerate(listing);
  }
};

// ============================================
// MAIN MODERATION FUNCTION
// ============================================
const moderateListing = async (listing, useAI = true) => {
  try {
    // Always run local moderation first (fast & free)
    const localResult = localModerate(listing);

    // If clearly fraudulent, don't waste AI credits
    if (localResult.riskScore >= 75) {
      return localResult;
    }

    // Use AI for borderline cases
    if (useAI && config.ai.openai.apiKey) {
      return await aiModerate(listing);
    }

    return localResult;
  } catch (error) {
    console.error('Moderation error:', error);
    return {
      status: 'review_required',
      riskScore: 50,
      issues: ['Moderation system error — manual review required'],
      warnings: [],
      moderatedAt: new Date().toISOString(),
      method: 'fallback',
    };
  }
};

// Moderate user profile
const moderateUserProfile = async (profile) => {
  const issues = [];
  let riskScore = 0;

  if (!profile.firstName || !profile.lastName) {
    issues.push('Incomplete name');
    riskScore += 20;
  }
  if (!profile.phone) {
    issues.push('No phone number');
    riskScore += 15;
  }

  return {
    status: riskScore >= 50 ? 'flagged' : 'clean',
    riskScore,
    issues,
    moderatedAt: new Date().toISOString(),
  };
};

module.exports = { moderateListing, moderateUserProfile, localModerate };
