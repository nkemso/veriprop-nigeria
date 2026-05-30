'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — AI CONCIERGE ENGINE (PREMIUM)
 * ================================================================
 * Multi-model AI suite with real data, Pidgin/native language,
 * role-specific responses, and intelligent routing.
 *
 * AI MODEL ROUTING:
 *   DeepSeek  — Complex analysis, market insights, legal questions
 *   Gemini    — Creative responses, Pidgin/native language, cultural context
 *   Groq      — Fast responses, simple queries, fallback
 *   Qwen      — High-volume, backup
 *   Local     — Zero-latency fallback, always works
 *
 * Each model has strengths — we route queries to the best one.
 * ================================================================
 */

const config = require('../config');
const db = require('../db');

// ================================================================
// AI PROVIDER REGISTRY
// ================================================================
function getProviders() {
  return {
    deepseek: {
      url: 'https://api.deepseek.com/chat/completions',
      key: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      strength: 'analysis',
      format: 'openai',
    },
    gemini: {
      url: 'https://generativelanguage.googleapis.com/v1beta',
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      strength: 'creative',
      format: 'gemini',
    },
    groq: {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      strength: 'speed',
      format: 'openai',
    },
    qwen: {
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      key: process.env.QWEN_API_KEY,
      model: process.env.QWEN_MODEL || 'qwen-plus',
      strength: 'volume',
      format: 'openai',
    },
  };
}

// ================================================================
// INTELLIGENT MODEL ROUTER — Pick best AI for the query
// ================================================================
function selectModel(message, language) {
  const providers = getProviders();
  const lower = message.toLowerCase();

  // Language tasks → Gemini (best at creative/multilingual, fast)
  if (language !== 'english' && providers.gemini.key) return 'gemini';

  // Fast simple queries → Groq (fastest, free)
  if (providers.groq.key) return 'groq';

  // General queries → Gemini (fast, free, good quality)
  if (providers.gemini.key) return 'gemini';

  // Analysis tasks → DeepSeek (best reasoning, but slower)
  const analysisKeywords = ['roi', 'calculate', 'compare', 'analysis', 'investment', 'legal', 'tax', 'yield', 'projection', 'forecast', 'valuation', 'cost', 'profit', 'worth'];
  if (analysisKeywords.some(k => lower.includes(k)) && providers.deepseek.key) return 'deepseek';

  // Fallback chain
  if (providers.deepseek.key) return 'deepseek';
  if (providers.qwen.key) return 'qwen';

  return 'local';
}


// ================================================================
// CALL AI — Unified caller for all providers
// ================================================================
async function callAI(prompt, systemPrompt, modelName) {
  const providers = getProviders();
  const provider = providers[modelName];

  if (!provider?.key) {
    return { text: generateLocalResponse(prompt), model: 'local', tokens: 0 };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), 12000));

    const fetchPromise = (async () => {
      if (provider.format === 'gemini') {
        const geminiUrl = provider.url + '/models/' + provider.model + ':generateContent?key=' + provider.key;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + prompt }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.8 },
          }),
        });
        if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        const res = await fetch(provider.url, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + provider.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            max_tokens: 400,
            temperature: 0.8,
          }),
        });
        if (!res.ok) throw new Error(modelName + ' HTTP ' + res.status);
        const data = await res.json();
        return data.choices?.[0]?.message?.content;
      }
    })();

    const text = await Promise.race([fetchPromise, timeoutPromise]);
    if (text) return { text, model: modelName, tokens: 0 };
  } catch (err) {
    console.error(`[AI/${modelName}] Error:`, err.message);
  }

  // Fallback to next provider
  const fallbackOrder = ['groq', 'deepseek', 'gemini', 'qwen'];
  for (const fb of fallbackOrder) {
    if (fb !== modelName && providers[fb]?.key) {
      console.log(`[AI] Falling back from ${modelName} to ${fb}`);
      return callAI(prompt, systemPrompt, fb);
    }
  }

  return { text: generateLocalResponse(prompt), model: 'local', tokens: 0 };
}


