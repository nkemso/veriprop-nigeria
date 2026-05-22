'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — AI REDACTION MIDDLEWARE
 * ================================================================
 * Enforces Closed-Loop Policy by redacting:
 * - Phone numbers (Nigerian + International)
 * - Email addresses
 * - WhatsApp / Telegram links
 * - Social media handles
 * - Bank account numbers
 * - External platform links
 * - Off-platform payment attempts
 * 
 * Uses same multi-provider AI as aiModeration.js
 * Falls back gracefully to regex if AI unavailable
 * ================================================================
 */

const config = require('../config');

// ============================================================
// REDACTION PATTERNS — Regex (always runs first)
// ============================================================
const REDACTION_PATTERNS = [
  {
    name: 'ng_phone',
    pattern: /(\+?234|0)(70|71|80|81|90|91|802|808|812|813|815|816|817|818|819|901|903|904|905|906|907|908|909|810|811|814)\d{7}/gi,
    replacement: '[PHONE REDACTED]',
    severity: 'high',
  },
  {
    name: 'intl_phone',
    pattern: /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    replacement: '[PHONE REDACTED]',
    severity: 'high',
  },
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi,
    replacement: '[EMAIL REDACTED]',
    severity: 'high',
  },
  {
    name: 'whatsapp',
    pattern: /\b(whatsapp|whats app|wa\.me|hmu on whatsapp|whatsapp me|ping me on whatsapp|wa link|chat on wa)\b/gi,
    replacement: '[OFF-PLATFORM CONTACT REDACTED]',
    severity: 'critical',
  },
  {
    name: 'telegram',
    pattern: /\b(telegram|t\.me\/|@\w+\s+on\s+telegram)\b/gi,
    replacement: '[OFF-PLATFORM CONTACT REDACTED]',
    severity: 'high',
  },
  {
    name: 'social_handle',
    pattern: /@[a-zA-Z0-9_.]{2,30}\b/g,
    replacement: '[HANDLE REDACTED]',
    severity: 'medium',
  },
  {
    name: 'bank_account',
    pattern: /\b\d{10}\b/g,
    replacement: '[ACCOUNT REDACTED]',
    severity: 'high',
  },
  {
    name: 'external_platform',
    pattern: /\b(jiji\.ng|propertypro\.ng|privateproperty\.com\.ng|tolet\.com\.ng|jumia\.com\.ng\/housing)\b/gi,
    replacement: '[EXTERNAL LINK REDACTED]',
    severity: 'medium',
  },
  {
    name: 'external_url',
    pattern: /https?:\/\/(?!veripronigeria\.com)[^\s]+/gi,
    replacement: '[EXTERNAL URL REDACTED]',
    severity: 'medium',
  },
  {
    name: 'off_platform_pay',
    pattern: /\b(pay me directly|send to my account|transfer to|my account number is|pay outside|bypass escrow|deal outside the platform|let.s deal outside)\b/gi,
    replacement: '[OFF-PLATFORM PAYMENT ATTEMPT REDACTED]',
    severity: 'critical',
  },
];

// ============================================================
// CORE REGEX REDACTION — Always runs (zero cost)
// ============================================================
const redactContent = (text) => {
  if (!text || typeof text !== 'string') {
    return { content: text, wasRedacted: false, violations: [] };
  }

  let redacted = text;
  const violations = [];

  for (const rule of REDACTION_PATTERNS) {
    const matches = text.match(rule.pattern);
    if (matches) {
      violations.push({
        rule: rule.name,
        severity: rule.severity,
        count: matches.length,
      });
      redacted = redacted.replace(rule.pattern, rule.replacement);
    }
  }

  const riskLevel = violations.some(v => v.severity === 'critical') ? 'critical'
    : violations.some(v => v.severity === 'high') ? 'high'
    : violations.length > 0 ? 'medium'
    : 'none';

  return {
    content: redacted,
    wasRedacted: violations.length > 0,
    violations,
    riskLevel,
  };
};

// ============================================================
// AI-ENHANCED REDACTION — Catches edge cases regex misses
// Uses configured provider (Qwen/DeepSeek/Groq/Gemini)
// ============================================================
const aiEnhancedRedact = async (text) => {
  // Step 1: Always regex first
  const regexResult = redactContent(text);

  // Skip AI if: no violations, text too short, or critical (already caught)
  if (!regexResult.wasRedacted && text.length < 200) return regexResult;
  if (regexResult.riskLevel === 'critical') return regexResult;

  // Skip AI if provider is local or no key configured
  const provider = config.ai.provider;
  if (provider === 'local' || provider === undefined) return regexResult;

  const hasKey = config.ai[provider]?.apiKey;
  if (!hasKey) return regexResult;

  try {
    const prompt = `You are a content moderation AI for VeriProp Nigeria, a secure property marketplace.
Detect any attempt to share personal contact info or move payments off-platform.

Analyze this message and respond with JSON only:
{
  "safe": true or false,
  "violations": ["list any off-platform contact or payment attempts"],
  "redactedContent": "message with violations replaced by [REDACTED]"
}

Message to analyze: "${regexResult.content}"`;

    let rawText = null;

    if (provider === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.ai.gemini.model}:generateContent?key=${config.ai.gemini.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 300 },
          }),
        }
      );
      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // Qwen / DeepSeek / Groq — all OpenAI-compatible
      const providerConfig = config.ai[provider];
      const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: providerConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 300,
        }),
      });
      const data = await response.json();
      rawText = data.choices?.[0]?.message?.content;
    }

    if (!rawText) return regexResult;

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return regexResult;

    const aiResult = JSON.parse(jsonMatch[0]);

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
        provider,
      };
    }

    return { ...regexResult, aiEnhanced: true };
  } catch (err) {
    console.error('[REDACT] AI pass failed, using regex result:', err.message);
    return regexResult;
  }
};

// ============================================================
// EXPRESS MIDDLEWARE — Chat messages
// ============================================================
const chatRedactionMiddleware = async (req, res, next) => {
  try {
    if (!req.body?.content) return next();

    const result = await aiEnhancedRedact(req.body.content);

    req.redactionResult = result;
    req.body.originalContent = req.body.content;
    req.body.content = result.content;
    req.body.isRedacted = result.wasRedacted;

    // Flag user if critical violation
    if (result.riskLevel === 'critical' && req.user?.id) {
      flagUserForViolation(req.user.id, 'off_platform_contact', result.violations)
        .catch(console.error);
    }

    next();
  } catch (err) {
    console.error('[REDACT MIDDLEWARE]', err.message);
    next();
  }
};

// ============================================================
// EXPRESS MIDDLEWARE — Profile fields
// ============================================================
const profileRedactionMiddleware = (req, res, next) => {
  try {
    const fieldsToRedact = ['bio', 'website', 'address'];
    fieldsToRedact.forEach(field => {
      if (req.body?.[field]) {
        const result = redactContent(req.body[field]);
        req.body[field] = result.content;
      }
    });
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

// ============================================================
// FLAG USER FOR VIOLATION
// ============================================================
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
    console.warn(`[REDACT] User ${userId} flagged: ${violationType}`);
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
