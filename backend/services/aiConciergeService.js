'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — AI CONCIERGE (REAL DATA, DYNAMIC, MULTILINGUAL)
 * ================================================================
 * Upgraded from static parrot → dynamic guide powered by:
 *   - Real property data from VeriProp database
 *   - AI providers (Groq/Qwen/DeepSeek — already configured)
 *   - Nigerian Pidgin English support
 *   - State-specific market insights
 *   - Honest answers ("no properties found" + alternatives)
 * ================================================================
 */

const config = require('../config');
const db = require('../db');

// ================================================================
// 1. QUERY REAL PROPERTY DATA
// ================================================================
async function searchProperties({ state, lga, propertyType, listingType, minPrice, maxPrice, bedrooms, limit = 5 }) {
  try {
    const where = {
      status: 'active',
      ...(state && { state: { contains: state, mode: 'insensitive' } }),
      ...(lga && { lga: { contains: lga, mode: 'insensitive' } }),
      ...(propertyType && { propertyType }),
      ...(listingType && { listingType }),
      ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
      ...(minPrice || maxPrice ? {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        },
      } : {}),
    };

    const properties = await db.property.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, price: true, propertyType: true,
        listingType: true, state: true, lga: true, address: true,
        bedrooms: true, bathrooms: true, size: true,
        images: { take: 1, select: { url: true } },
      },
    });

    return properties;
  } catch (err) {
    console.error('[AI Concierge] Property search error:', err.message);
    return [];
  }
}

async function getMarketStats(state) {
  try {
    const where = { status: 'active', ...(state && { state: { contains: state, mode: 'insensitive' } }) };

    const [total, avgPrice, states] = await Promise.all([
      db.property.count({ where }),
      db.property.aggregate({ where, _avg: { price: true }, _min: { price: true }, _max: { price: true } }),
      db.property.groupBy({ by: ['state'], where: { status: 'active' }, _count: true, orderBy: { _count: { state: 'desc' } }, take: 10 }),
    ]);

    return {
      totalListings: total,
      avgPrice: Math.round(avgPrice._avg?.price || 0),
      minPrice: avgPrice._min?.price || 0,
      maxPrice: avgPrice._max?.price || 0,
      topStates: states.map(s => ({ state: s.state, count: s._count })),
    };
  } catch (err) {
    return { totalListings: 0, avgPrice: 0, topStates: [] };
  }
}


// ================================================================
// 2. BUILD CONTEXT-AWARE PROMPT
// ================================================================
function buildPrompt(userMessage, context = {}) {
  const { role, properties, stats, state, language } = context;

  const pidginInstruction = language === 'pidgin'
    ? `\nIMPORTANT: Respond in Nigerian Pidgin English. Mix standard English with Pidgin naturally. Example: "Oga, I don check am well well. For this area, property dey cost..." But keep property names, prices, and addresses in standard English for clarity.`
    : language === 'yoruba' ? `\nAdd occasional Yoruba greetings and expressions naturally. Example: "E kaaro! Based on what I see..."`
    : language === 'igbo' ? `\nAdd occasional Igbo greetings and expressions naturally. Example: "Ndewo! From what I can see..."`
    : language === 'hausa' ? `\nAdd occasional Hausa greetings and expressions naturally. Example: "Sannu! Based on the data..."`
    : '';

  const propertyContext = properties && properties.length > 0
    ? `\n\nREAL PROPERTIES FOUND (from VeriProp database):\n${properties.map((p, i) =>
      `${i + 1}. "${p.title}" — ₦${(p.price || 0).toLocaleString()} | ${p.propertyType} for ${p.listingType} | ${p.bedrooms || '?'}bed | ${p.state}, ${p.lga} | ${p.address || ''}`
    ).join('\n')}`
    : '\n\nNO PROPERTIES FOUND matching the query in VeriProp database.';

  const statsContext = stats
    ? `\n\nMARKET STATS: ${stats.totalListings} active listings. Average price: ₦${(stats.avgPrice || 0).toLocaleString()}. Price range: ₦${(stats.minPrice || 0).toLocaleString()} — ₦${(stats.maxPrice || 0).toLocaleString()}.${stats.topStates?.length ? ` Top states: ${stats.topStates.map(s => `${s.state}(${s.count})`).join(', ')}` : ''}`
    : '';

  return `You are VeriProp AI Concierge — a dynamic, friendly, knowledgeable Nigerian property market expert working for VeriProp Nigeria (veriprop-nigeriang.vercel.app).

PERSONALITY:
- Warm, professional, but conversational — like a trusted Nigerian real estate advisor
- Ask follow-up questions to understand needs better
- Give honest answers — if no properties match, say so clearly and suggest alternatives
- Share real market insights, not generic filler
- Reference actual data when available
- Proactively suggest related options the user might not have considered
- Be concise but thorough — mobile-friendly responses

ROLE CONTEXT: User is a ${role || 'property seeker'}
${pidginInstruction}

RULES:
1. ONLY reference properties from the REAL DATA provided below. Do NOT invent properties.
2. If no properties match, honestly say: "I don't currently have listings matching that criteria" and suggest nearby areas or different property types.
3. Always mention prices in Naira (₦) with proper formatting.
4. For market questions, use the REAL STATS provided.
5. Recommend users verify listings and complete identity verification on VeriProp.
6. Keep responses under 200 words for mobile readability.
7. If asked about a specific area with no data, suggest the user check back later or browse nearby areas.
${propertyContext}
${statsContext}

USER MESSAGE: ${userMessage}`;
}


