'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — DIDIT KYC SERVICE (PRODUCTION)
 * ================================================================
 * ZERO-TRUST: No simulations. No fallbacks. No demo modes.
 * If Didit is not configured or fails → verification FAILS.
 *
 * Services used:
 *   1. Database Validation — BVN via nga_bank_verification_number ($0.80/call)
 *   2. Database Validation — NIN via nga_national_id ($0.08/call)
 *   3. Session-based KYC  — ID + Liveness + Face Match + IP Analysis (500 FREE/month)
 *   4. Passive Liveness    — Standalone selfie check
 *   5. Face Match          — 1:1 comparison
 *   6. AML Screening       — Watchlist check
 *
 * GET YOUR KEY: business.didit.me (60-second signup, no credit card)
 * DOCS: docs.didit.me
 * ================================================================
 */

const crypto = require('crypto');
const config = require('./config');

const DIDIT_BASE = 'https://verification.didit.me/v3';

let cachedWorkflowId = null;

// ================================================================
// GUARD — Refuse to operate without a real API key
// ================================================================
function requireApiKey() {
  const apiKey = config.didit?.apiKey || process.env.DIDIT_API_KEY;
  if (!apiKey) {
    throw new Error(
      'DIDIT_API_KEY is not configured. ' +
      'Verification cannot proceed without a live Didit API key. ' +
      'Get one FREE at https://business.didit.me'
    );
  }
  return apiKey;
}

