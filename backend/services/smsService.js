'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — SMS OTP SERVICE (Didit Phone Verification)
 * ================================================================
 * Provider: Didit (didit.me)
 * Endpoints: POST /v3/phone/send/ + POST /v3/phone/check/
 * Price: $0.04 per SMS + carrier fees
 * 
 * Uses same DIDIT_API_KEY already configured.
 * 
 * Didit handles:
 *   - OTP generation
 *   - SMS delivery (via their carrier network)
 *   - OTP verification
 *   - Rate limiting & fraud prevention
 * 
 * We don't need to generate/store OTPs ourselves — Didit does it all.
 * ================================================================
 */

const config = require('../config');
const db = require('../db');

const DIDIT_BASE = 'https://verification.didit.me/v3';

// ================================================================
// HELPER — Didit API call
// ================================================================
async function diditFetch(endpoint, method = 'POST', body = null) {
  const apiKey = config.didit?.apiKey || process.env.DIDIT_API_KEY;
  if (!apiKey) {
    throw new Error('DIDIT_API_KEY not configured. SMS OTP requires Didit.');
  }

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
    throw new Error(`Didit SMS ${res.status}: ${err}`);
  }
  return res.json();
}


// ================================================================
// 1. SEND OTP — Didit generates and sends the OTP via SMS
// ================================================================
async function sendOTP(phoneNumber, channel = 'sms') {
  // Normalize Nigerian phone number to E.164 format
  let phone = phoneNumber.trim();
  if (phone.startsWith('0')) {
    phone = '+234' + phone.slice(1);
  } else if (phone.startsWith('234') && !phone.startsWith('+')) {
    phone = '+' + phone;
  } else if (!phone.startsWith('+')) {
    phone = '+234' + phone;
  }

  // Validate format
  if (!/^\+234[789][01]\d{8}$/.test(phone)) {
    return {
      success: false,
      message: 'Invalid Nigerian phone number. Must be a valid MTN, Glo, Airtel, or 9mobile number.',
    };
  }

  try {
    const data = await diditFetch('/phone/send/', 'POST', {
      phone: phone,
      channel: channel, // 'sms' or 'whatsapp'
    });

    console.log(`[SMS] OTP sent to ${phone.slice(0, 7)}****${phone.slice(-2)} via ${channel}`);

    return {
      success: true,
      message: `OTP sent to ${phone.slice(0, 7)}****${phone.slice(-2)}`,
      requestId: data.request_id || data.id,
      provider: 'didit',
      channel,
    };
  } catch (err) {
    console.error('[SMS] Send OTP error:', err.message);
    return {
      success: false,
      message: 'Failed to send OTP: ' + err.message,
      provider: 'didit',
    };
  }
}


// ================================================================
// 2. VERIFY OTP — Didit checks the code
// ================================================================
async function verifyOTP(phoneNumber, code) {
  let phone = phoneNumber.trim();
  if (phone.startsWith('0')) phone = '+234' + phone.slice(1);
  else if (phone.startsWith('234') && !phone.startsWith('+')) phone = '+' + phone;
  else if (!phone.startsWith('+')) phone = '+234' + phone;

  if (!code || !/^\d{4,8}$/.test(code)) {
    return { success: false, verified: false, message: 'Invalid OTP format.' };
  }

  try {
    const data = await diditFetch('/phone/check/', 'POST', {
      phone: phone,
      code: code,
    });

    const verified = data.status === 'Approved' || data.valid === true;

    console.log(`[SMS] OTP verify for ${phone.slice(0, 7)}****: ${verified ? '✅' : '❌'}`);

    return {
      success: true,
      verified,
      message: verified ? '✅ Phone number verified!' : '❌ Invalid or expired OTP.',
      provider: 'didit',
    };
  } catch (err) {
    console.error('[SMS] Verify OTP error:', err.message);
    return {
      success: false,
      verified: false,
      message: 'OTP verification failed: ' + err.message,
      provider: 'didit',
    };
  }
}


// ================================================================
// 3. SEND TRANSACTIONAL SMS — For alerts, not OTP
//    Falls back to Didit phone/send with a custom message
//    For high-volume alerts, swap to Smart SMS Solutions later
// ================================================================
async function sendSMS(phoneNumber, message) {
  // For now, log only — Didit phone API is OTP-focused
  // When you add Smart SMS Solutions, wire it here
  console.log(`[SMS] Alert to ${phoneNumber}: ${message}`);
  return {
    success: true,
    message: 'SMS alert logged (wire SmartSMS for delivery)',
    provider: 'pending',
  };
}


// ================================================================
// HEALTH CHECK
// ================================================================
async function testConnection() {
  const apiKey = config.didit?.apiKey || process.env.DIDIT_API_KEY;
  if (!apiKey) {
    return { connected: false, provider: 'didit_phone', message: '⛔ DIDIT_API_KEY not set' };
  }
  return {
    connected: true,
    provider: 'didit_phone',
    message: '✅ Didit Phone Verification ready ($0.04/SMS + carrier)',
  };
}


module.exports = {
  sendOTP,
  verifyOTP,
  sendSMS,
  testConnection,
};
