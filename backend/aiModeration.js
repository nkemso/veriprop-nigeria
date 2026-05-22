'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — ENTERPRISE AI MODERATION ENGINE
 * ================================================================
 * 
 * Supports 5 providers with automatic fallback chain:
 * 
 *   1. Qwen    (Alibaba)  — FREE forever, high volume ⭐
 *   2. DeepSeek           — Ultra cheap, best quality ⭐
 *   3. Groq               — FREE forever, fastest speed ⭐
 *   4. Gemini  (Google)   — FREE limited (15 req/min)
 *   5. Local   (Regex)    — FREE always, zero latency
 * 
 * Fallback chain: Primary → Local (never fails)
 * 
 * Set AI_PROVIDER in Railway Variables to switch providers
 * ================================================================
 */

const config = require('./config');

// ============================================================
// FRAUD KEYWORDS — Nigerian Property Market Specific
// ============================================================
const FRAUD_KEYWORDS = [
  // Payment fraud
  'send money', 'western union', 'moneygram', 'gift card',
  'bitcoin payment', 'crypto payment', 'pay outside platform',
  'advance fee', 'wire transfer', 'transfer first',
  'pay before viewing', 'pay deposit first', 'send deposit',

  // Nigerian 419 patterns
  '419', 'scam', 'urgent sale', 'traveling abroad',
  'relocating urgently', 'abroad', 'overseas', 'japa',

  // Off-platform contact
  'contact via whatsapp only', 'whatsapp me directly',
  'call me outside', 'my personal number',

  // Inspection avoidance
  'no inspection', 'key handover after payment',
  'trust me', 'i am honest', 'god fearing agent',

  // Too good to be true
  'promo price', 'give away price', 'below market',
  'distress sale', 'owner abroad', 'family emergency',
];

const PRICE_THRESHOLDS = {
  minRentMonthly: 5000,       // ₦5,000 minimum
  maxRentMonthly: 50000000,   // ₦50M maximum
  minSalePrice: 500000,       // ₦500k minimum
  maxSalePrice: 50000000000,  // ₦50B maximum
};

// ============================================================
// PROVIDER 5: LOCAL MODERATION — Always free, always works
// ============================================================
const localModerate = (listing) => {
  const issues = [];
  const warnings = [];
  let riskScore = 0;

  const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();

  // Check fraud keywords
  const foundKeywords = FRAUD_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
  foundKeywords.forEach(kw => {
    issues.push(`Suspicious pattern: "${kw}"`);
    riskScore += 20;
  });

  // Price validation
  if (listing.price) {
    const price = parseFloat(listing.price);
    if (listing.listingType === 'rent') {
      if (price < PRICE_THRESHOLDS.minRentMonthly) { warnings.push('Price unusually low for rent'); riskScore += 15; }
      if (price > PRICE_THRESHOLDS.maxRentMonthly) { warnings.push('Price unusually high for rent'); riskScore += 10; }
    } else if (listing.listingType === 'sale') {
      if (price < PRICE_THRESHOLDS.minSalePrice) { warnings.push('Sale price unusually low'); riskScore += 20; }
    }
  }

  // Quality checks
  if (!listing.title || listing.title.length < 10) { issues.push('Title too short'); riskScore += 10; }
  if (!listing.description || listing.description.length < 50) { warnings.push('Description too short'); riskScore += 5; }
  if (!listing.images || listing.images.length === 0) { issues.push('No images provided'); riskScore += 20; }
  if (!listing.address || !listing.state || !listing.lga) { issues.push('Incomplete location'); riskScore += 15; }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  const status = riskScore >= 50 ? 'rejected'
    : riskScore >= 25 ? 'review_required'
    : 'approved';

  return {
    status,
    riskScore,
    qualityScore: Math.max(0, 100 - riskScore),
    issues,
    warnings,
    moderatedAt: new Date().toISOString(),
    method: 'local_regex',
    provider: 'local',
  };
};

// ============================================================
// OPENAI-COMPATIBLE CALLER
// Works with: Qwen, DeepSeek, Groq (all use OpenAI format)
// ============================================================
const callOpenAICompatible = async (baseUrl, apiKey, model, prompt) => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a property listing moderation AI for VeriProp Nigeria. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
};

// ============================================================
// GEMINI CALLER (Different API format)
// ============================================================
const callGemini = async (apiKey, model, prompt) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

// ============================================================
// BUILD AI PROMPT
// ============================================================
const buildModerationPrompt = (listing) => `
Analyze this Nigerian property listing for fraud and quality issues.

LISTING DETAILS:
Title: ${listing.title || 'N/A'}
Description: ${listing.description || 'N/A'}
Price: N${listing.price?.toLocaleString() || 'N/A'} (${listing.listingType || 'N/A'})
Location: ${listing.address || 'N/A'}, ${listing.lga || 'N/A'}, ${listing.state || 'N/A'}
Property Type: ${listing.propertyType || 'N/A'}
Bedrooms: ${listing.bedrooms || 'N/A'}
Images provided: ${listing.images?.length || 0}

FRAUD PATTERNS TO DETECT (Nigerian market):
- Requests to pay outside the platform
- Prices far below Lagos/Abuja market rates
- Owner claims to be abroad or relocating
- Requests for advance payment before inspection
- Vague or no location details
- Urgency pressure tactics
- 419/advance fee fraud patterns

Respond with this exact JSON format:
{
  "status": "approved",
  "riskScore": 15,
  "qualityScore": 85,
  "issues": [],
  "warnings": ["one warning if any"],
  "suggestions": ["improvement tips"],
  "reasoning": "brief explanation"
}

Status must be: approved | review_required | rejected
riskScore: 0-100 (higher = more suspicious)
qualityScore: 0-100 (higher = better quality)
`.trim();