// ================================================================
// SEARCH REAL PROPERTY DATA
// ================================================================
async function searchProperties(criteria) {
  try {
    const where = { status: 'active' };
    if (criteria.state) where.state = { contains: criteria.state, mode: 'insensitive' };
    if (criteria.lga) where.lga = { contains: criteria.lga, mode: 'insensitive' };
    if (criteria.propertyType) where.propertyType = criteria.propertyType;
    if (criteria.listingType) where.listingType = criteria.listingType;
    if (criteria.bedrooms) where.bedrooms = parseInt(criteria.bedrooms);
    if (criteria.minPrice || criteria.maxPrice) {
      where.price = {};
      if (criteria.minPrice) where.price.gte = parseFloat(criteria.minPrice);
      if (criteria.maxPrice) where.price.lte = parseFloat(criteria.maxPrice);
    }

    // Also search by keyword in title/description/address
    if (criteria.keyword) {
      where.OR = [
        { title: { contains: criteria.keyword, mode: 'insensitive' } },
        { address: { contains: criteria.keyword, mode: 'insensitive' } },
        { lga: { contains: criteria.keyword, mode: 'insensitive' } },
      ];
    }

    return await db.property.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, price: true, propertyType: true,
        listingType: true, state: true, lga: true, address: true,
        bedrooms: true, bathrooms: true, size: true, sizeUnit: true,
      },
    });
  } catch (err) {
    console.error('[AI] Property search error:', err.message);
    return [];
  }
}

async function getMarketStats(state) {
  try {
    const where = { status: 'active' };
    if (state) where.state = { contains: state, mode: 'insensitive' };

    const [total, agg, byState, byType] = await Promise.all([
      db.property.count({ where }),
      db.property.aggregate({ where, _avg: { price: true }, _min: { price: true }, _max: { price: true } }),
      db.property.groupBy({ by: ['state'], where: { status: 'active' }, _count: true, orderBy: { _count: { state: 'desc' } }, take: 5 }),
      db.property.groupBy({ by: ['propertyType'], where, _count: true }),
    ]);

    return {
      total,
      avgPrice: Math.round(agg._avg?.price || 0),
      minPrice: agg._min?.price || 0,
      maxPrice: agg._max?.price || 0,
      byState: byState.map(s => `${s.state}(${s._count})`).join(', '),
      byType: byType.map(t => `${t.propertyType}(${t._count})`).join(', '),
    };
  } catch { return { total: 0, avgPrice: 0 }; }
}