// ================================================================
// HELPER — Fetch with auth (JSON body)
// ================================================================
async function diditFetchJSON(endpoint, method = 'POST', body = null) {
  const apiKey = requireApiKey();
  const opts = {
    method,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${DIDIT_BASE}${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Didit API ${res.status}: ${err}`);
  }
  return res.json();
}

// ================================================================
// HELPER — Fetch with auth (multipart/form-data for DB Validation)
// ================================================================
async function diditFetchForm(endpoint, fields) {
  const apiKey = requireApiKey();

  // Build multipart boundary
  const boundary = `----DiditBoundary${Date.now()}`;
  let body = '';
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
    body += `${value}\r\n`;
  }
  body += `--${boundary}--\r\n`;

  const res = await fetch(`${DIDIT_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Didit DB Validation ${res.status}: ${err}`);
  }
  return res.json();
}


// ================================================================
// 1. VERIFY BVN — Real government database check via Didit
//    Service: nga_bank_verification_number
//    Price: $0.80 per successful query
//    Required: first_name, last_name, bvn (11 digits)
// ================================================================
async function verifyBVN(bvn, firstName, lastName, dateOfBirth = null) {
  // Hard validation — 11 digits only
  if (!bvn || !/^\d{11}$/.test(bvn)) {
    return {
      success: false,
      verified: false,
      message: 'BVN must be exactly 11 digits.',
      provider: 'didit',
    };
  }

  if (!firstName || !lastName) {
    return {
      success: false,
      verified: false,
      message: 'First name and last name are required for BVN verification.',
      provider: 'didit',
    };
  }

  try {
    const fields = {
      issuing_state: 'NGA',
      services: 'nga_bank_verification_number',
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      bvn: bvn.trim(),
    };
    if (dateOfBirth) fields.date_of_birth = dateOfBirth;

    const data = await diditFetchForm('/database-validation/', fields);

    const isApproved = data.status === 'Approved';
    const isFullMatch = data.match_type === 'full_match';
    const verified = isApproved && isFullMatch;

    // Extract source data from registry
    const validation = data.validations?.[0] || {};
    const sourceData = validation.source_data || {};

    return {
      success: true,
      verified,
      status: data.status,
      matchType: data.match_type,
      outcomeCode: validation.outcome_code,
      sourceData: {
        firstName: sourceData.first_name,
        lastName: sourceData.last_name,
        dateOfBirth: sourceData.date_of_birth,
      },
      fieldValidation: validation.validation || {},
      requestId: data.request_id,
      provider: 'didit',
      message: verified
        ? '✅ BVN verified against NIBSS government database.'
        : `❌ BVN verification failed. Status: ${data.status}, Match: ${data.match_type}`,
    };
  } catch (err) {
    console.error('[Didit BVN] Error:', err.message);
    return {
      success: false,
      verified: false,
      message: `BVN verification failed: ${err.message}`,
      provider: 'didit',
      error: err.message,
    };
  }
}


// ================================================================
// 2. VERIFY NIN — Real NIMC government database check via Didit
//    Service: nga_national_id
//    Price: $0.08 per successful query
//    Required: first_name, last_name, national_id (11 digits)
// ================================================================
async function verifyNIN(nin, firstName, lastName, dateOfBirth = null) {
  // Hard validation — 11 digits only
  if (!nin || !/^\d{11}$/.test(nin)) {
    return {
      success: false,
      verified: false,
      message: 'NIN must be exactly 11 digits.',
      provider: 'didit',
    };
  }

  if (!firstName || !lastName) {
    return {
      success: false,
      verified: false,
      message: 'First name and last name are required for NIN verification.',
      provider: 'didit',
    };
  }

  try {
    const fields = {
      issuing_state: 'NGA',
      services: 'nga_national_id',
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      national_id: nin.trim(),
    };
    if (dateOfBirth) fields.date_of_birth = dateOfBirth;

    const data = await diditFetchForm('/database-validation/', fields);

    const isApproved = data.status === 'Approved';
    const isFullMatch = data.match_type === 'full_match';
    const verified = isApproved && isFullMatch;

    const validation = data.validations?.[0] || {};
    const sourceData = validation.source_data || {};

    return {
      success: true,
      verified,
      status: data.status,
      matchType: data.match_type,
      outcomeCode: validation.outcome_code,
      sourceData: {
        firstName: sourceData.first_name,
        lastName: sourceData.last_name,
        fullName: sourceData.full_name,
        dateOfBirth: sourceData.date_of_birth,
        identificationNumber: sourceData.identification_number,
        nameMatchScore: sourceData.name_match_score,
      },
      fieldValidation: validation.validation || {},
      requestId: data.request_id,
      provider: 'didit',
      message: verified
        ? '✅ NIN verified against NIMC government database.'
        : `❌ NIN verification failed. Status: ${data.status}, Match: ${data.match_type}`,
    };
  } catch (err) {
    console.error('[Didit NIN] Error:', err.message);
    return {
      success: false,
      verified: false,
      message: `NIN verification failed: ${err.message}`,
      provider: 'didit',
      error: err.message,
    };
  }
}


// ================================================================
// 3. CREATE KYC SESSION — Full hosted verification flow
//    Didit handles: ID capture → Liveness → Face Match → IP Analysis
//    500 FREE sessions/month, then $0.33/session
// ================================================================
async function getOrCreateWorkflow() {
  if (cachedWorkflowId) return cachedWorkflowId;

  // Check env first
  if (process.env.DIDIT_WORKFLOW_ID) {
    cachedWorkflowId = process.env.DIDIT_WORKFLOW_ID;
    return cachedWorkflowId;
  }

  try {
    const data = await diditFetchJSON('/workflows/', 'POST', {
      workflow_label: 'VeriProp Nigeria KYC',
      features: [
        { feature: 'ID_VERIFICATION' },
        { feature: 'LIVENESS' },
        { feature: 'FACE_MATCH' },
        { feature: 'IP_ANALYSIS' },
      ],
    });
    cachedWorkflowId = data.id || data.uuid;
    console.log('[Didit] Workflow created:', cachedWorkflowId);
    return cachedWorkflowId;
  } catch (err) {
    console.error('[Didit] Workflow creation failed:', err.message);
    throw new Error('Failed to create KYC workflow: ' + err.message);
  }
}

async function createKYCSession(userId, callbackUrl) {
  requireApiKey(); // Will throw if not configured

  const workflowId = await getOrCreateWorkflow();

  const appUrl = config.app?.url || process.env.APP_URL || 'https://veriprop-nigeria.vercel.app';
  const callback = callbackUrl || `${appUrl}/api/v1/verify/didit-webhook`;

  const data = await diditFetchJSON('/session/', 'POST', {
    workflow_id: workflowId,
    vendor_data: userId,
    callback,
  });

  return {
    success: true,
    sessionId: data.session_id,
    sessionUrl: data.url || data.session_url || data.verification_url,
    sessionToken: data.session_token,
    provider: 'didit',
  };
}


// ================================================================
// 4. GET SESSION RESULT — After user completes verification
// ================================================================
async function getSessionResult(sessionId) {
  requireApiKey();

  const data = await diditFetchJSON(`/session/${sessionId}/decision/`, 'GET');

  const approved = data.status === 'Approved';
  const idVerif = data.id_verifications?.[0] || data.id_verification || {};
  const liveness = data.liveness_checks?.[0] || data.liveness || {};
  const faceMatch = data.face_matches?.[0] || data.face_match || {};
  const ipAnalysis = data.ip_analysis || {};

  return {
    success: true,
    status: data.status,
    approved,
    sessionId: data.session_id,
    idVerification: {
      status: idVerif.status,
      documentType: idVerif.document_type,
      documentNumber: idVerif.document_number,
      fullName: idVerif.full_name,
      firstName: idVerif.first_name,
      lastName: idVerif.last_name,
      dateOfBirth: idVerif.date_of_birth,
      issuingState: idVerif.issuing_state,
      expirationDate: idVerif.expiration_date,
    },
    liveness: {
      status: liveness.status,
      score: liveness.score,
      method: liveness.method,
    },
    faceMatch: {
      status: faceMatch.status,
      similarity: faceMatch.similarity,
    },
    ipAnalysis: {
      status: ipAnalysis.status,
      country: ipAnalysis.country,
      isVPN: ipAnalysis.vpn,
      isProxy: ipAnalysis.proxy,
      isTor: ipAnalysis.tor,
      riskScore: ipAnalysis.abuse_score,
    },
    provider: 'didit',
  };
}


// ================================================================
// 5. PASSIVE LIVENESS CHECK — Standalone selfie verification
//    NO FALLBACKS. If Didit is down → verification fails.
// ================================================================
async function checkPassiveLiveness(selfieBase64) {
  requireApiKey();

  if (!selfieBase64 || selfieBase64.length < 500) {
    return {
      success: false,
      isLive: false,
      score: 0,
      message: 'A real selfie image is required for liveness verification.',
      provider: 'didit',
    };
  }

  const data = await diditFetchJSON('/passive-liveness/', 'POST', {
    selfie: selfieBase64.replace(/^data:image\/\w+;base64,/, ''),
  });

  const isLive = data.status === 'Approved';
  const score = data.score || 0;

  return {
    success: true,
    isLive,
    score,
    status: data.status,
    provider: 'didit',
    message: isLive
      ? `✅ Liveness confirmed (score: ${score}/100).`
      : `❌ Liveness check failed (status: ${data.status}).`,
  };
}


// ================================================================
// 6. FACE MATCH — Compare two faces (1:1)
// ================================================================
async function matchFaces(face1Base64, face2Base64) {
  requireApiKey();

  const data = await diditFetchJSON('/face-match/', 'POST', {
    face1: face1Base64.replace(/^data:image\/\w+;base64,/, ''),
    face2: face2Base64.replace(/^data:image\/\w+;base64,/, ''),
  });

  const similarity = data.similarity || 0;

  return {
    success: true,
    isMatch: similarity >= 70,
    similarity,
    provider: 'didit',
  };
}


// ================================================================
// 7. AML SCREENING — Check against 1,300+ watchlists
// ================================================================
async function screenAML(name, dateOfBirth, country = 'NG') {
  requireApiKey();

  const data = await diditFetchJSON('/aml-screening/', 'POST', {
    name,
    date_of_birth: dateOfBirth,
    country,
  });

  return {
    success: true,
    isClean: data.status === 'Approved' || !data.matches?.length,
    matches: data.matches || [],
    provider: 'didit',
  };
}


// ================================================================
// 8. WEBHOOK SIGNATURE VERIFICATION
//    MUST verify X-Signature-V2 before trusting payload
// ================================================================
function verifyWebhookSignature(rawBody, signatureHeader, timestampHeader) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET || config.didit?.webhookSecret;
  if (!secret) {
    console.error('[Didit Webhook] No webhook secret configured');
    return false;
  }

  // Check timestamp freshness (within 5 minutes)
  if (timestampHeader) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestampHeader)) > 300) {
      console.error('[Didit Webhook] Timestamp too old');
      return false;
    }
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader)
    );
  } catch (err) {
    console.error('[Didit Webhook] Signature verification error:', err.message);
    return false;
  }
}


// ================================================================
// 9. HEALTH CHECK — Test Didit connectivity
// ================================================================
async function testConnection() {
  const apiKey = config.didit?.apiKey || process.env.DIDIT_API_KEY;

  if (!apiKey) {
    return {
      connected: false,
      mode: 'NOT_CONFIGURED',
      message: '⛔ DIDIT_API_KEY is not set. Verification is DISABLED. Get your free key at https://business.didit.me',
      critical: true,
    };
  }

  try {
    await diditFetchJSON('/workflows/', 'GET');
    return {
      connected: true,
      mode: 'LIVE',
      provider: 'Didit KYC',
      freeMonthly: 500,
      message: '✅ Didit connected — live verification active.',
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'ERROR',
      message: `⛔ Didit connection failed: ${err.message}`,
      critical: true,
    };
  }
}


module.exports = {
  verifyBVN,
  verifyNIN,
  createKYCSession,
  getSessionResult,
  checkPassiveLiveness,
  matchFaces,
  screenAML,
  verifyWebhookSignature,
  testConnection,
};