// ============================================================
// MAIN AI CALLER — Routes to correct provider
// ============================================================
const callAIProvider = async (listing) => {
  const provider = config.ai.provider;
  const prompt = buildModerationPrompt(listing);
  let rawText = null;

  switch (provider) {
    // ── QWEN (Free forever) ──────────────────────────────
    case 'qwen':
      if (!config.ai.qwen?.apiKey) throw new Error('QWEN_API_KEY not set');
      rawText = await callOpenAICompatible(
        config.ai.qwen.baseUrl,
        config.ai.qwen.apiKey,
        config.ai.qwen.model,
        prompt
      );
      break;

    // ── DEEPSEEK (Ultra cheap) ───────────────────────────
    case 'deepseek':
      if (!config.ai.deepseek?.apiKey) throw new Error('DEEPSEEK_API_KEY not set');
      rawText = await callOpenAICompatible(
        config.ai.deepseek.baseUrl,
        config.ai.deepseek.apiKey,
        config.ai.deepseek.model,
        prompt
      );
      break;

    // ── GROQ (Free forever, fastest) ─────────────────────
    case 'groq':
      if (!config.ai.groq?.apiKey) throw new Error('GROQ_API_KEY not set');
      rawText = await callOpenAICompatible(
        config.ai.groq.baseUrl,
        config.ai.groq.apiKey,
        config.ai.groq.model,
        prompt
      );
      break;

    // ── GEMINI (Free limited) ────────────────────────────
    case 'gemini':
      if (!config.ai.gemini?.apiKey) throw new Error('GEMINI_API_KEY not set');
      rawText = await callGemini(
        config.ai.gemini.apiKey,
        config.ai.gemini.model,
        prompt
      );
      break;

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  if (!rawText) throw new Error('Empty response from AI provider');

  // Extract JSON from response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON in AI response');

  const result = JSON.parse(jsonMatch[0]);
  result.method = `ai_${provider}`;
  result.provider = provider;
  result.moderatedAt = new Date().toISOString();
  return result;
};

// ============================================================
// MAIN MODERATION FUNCTION — Public API
// ============================================================
const moderateListing = async (listing, useAI = true) => {
  // Step 1: Always run local first (instant, free)
  const localResult = localModerate(listing);

  // Step 2: If clearly fraudulent (score >= 75) — reject immediately
  // No need to waste AI credits on obvious fraud
  if (localResult.riskScore >= 75) {
    console.log(`[MOD] Rejected by local: score=${localResult.riskScore}`);
    return localResult;
  }

  // Step 3: If AI disabled or provider is 'local' — return local result
  const isAIEnabled = useAI &&
    config.ai.provider !== 'local' &&
    config.ai.provider !== undefined;

  if (!isAIEnabled) return localResult;

  // Step 4: Try AI provider with fallback to local
  try {
    console.log(`[MOD] Using ${config.ai.provider.toUpperCase()} AI...`);
    const aiResult = await callAIProvider(listing);
    console.log(`[MOD] AI result: ${aiResult.status} (score: ${aiResult.riskScore})`);
    return aiResult;
  } catch (error) {
    console.error(`[MOD] AI failed (${config.ai.provider}), using local:`, error.message);
    return { ...localResult, aiError: error.message };
  }
};

// ============================================================
// PROFILE MODERATION
// ============================================================
const moderateUserProfile = async (profile) => {
  const issues = [];
  let riskScore = 0;
  if (!profile.firstName || !profile.lastName) { issues.push('Incomplete name'); riskScore += 20; }
  if (!profile.phone) { issues.push('No phone number'); riskScore += 15; }
  return {
    status: riskScore >= 50 ? 'flagged' : 'clean',
    riskScore,
    issues,
    moderatedAt: new Date().toISOString(),
  };
};

// ============================================================
// HEALTH CHECK — Test AI provider connectivity
// ============================================================
const testAIProvider = async () => {
  if (config.ai.provider === 'local') {
    return { provider: 'local', status: 'ok', message: 'Local regex moderation active' };
  }
  try {
    const testListing = {
      title: 'Test Property Lagos',
      description: 'This is a test property listing for health check purposes.',
      price: 500000,
      listingType: 'rent',
      state: 'Lagos',
      lga: 'Lekki',
      address: '123 Test Street',
      propertyType: 'apartment',
      images: ['test.jpg'],
    };
    const result = await callAIProvider(testListing);
    return { provider: config.ai.provider, status: 'ok', result };
  } catch (error) {
    return { provider: config.ai.provider, status: 'error', error: error.message };
  }
};

module.exports = {
  moderateListing,
  moderateUserProfile,
  localModerate,
  testAIProvider,
  FRAUD_KEYWORDS,
};