// ================================================================
// EXTRACT SEARCH INTENT
// ================================================================
function extractIntent(message) {
  const lower = message.toLowerCase();
  const intent = { isSearch: false };

  // States
  const stateMap = {
    'lagos': 'Lagos', 'abuja': 'Abuja', 'fct': 'Abuja', 'rivers': 'Rivers', 'ph': 'Rivers', 'port harcourt': 'Rivers',
    'oyo': 'Oyo', 'ibadan': 'Oyo', 'kano': 'Kano', 'enugu': 'Enugu', 'delta': 'Delta', 'warri': 'Delta',
    'anambra': 'Anambra', 'onitsha': 'Anambra', 'edo': 'Edo', 'benin': 'Edo', 'kaduna': 'Kaduna',
    'ogun': 'Ogun', 'abeokuta': 'Ogun', 'imo': 'Imo', 'owerri': 'Imo', 'abia': 'Abia', 'aba': 'Abia',
    'akwa ibom': 'Akwa Ibom', 'uyo': 'Akwa Ibom', 'cross river': 'Cross River', 'calabar': 'Cross River',
    'bayelsa': 'Bayelsa', 'plateau': 'Plateau', 'jos': 'Plateau', 'benue': 'Benue', 'makurdi': 'Benue',
    'kwara': 'Kwara', 'ilorin': 'Kwara', 'osun': 'Osun', 'ondo': 'Ondo', 'ekiti': 'Ekiti',
  };

  // Areas → state mapping
  const areaMap = {
    'lekki': 'Lagos', 'ikoyi': 'Lagos', 'vi': 'Lagos', 'victoria island': 'Lagos', 'ikeja': 'Lagos',
    'surulere': 'Lagos', 'ajah': 'Lagos', 'yaba': 'Lagos', 'gbagada': 'Lagos', 'magodo': 'Lagos',
    'maryland': 'Lagos', 'ogba': 'Lagos', 'ikorodu': 'Lagos', 'epe': 'Lagos', 'badagry': 'Lagos',
    'wuse': 'Abuja', 'garki': 'Abuja', 'maitama': 'Abuja', 'asokoro': 'Abuja', 'gwarinpa': 'Abuja', 'jabi': 'Abuja',
    'rumuola': 'Rivers', 'gra': 'Rivers', 'd-line': 'Rivers',
  };

  for (const [key, state] of Object.entries(stateMap)) {
    if (lower.includes(key)) { intent.state = state; intent.isSearch = true; break; }
  }
  for (const [area, state] of Object.entries(areaMap)) {
    if (lower.includes(area)) { intent.lga = area; if (!intent.state) intent.state = state; intent.isSearch = true; break; }
  }

  // Any unrecognized location — use as keyword search
  if (!intent.state && !intent.lga) {
    const locationPatterns = lower.match(/(?:in|at|around|near|for)\s+([a-z\s]+?)(?:\s+(?:state|area|under|below|above|with|and)|[,.\?!]|$)/);
    if (locationPatterns) { intent.keyword = locationPatterns[1].trim(); intent.isSearch = true; }
  }

  // Property type
  if (/apartment|flat/.test(lower)) intent.propertyType = 'apartment';
  else if (/house|duplex|bungalow|detach/.test(lower)) intent.propertyType = 'house';
  else if (/\bland\b|plot/.test(lower)) intent.propertyType = 'land';
  else if (/commercial|office|shop|warehouse/.test(lower)) intent.propertyType = 'commercial';
  else if (/shortlet|short.let|airbnb|serviced/.test(lower)) intent.propertyType = 'shortlet';

  // Listing type
  if (/\brent\b|lease|let/.test(lower)) intent.listingType = 'rent';
  else if (/\bbuy\b|purchase|sale|sell/.test(lower)) intent.listingType = 'sale';

  // Bedrooms
  const bedMatch = lower.match(/(\d)\s*(?:bed|br|bedroom)/);
  if (bedMatch) intent.bedrooms = bedMatch[1];

  // Price
  const pricePatterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:m|mil|million)/i, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:k|thousand)/i, multiplier: 1000 },
    { regex: /(\d+(?:,\d+)*)\s*(?:naira|₦)/i, multiplier: 1 },
    { regex: /(?:budget|under|below|max|maximum)\s*(?:of\s*)?(?:₦|naira\s*)?(\d+(?:\.\d+)?)\s*(?:m|mil|million)/i, multiplier: 1000000 },
  ];
  for (const p of pricePatterns) {
    const m = lower.match(p.regex);
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, '')) * p.multiplier;
      intent.maxPrice = price * 1.3;
      intent.minPrice = price * 0.5;
      intent.isSearch = true;
      break;
    }
  }

  if (intent.propertyType || intent.listingType || intent.bedrooms) intent.isSearch = true;

  return intent;
}