// ================================================================
// 3. CALL AI PROVIDER (Groq/Qwen/DeepSeek — already configured)
// ================================================================
async function callAI(prompt) {
  const provider = config.ai?.provider || 'local';
  const providers = {
    groq: { url: config.ai?.groq?.baseUrl, key: config.ai?.groq?.apiKey, model: config.ai?.groq?.model },
    qwen: { url: config.ai?.qwen?.baseUrl, key: config.ai?.qwen?.apiKey, model: config.ai?.qwen?.model },
    deepseek: { url: config.ai?.deepseek?.baseUrl, key: config.ai?.deepseek?.apiKey, model: config.ai?.deepseek?.model },
    gemini: { url: 'https://generativelanguage.googleapis.com/v1beta', key: config.ai?.gemini?.apiKey, model: config.ai?.gemini?.model },
  };

  const p = providers[provider];

  if (!p?.key) {
    // Fallback to intelligent local response
    return generateLocalResponse(prompt);
  }

  try {
    if (provider === 'gemini') {
      const res = await fetch(
        `${p.url}/models/${p.model}:generateContent?key=${p.key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
          }),
        }
      );
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || generateLocalResponse(prompt);
    }

    // OpenAI-compatible API (Groq, Qwen, DeepSeek)
    const res = await fetch(`${p.url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${p.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: p.model,
        messages: [
          { role: 'system', content: 'You are VeriProp AI Concierge — a Nigerian property market expert. Be concise, helpful, and honest.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || generateLocalResponse(prompt);
  } catch (err) {
    console.error(`[AI Concierge] ${provider} error:`, err.message);
    return generateLocalResponse(prompt);
  }
}


// ================================================================
// 4. LOCAL FALLBACK — Intelligent response without AI API
// ================================================================
function generateLocalResponse(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes('no properties found')) {
    return "I currently don't have listings matching your exact criteria on VeriProp. Here's what I suggest:\n\n1. Try nearby areas — properties in adjacent LGAs often offer better value\n2. Adjust your budget range slightly\n3. Check back soon — new listings are added daily\n4. Set up alerts to be notified when matching properties are listed\n\nWould you like me to search a different area or property type?";
  }

  if (lower.includes('real properties found')) {
    return "I found some properties matching your search! Check the listings above. Remember:\n\n✅ All properties on VeriProp are from verified sellers\n🔒 Payments are protected through our escrow system\n📋 I can help you compare options or get more details\n\nWould you like more information about any of these properties?";
  }

  return "Thanks for your question! I'm here to help you navigate the Nigerian property market. To give you the most accurate information, could you tell me:\n\n1. Which state/area are you interested in?\n2. Are you looking to buy or rent?\n3. What's your budget range?\n4. How many bedrooms do you need?\n\nThis helps me search our verified listings database for the best matches.";
}


// ================================================================
// 5. MAIN HANDLER — Process user message with real data
// ================================================================
async function handleMessage(userMessage, { role, userId, language } = {}) {
  // Extract search intent from message
  const intent = extractSearchIntent(userMessage);

  // Search real properties if user is looking for something
  let properties = [];
  let stats = null;

  if (intent.isSearch) {
    properties = await searchProperties(intent);
  }

  // Get market stats for context
  stats = await getMarketStats(intent.state);

  // Build AI prompt with real data
  const prompt = buildPrompt(userMessage, {
    role,
    properties,
    stats,
    state: intent.state,
    language: language || detectLanguage(userMessage),
  });

  // Call AI
  const aiResponse = await callAI(prompt);

  return {
    response: aiResponse,
    properties: properties.length > 0 ? properties : undefined,
    stats: stats.totalListings > 0 ? stats : undefined,
    language: language || detectLanguage(userMessage),
    provider: config.ai?.provider || 'local',
  };
}


// ================================================================
// 6. EXTRACT SEARCH INTENT — Parse user message for property criteria
// ================================================================
function extractSearchIntent(message) {
  const lower = message.toLowerCase();
  const intent = { isSearch: false };

  // Nigerian states
  const states = ['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Enugu', 'Delta', 'Anambra', 'Edo', 'Kaduna', 'Ogun', 'Imo', 'Abia', 'Akwa Ibom', 'Cross River', 'Bayelsa', 'Plateau', 'Benue', 'Kwara', 'Osun', 'Ondo', 'Ekiti', 'Kogi', 'Niger', 'Nasarawa', 'Borno', 'Adamawa', 'Bauchi', 'Gombe', 'Taraba', 'Yobe', 'Jigawa', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Ebonyi'];
  const areas = ['Lekki', 'Ikoyi', 'Victoria Island', 'VI', 'Ikeja', 'Surulere', 'Ajah', 'Yaba', 'Gbagada', 'Magodo', 'Maryland', 'Ogba', 'Wuse', 'Garki', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi', 'Port Harcourt', 'PH', 'GRA', 'Rumuola', 'Aba', 'Onitsha', 'Ibadan', 'Benin City', 'Warri', 'Calabar', 'Uyo', 'Enugu', 'Owerri', 'Jos', 'Kaduna', 'Kano'];

  for (const state of states) {
    if (lower.includes(state.toLowerCase())) { intent.state = state; intent.isSearch = true; break; }
  }
  for (const area of areas) {
    if (lower.includes(area.toLowerCase())) {
      intent.lga = area;
      intent.isSearch = true;
      if (!intent.state) {
        // Infer state from area
        if (['Lekki', 'Ikoyi', 'Victoria Island', 'VI', 'Ikeja', 'Surulere', 'Ajah', 'Yaba', 'Gbagada', 'Magodo', 'Maryland', 'Ogba'].includes(area)) intent.state = 'Lagos';
        if (['Wuse', 'Garki', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi'].includes(area)) intent.state = 'Abuja';
        if (['Port Harcourt', 'PH', 'GRA', 'Rumuola'].includes(area)) intent.state = 'Rivers';
      }
      break;
    }
  }

  // Property type
  if (lower.includes('apartment') || lower.includes('flat')) intent.propertyType = 'apartment';
  if (lower.includes('house') || lower.includes('duplex') || lower.includes('bungalow')) intent.propertyType = 'house';
  if (lower.includes('land') || lower.includes('plot')) intent.propertyType = 'land';
  if (lower.includes('commercial') || lower.includes('office') || lower.includes('shop')) intent.propertyType = 'commercial';
  if (lower.includes('shortlet') || lower.includes('short let') || lower.includes('airbnb')) intent.propertyType = 'shortlet';

  // Listing type
  if (lower.includes('rent') || lower.includes('lease')) intent.listingType = 'rent';
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('sale')) intent.listingType = 'sale';

  // Bedrooms
  const bedMatch = lower.match(/(\d)\s*(?:bed|br|bedroom)/);
  if (bedMatch) intent.bedrooms = bedMatch[1];

  // Price
  const priceMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:m|million|mil)/);
  if (priceMatch) {
    const price = parseFloat(priceMatch[1]) * 1000000;
    intent.maxPrice = price * 1.2; // 20% tolerance
    intent.minPrice = price * 0.8;
  }

  if (intent.propertyType || intent.listingType || intent.bedrooms || intent.maxPrice) intent.isSearch = true;

  return intent;
}


// ================================================================
// 7. DETECT LANGUAGE — Check if user is speaking Pidgin or native
// ================================================================
function detectLanguage(message) {
  const lower = message.toLowerCase();

  // Pidgin markers
  const pidginWords = ['wetin', 'dey', 'abeg', 'oga', 'na', 'sha', 'abi', 'shey', 'wahala', 'no be', 'e don', 'make', 'how far', 'how e dey', 'which kain', 'no wahala', 'i wan', 'i dey find', 'wey', 'chop', 'gist'];
  if (pidginWords.some(w => lower.includes(w))) return 'pidgin';

  // Yoruba markers
  if (lower.includes('bawo') || lower.includes('e kaaro') || lower.includes('se') || lower.includes('ibile')) return 'yoruba';

  // Igbo markers
  if (lower.includes('kedu') || lower.includes('ndewo') || lower.includes('biko')) return 'igbo';

  // Hausa markers
  if (lower.includes('sannu') || lower.includes('ina wuni') || lower.includes('yaya')) return 'hausa';

  return 'english';
}


module.exports = {
  handleMessage,
  searchProperties,
  getMarketStats,
  extractSearchIntent,
  detectLanguage,
};
