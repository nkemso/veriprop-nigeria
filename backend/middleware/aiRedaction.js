'use strict';

/**
 * VERIPROP AI REDACTION MIDDLEWARE
 * Enforces the Closed-Loop Policy by detecting and redacting:
 *  - Phone numbers (Nigerian + International)
 *  - Email addresses
 *  - WhatsApp links/references
 *  - Social media handles
 *  - External payment references (bank account numbers)
 *  - External platform links (Jiji, PropertyPro, etc.)
 */

const config = require('../config');

// ============================================================
// REDACTION PATTERNS
// ============================================================
const REDACTION_PATTERNS = [
  // Nigerian phone numbers (08x, 07x, 09x, +234)
  {
    name: 'ng_phone',
    pattern: /(\+?234|0)(70|71|80|81|90|91|802|808|812|813|815|816|817|818|819|901|903|904|905|906|907|908|909|810|811|813|814)\d{7}/gi,
    replacement: '[PHONE REDACTED]',
    severity: 'high',
  },
  // International phone numbers
  {
    name: 'intl_phone',
    pattern: /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    replacement: '[PHONE REDACTED]',
    severity: 'high',
  },
  // Email addresses
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,
    replacement: '[EMAIL REDACTED]',
    severity: 'high',
  },
  // WhatsApp references
  {
    name: 'whatsapp',
    pattern: /\b(whatsapp|whats app|wa\.me|chat on wa|hmu on whatsapp|wa link|whatsapp me|ping me on whatsapp)\b/gi,
    replacement: '[OFF-PLATFORM CONTACT REDACTED]',
    severity: 'high',
  },
  // Telegram references
  {
    name: 'telegram',
    pattern: /\b(telegram|t\.me\/|@\w+\s+on\s+telegram)\b/gi,
    replacement: '[OFF-PLATFORM CONTACT REDACTED]',
    severity: 'medium',
  },
  // Instagram/Social handles
  {
    name: 'social_handle',
    pattern: /@[a-zA-Z0-9_.]{2,30}\b/g,
    replacement: '[HANDLE REDACTED]',
    severity: 'medium',
  },
  // Nigerian bank account numbers (10 digits)
  {
    name: 'bank_account',
    pattern: /\b\d{10}\b/g,
    replacement: '[ACCOUNT REDACTED]',
    severity: 'high',
  },
  // External property platform URLs
  {
    name: 'external_platform',
    pattern: /\b(jiji\.ng|propertypro\.ng|privateproperty\.com\.ng|tolet\.com\.ng|jumia\.com\.ng\/housing)\b/gi,
    replacement: '[EXTERNAL LINK REDACTED]',
    severity: 'medium',
  },
  // Generic URLs (not veripronigeria.com)
  {
    name: 'external_url',
    pattern: /https?:\/\/(?!veripronigeria\.com)[^\s]+/gi,
    replacement: '[EXTERNAL URL REDACTED]',
    severity: 'medium',
  },
  // Pay outside / off-platform payment references
  {
    name: 'off_platform_pay',
    pattern: /\b(pay me directly|send to my account|transfer to|my account number is|pay outside|bypass escrow|let's deal outside|deal outside the platform)\b/gi,
    replacement: '[OFF-PLATFORM PAYMENT ATTEMPT REDACTED]',
    severity: 'critical',
  },
];

// ============================================================
// CORE REDACT FUNCTION
// ============================================================
const redactContent = (text) => {
  if (!text || typeof text !== 'string') return { content: text, wasRedacted: false, violations: [] };

  let redacted = text;
  const violations = [];

  for (const rule of REDACTION_PATTERNS) {
    const matches = text.match(rule.pattern);
    if (matches) {
      violations.push({
        rule: rule.name,
        severity: rule.severity,
        count: matches.length,
        samples: matches.slice(0, 3).map(m => m.replace(/\d/g, '*').replace(/[a-zA-Z]/g, 'x')),
      });
      redacted = redacted.replace(rule.pattern, rule.replacement);
    }
  }

  return {
    content: redacted,
    wasRedacted: violations.length > 0,
    violations,
    riskLevel: violations.some(v => v.severity === 'critical')
      ? 'critical'
      : violations.some(v => v.severity === 'high')
      ? 'high'
      : violations.length > 0 ? 'medium' : 'none',
  };
};