// ================================================================
// DETECT LANGUAGE
// ================================================================
function detectLanguage(message) {
  const lower = message.toLowerCase();
  const pidginWords = ['wetin', 'dey', 'abeg', 'oga', 'na wa', 'sha', 'abi', 'shey', 'wahala', 'no be', 'e don', 'how far', 'how e', 'which kain', 'no wahala', 'i wan', 'wey dey', 'i dey find', 'wey', 'na im', 'comot', 'enter', 'chop', 'gist me', 'wetin dey', 'bros', 'madam'];
  const yorubaWords = ['bawo', 'e kaaro', 'e kaa san', 'pele', 'ibile', 'se alaafia', 'jowo', 'e se', 'owo'];
  const igboWords = ['kedu', 'ndewo', 'biko', 'nnoo', 'daalu', 'obi', 'ulo'];
  const hausaWords = ['sannu', 'ina wuni', 'yaya', 'nagode', 'barka', 'gida', 'kasuwa'];

  const pidginScore = pidginWords.filter(w => lower.includes(w)).length;
  if (pidginScore >= 2) return 'pidgin';
  if (pidginScore >= 1) return 'pidgin';
  if (yorubaWords.some(w => lower.includes(w))) return 'yoruba';
  if (igboWords.some(w => lower.includes(w))) return 'igbo';
  if (hausaWords.some(w => lower.includes(w))) return 'hausa';
  return 'english';
}


// ================================================================
// BUILD SYSTEM PROMPT — Role-specific, language-aware
// ================================================================
function buildSystemPrompt(role, language, stats) {
  const languageInstructions = {
    pidgin: `CRITICAL INSTRUCTION: You MUST respond entirely in Nigerian Pidgin English. This is non-negotiable.
Examples of how you should talk:
- "Oga/Madam, I don check am. For this ${stats?.total || 'our'} properties wey dey VeriProp..."
- "E no get property for that area right now, but make I suggest another place wey go work for you."
- "Na ₦5M be the price. E dey reasonable for that area."
- "Abeg, tell me your budget make I fit help you better."
- "No wahala, I go find something wey go sweet you."
Do NOT respond in English. Every sentence must be in Pidgin. Mix am well well.`,

    yoruba: `Respond primarily in English but naturally mix in Yoruba expressions:
- Start with "E kaaro!" or "E ku irole!" based on time
- Use "Jowo" (please), "E se" (thank you), "Daadaa" (well/good)
- "Ile yi dara pupọ" (This house is very good)
- Keep property details in English for clarity but add Yoruba flavor`,

    igbo: `Respond primarily in English but naturally mix in Igbo expressions:
- Start with "Ndewo!" or "Kedu!"
- Use "Biko" (please), "Daalu" (thank you), "Ọ dị mma" (it's good)
- "Ụlọ a mara mma" (This house is beautiful)
- Keep property details in English but add Igbo warmth`,

    hausa: `Respond primarily in English but naturally mix in Hausa expressions:
- Start with "Sannu!" or "Barka da yamma!"
- Use "Don Allah" (please), "Nagode" (thank you), "Da kyau" (good)
- "Wannan gida yana da kyau" (This house is good)
- Keep property details in English but add Hausa warmth`,

    english: 'Respond in clear, professional English with a warm Nigerian tone.',
  };

  const roleInstructions = {
    buyer: `You are SeekerPro — a personal property hunting assistant. Help buyers find their perfect home.
Focus on: property availability, pricing, area safety, amenities, transport, schools nearby.
Always ask: budget, preferred area, bedrooms needed, rent or buy.`,

    agent: `You are AgentPro — a performance coach for estate agents. Help them close more deals.
Focus on: pricing strategy, market rates, negotiation tactics, client management, commission optimization.
Share real market data when available.`,

    landlord: `You are LandlordPro — a property investment advisor for landlords.
Focus on: rental yield optimization, tenant screening, property management, portfolio growth, tax efficiency.
Help them maximize returns on their investments.`,

    developer: `You are DevPro — a strategic advisor for property developers.
Focus on: land acquisition, construction costs, ROI projections, zoning, market demand, off-plan strategies.
Provide analytical, data-driven advice.`,
  };

  return `You are VeriProp AI Concierge — Nigeria's smartest property assistant.
Platform: VeriProp Nigeria (veriprop-nigeriang.vercel.app)

${roleInstructions[role] || roleInstructions.buyer}

${languageInstructions[language] || languageInstructions.english}

MARKET CONTEXT:
- Total VeriProp listings: ${stats?.total || 0}
- Average price: ₦${(stats?.avgPrice || 0).toLocaleString()}
- Price range: ₦${(stats?.minPrice || 0).toLocaleString()} — ₦${(stats?.maxPrice || 0).toLocaleString()}
${stats?.byState ? `- Coverage: ${stats.byState}` : ''}
${stats?.byType ? `- Types: ${stats.byType}` : ''}

RULES:
1. ONLY reference properties from REAL DATA provided. Never invent listings.
2. If no properties match, be HONEST: "I no get property for that area" (Pidgin) or "No listings found there currently" (English). Then suggest nearby alternatives.
3. Always show prices in Naira (₦) with commas.
4. Keep responses under 150 words — mobile users.
5. Ask follow-up questions to narrow search.
6. Recommend VeriProp verification for secure transactions.
7. Be warm, helpful, and distinctly Nigerian in personality.`;
}


