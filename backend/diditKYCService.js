'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — DIDIT KYC SERVICE (PRODUCTION — FREE TIER)
 * ================================================================
 * ZERO-TRUST using Didit's FREE session-based KYC:
 *
 *   ✅ OCR               — Scans ID document, extracts data            FREE
 *   ✅ LIVENESS           — AI confirms real person, not photo/mask     FREE
 *   ✅ FACE_MATCH         — Selfie matches document portrait photo      FREE
 *   ✅ IP_ANALYSIS        — Flags VPNs, proxies, Tor                   FREE
 *
 *   500 FREE sessions/month forever. $0.33/session after that.
 *   No simulations. No fallbacks. No demo modes.
 *
 * ALLOWED WORKFLOW FEATURES (from Didit API):
 *   AGE_ESTIMATION, AML, DATABASE_VALIDATION, EMAIL_VERIFICATION,
 *   FACE_MATCH, IP_ANALYSIS, KYB_DOCUMENTS, KYB_KEY_PEOPLE,
 *   KYB_REGISTRY, LIVENESS, NFC, OCR, PHONE_VERIFICATION,
 *   PROOF_OF_ADDRESS, QUESTIONNAIRE
 *
 * GET YOUR KEY: business.didit.me (60-second signup, no credit card)
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
// 1. CREATE / GET WORKFLOW — One-time setup
//    Features: OCR + LIVENESS + FACE_MATCH + IP_ANALYSIS
//    All 4 features are FREE (500 sessions/month)
//
//    NOTE: Didit API accepts "OCR" (not "ID_VERIFICATION")
//    for document scanning in workflow features.
// ================================================================
async function getOrCreateWorkflow() {
  if (cachedWorkflowId) return cachedWorkflowId;

  // Check env first
  if (process.env.DIDIT_WORKFLOW_ID) {
    cachedWorkflowId = process.env.DIDIT_WORKFLOW_ID;
    return cachedWorkflowId;
  }

  try {
    // Try to list existing workflows first
    const existing = await diditFetchJSON('/workflows/', 'GET');
    if (Array.isArray(existing) && existing.length > 0) {
      const suitable = existing.find(w => {
        const features = w.features || [];
        return features.includes('OCR') && features.includes('LIVENESS');
      });
      if (suitable) {
        cachedWorkflowId = suitable.uuid || suitable.id;
        console.log('[Didit] Using existing workflow:', cachedWorkflowId);
        return cachedWorkflowId;
      }
    }
  } catch (e) {
    console.log('[Didit] Could not list workflows, creating new one...');
  }

  try {
    const data = await diditFetchJSON('/workflows/', 'POST', {
      workflow_label: 'VeriProp Nigeria KYC',
      features: [
        { feature: 'OCR' },
        { feature: 'LIVENESS' },
        { feature: 'FACE_MATCH' },
        { feature: 'IP_ANALYSIS' },
      ],
    });
    cachedWorkflowId = data.uuid || data.id;
    console.log('[Didit] ✅ Workflow created:', cachedWorkflowId);
    return cachedWorkflowId;
  } catch (err) {
    console.error('[Didit] Workflow creation failed:', err.message);
    throw new Error('Failed to create KYC workflow: ' + err.message);
  }
}


// ================================================================
// 2. CREATE KYC SESSION — The core free verification flow
//    Redirects user to Didit's hosted UI for:
//      → Document scan (NIN slip, passport, driver's license)
//      → Selfie capture (passive liveness)
//      → Face match (selfie vs document portrait)
//      → IP & device analysis
//    500 FREE sessions/month, then $0.33/session
// ================================================================
async function createKYCSession(userId, callbackUrl) {
  requireApiKey();

  const workflowId = await getOrCreateWorkflow();

  const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : (config.app?.url || process.env.APP_URL || 'https://veriprop-nigeria-production.up.railway.app');

  const callback = callbackUrl || `${backendUrl}/api/v1/verify/didit-webhook`;

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
// 3. GET SESSION RESULT — After user completes verification
// ================================================================
async function getSessionResult(sessionId) {
  requireApiKey();

  const data = await diditFetchJSON(`/session/${sessionId}/decision/`, 'GET');

  const status = data.status;
  const approved = status === 'Approved';

  const idVerif = data.id_verifications?.[0] || {};
  const liveness = data.liveness_checks?.[0] || {};
  const faceMatch = data.face_matches?.[0] || {};
  const ipAnalysis = data.ip_analyses?.[0] || data.ip_analysis || {};

  return {
    success: true,
    status,
    approved,
    sessionId: data.session_id,
    vendorData: data.vendor_data,

    idVerification: {
      status: idVerif.status,
      documentType: idVerif.document_type,
      documentNumber: idVerif.document_number || idVerif.personal_number,
      fullName: idVerif.full_name,
      firstName: idVerif.first_name,
      lastName: idVerif.last_name,
      dateOfBirth: idVerif.date_of_birth,
      issuingState: idVerif.issuing_state,
      issuingStateName: idVerif.issuing_state_name,
      expirationDate: idVerif.expiration_date,
      gender: idVerif.gender,
      nationality: idVerif.nationality,
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
      city: ipAnalysis.city,
      isVPN: ipAnalysis.vpn,
      isProxy: ipAnalysis.proxy,
      isTor: ipAnalysis.tor,
      riskScore: ipAnalysis.abuse_score,
    },
    provider: 'didit',
  };
}


// ================================================================
// 4. PASSIVE LIVENESS CHECK — Standalone selfie verification
//    Part of the free tier (500/month)
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
// 5. FACE MATCH — Compare two faces (1:1)
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
// 6. WEBHOOK SIGNATURE VERIFICATION
// ================================================================
function verifyWebhookSignature(rawBody, signatureHeader, timestampHeader) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET || config.didit?.webhookSecret;
  if (!secret) {
    console.error('[Didit Webhook] No webhook secret configured');
    return false;
  }

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
// 7. HEALTH CHECK
// ================================================================
async function testConnection() {
  const apiKey = config.didit?.apiKey || process.env.DIDIT_API_KEY;

  if (!apiKey) {
    return {
      connected: false,
      mode: 'NOT_CONFIGURED',
      message: '⛔ DIDIT_API_KEY is not set. Verification is DISABLED.',
      critical: true,
    };
  }

  try {
    await diditFetchJSON('/workflows/', 'GET');
    return {
      connected: true,
      mode: 'LIVE',
      provider: 'Didit KYC (Free Session-based)',
      freeMonthly: 500,
      message: '✅ Didit connected — free session verification active.',
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
  createKYCSession,
  getSessionResult,
  checkPassiveLiveness,
  matchFaces,
  verifyWebhookSignature,
  testConnection,
  getOrCreateWorkflow,
};