// ============================================================
// AI-ENHANCED REDACTION (OpenAI fallback for edge cases)
// ============================================================
const aiEnhancedRedact = async (text) => {
  // First pass: regex-based (fast, free)
  const regexResult = redactContent(text);

  // If no violations from regex, skip AI (save cost)
  if (!regexResult.wasRedacted && text.length < 500) {
    return regexResult;
  }

  // If critical violation — no need for AI, already caught
  if (regexResult.riskLevel === 'critical') {
    return regexResult;
  }

  // AI second pass for ambiguous cases (if API key available)
  if (!config.ai?.openai?.apiKey) return regexResult;

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: config.ai.openai.apiKey });

    const prompt = `
You are a content moderation AI for VeriProp Nigeria, a secure property marketplace.
Your job: detect ANY attempt to share contact details or move payment off-platform.

Analyze this message and respond with JSON:
{
  "safe": true/false,
  "violations": ["list any detected off-platform contact attempts"],
  "redactedContent": "the message with violations replaced by [REDACTED]"
}

Message: "${regexResult.content}"
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500,
    });

    const aiResult = JSON.parse(response.choices[0].message.content);

    if (!aiResult.safe && aiResult.redactedContent) {
      return {
        content: aiResult.redactedContent,
        wasRedacted: true,
        violations: [
          ...regexResult.violations,
          ...aiResult.violations.map(v => ({ rule: 'ai_detected', severity: 'high', description: v })),
        ],
        riskLevel: 'high',
        aiEnhanced: true,
      };
    }

    return { ...regexResult, aiEnhanced: true };
  } catch (err) {
    console.error('[REDACT] AI pass failed, using regex result:', err.message);
    return regexResult;
  }
};

// ============================================================
// EXPRESS MIDDLEWARE
// ============================================================

/**
 * Middleware: Redact chat message content before saving
 * Applied to POST /api/chat/:roomId/messages
 */
const chatRedactionMiddleware = async (req, res, next) => {
  try {
    if (!req.body?.content) return next();

    const result = await aiEnhancedRedact(req.body.content);

    // Store original (encrypted in prod) and redacted version
    req.redactionResult = result;
    req.body.originalContent = req.body.content;
    req.body.content = result.content;
    req.body.isRedacted = result.wasRedacted;

    // If critical violation, also flag the user
    if (result.riskLevel === 'critical' && req.user?.id) {
      flagUserForViolation(req.user.id, 'off_platform_payment_attempt', result.violations)
        .catch(console.error);
    }

    next();
  } catch (err) {
    console.error('[REDACT MIDDLEWARE] Error:', err);
    next(); // Fail open — don't block chat, log it
  }
};

/**
 * Middleware: Redact profile bio fields
 * Applied to PUT /api/users/me
 */
const profileRedactionMiddleware = (req, res, next) => {
  try {
    const fieldsToRedact = ['bio', 'website', 'address'];
    fieldsToRedact.forEach(field => {
      if (req.body?.[field]) {
        const result = redactContent(req.body[field]);
        req.body[field] = result.content;
      }
    });
    // Also check nested profile updates
    if (req.body?.profile) {
      Object.keys(req.body.profile).forEach(key => {
        if (typeof req.body.profile[key] === 'string') {
          const result = redactContent(req.body.profile[key]);
          req.body.profile[key] = result.content;
        }
      });
    }
    next();
  } catch (err) {
    next();
  }
};

/**
 * Flag user for violation
 */
const flagUserForViolation = async (userId, violationType, violations) => {
  try {
    const db = require('../db');
    await db.user.update({
      where: { id: userId },
      data: {
        fraudScore: { increment: 10 },
        fraudFlags: { push: `${violationType}:${new Date().toISOString()}` },
      },
    });
    console.warn(`[REDACT] User ${userId} flagged for: ${violationType}`);
  } catch (e) {
    console.error('[REDACT] Flag user error:', e.message);
  }
};

module.exports = {
  redactContent,
  aiEnhancedRedact,
  chatRedactionMiddleware,
  profileRedactionMiddleware,
  REDACTION_PATTERNS,
};