// ================================================================
// MAIN HANDLER
// ================================================================
async function handleMessage(userMessage, options = {}) {
  const { role = 'buyer', userId, language: forceLang } = options;

  // Detect language
  const detectedLang = forceLang || detectLanguage(userMessage);

  // Extract search intent
  const intent = extractIntent(userMessage);

  // Search real data
  let properties = [];
  if (intent.isSearch) {
    properties = await searchProperties(intent);
  }

  // Get market stats
  const stats = await getMarketStats(intent.state);

  // Build context
  const systemPrompt = buildSystemPrompt(role, detectedLang, stats);

  let userPrompt = userMessage;
  if (properties.length > 0) {
    userPrompt += '\n\nREAL PROPERTIES FROM DATABASE:\n' + properties.map((p, i) =>
      `${i + 1}. "${p.title}" — ₦${(p.price || 0).toLocaleString()} | ${p.propertyType} (${p.listingType}) | ${p.bedrooms || '?'}bed ${p.bathrooms || '?'}bath | ${p.state}, ${p.lga} | ${p.address || ''}`
    ).join('\n');
  } else if (intent.isSearch) {
    userPrompt += '\n\nNO PROPERTIES FOUND in VeriProp database matching this query. Be honest about this and suggest alternatives.';
  }

  // Select best AI model for this query
  const modelName = selectModel(userMessage, detectedLang);

  // Call AI
  const result = await callAI(userPrompt, systemPrompt, modelName);

  return {
    response: result.text,
    model: result.model,
    language: detectedLang,
    properties: properties.length > 0 ? properties : undefined,
    stats: stats.total > 0 ? { total: stats.total, avgPrice: stats.avgPrice } : undefined,
    intent: intent.isSearch ? intent : undefined,
  };
}


// ================================================================
// LOCAL FALLBACK
// ================================================================
function generateLocalResponse(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes('no properties found') || lower.includes('no listings')) {
    return "I don't currently have listings matching that exact criteria on VeriProp. But don't worry — here's what I suggest:\n\n1. 📍 Try nearby areas — adjacent neighborhoods often have great options\n2. 💰 Adjust your budget range slightly\n3. 🔔 Check back soon — new listings are added daily\n\nWhat area or budget would you like me to try instead?";
  }

  if (lower.includes('real properties')) {
    return "Great news — I found matching properties on VeriProp! Check the listings above. All properties on our platform are from verified sellers with escrow protection.\n\nWould you like more details about any of these properties?";
  }

  return "Welcome to VeriProp! I'm your personal property assistant. Tell me:\n\n1. 📍 Which area are you interested in?\n2. 🏠 Looking to buy or rent?\n3. 💰 What's your budget?\n4. 🛏️ How many bedrooms?\n\nI'll search our verified listings for the best matches!";
}


// ================================================================
// HEALTH CHECK
// ================================================================
async function testAI() {
  const providers = getProviders();
  const results = {};
  for (const [name, p] of Object.entries(providers)) {
    results[name] = { available: !!p.key, model: p.model, strength: p.strength };
  }
  return results;
}


module.exports = { handleMessage, searchProperties, getMarketStats, extractIntent, detectLanguage, testAI };
