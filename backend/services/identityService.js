'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — IDENTITY VERIFICATION SERVICE
 * ================================================================
 * Real BVN/NIN verification against NIBSS/NIMC government databases.
 * 
 * Supports multiple providers (swap with one env var):
 * 
 * Provider 1: NINBVNPortal (DEFAULT)
 *   - BVN: ₦100 | NIN: ₦150
 *   - Signup: ninbvnportal.com.ng (any email)
 *   - Env: NINBVN_API_KEY
 * 
 * Provider 2: Prembly/IdentityPass (CHEAPEST)
 *   - BVN: ₦20 | NIN: ₦80 | CAC: ₦20
 *   - Signup: myidentitypass.com (company email required)
 *   - Env: PREMBLY_API_KEY + PREMBLY_APP_ID
 * 
 * Switch provider: Set IDENTITY_PROVIDER=prembly in Railway
 * Default: ninbvnportal
 * ================================================================
 */

const config = require('../config');

// ================================================================
// PROVIDER SELECTION
// ================================================================
function getProvider() {
  return process.env.IDENTITY_PROVIDER || 'ninbvnportal';
}


// ================================================================
// PROVIDER 1: NINBVNPortal
// API: ninbvnportal.com.ng
// BVN: ₦100 | NIN: ₦150
// ================================================================

async function ninbvnportal_verifyBVN(bvn) {
  const apiKey = process.env.NINBVN_API_KEY;
  if (!apiKey) throw new Error('NINBVN_API_KEY not configured');

  const res = await fetch('https://ninbvnportal.com.ng/api/bvn-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ bvn, consent: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NINBVNPortal BVN error ${res.status}: ${err}`);
  }

  const data = await res.json();

  if (data.status !== 'success') {
    return {
      verified: false,
      message: data.message || 'BVN not found in NIBSS database.',
      provider: 'ninbvnportal',
    };
  }

  return {
    verified: true,
    data: {
      firstName: data.data?.firstname,
      middleName: data.data?.middlename,
      lastName: data.data?.surname,
      phone: data.data?.telephoneno,
      dateOfBirth: data.data?.birthdate,
      gender: data.data?.gender,
      photo: data.data?.photo, // Base64 image from NIBSS
      state: data.data?.residence_state,
      lga: data.data?.residence_lga,
      nin: data.data?.nin, // BVN lookup also returns linked NIN
    },
    message: '✅ BVN verified against NIBSS database.',
    provider: 'ninbvnportal',
    reportId: data.reportID,
  };
}

async function ninbvnportal_verifyNIN(nin) {
  const apiKey = process.env.NINBVN_API_KEY;
  if (!apiKey) throw new Error('NINBVN_API_KEY not configured');

  const res = await fetch('https://ninbvnportal.com.ng/api/nin-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ nin, consent: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NINBVNPortal NIN error ${res.status}: ${err}`);
  }

  const data = await res.json();

  if (data.status !== 'success') {
    return {
      verified: false,
      message: data.message || 'NIN not found in NIMC database.',
      provider: 'ninbvnportal',
    };
  }

  return {
    verified: true,
    data: {
      firstName: data.data?.firstname,
      middleName: data.data?.middlename,
      lastName: data.data?.surname,
      phone: data.data?.telephoneno,
      dateOfBirth: data.data?.birthdate,
      gender: data.data?.gender,
      photo: data.data?.photo,
      state: data.data?.birthstate,
      lga: data.data?.birthlga,
      address: data.data?.residence_address,
    },
    message: '✅ NIN verified against NIMC database.',
    provider: 'ninbvnportal',
    reportId: data.reportID,
  };
}


// ================================================================
// PROVIDER 2: Prembly (IdentityPass)
// API: api.myidentitypay.com
// BVN Basic: ₦20 | NIN: ₦80 | CAC: ₦20
// ================================================================

async function prembly_verifyBVN(bvn) {
  const apiKey = process.env.PREMBLY_API_KEY;
  const appId = process.env.PREMBLY_APP_ID;
  if (!apiKey) throw new Error('PREMBLY_API_KEY not configured');

  const res = await fetch('https://api.myidentitypay.com/api/v2/biometrics/merchant/data/verification/bvn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'app-id': appId || '',
    },
    body: JSON.stringify({ number: bvn }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Prembly BVN error ${res.status}: ${err}`);
  }

  const data = await res.json();

  if (!data.status || data.response_code !== '00') {
    return {
      verified: false,
      message: data.detail || data.message || 'BVN not found.',
      provider: 'prembly',
    };
  }

  const bvnData = data.bvn_data || data.data || {};

  return {
    verified: true,
    data: {
      firstName: bvnData.firstName,
      middleName: bvnData.middleName,
      lastName: bvnData.lastName,
      phone: bvnData.phoneNumber1,
      dateOfBirth: bvnData.dateOfBirth,
      gender: bvnData.gender,
      photo: bvnData.base64Image,
      state: bvnData.stateOfOrigin,
      lga: bvnData.lgaOfOrigin,
      nin: bvnData.nin,
      enrollmentBank: bvnData.enrollmentBank,
    },
    message: '✅ BVN verified against NIBSS database.',
    provider: 'prembly',
  };
}

async function prembly_verifyNIN(nin) {
  const apiKey = process.env.PREMBLY_API_KEY;
  const appId = process.env.PREMBLY_APP_ID;
  if (!apiKey) throw new Error('PREMBLY_API_KEY not configured');

  const res = await fetch('https://api.myidentitypay.com/api/v2/biometrics/merchant/data/verification/nin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'app-id': appId || '',
    },
    body: JSON.stringify({ number: nin }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Prembly NIN error ${res.status}: ${err}`);
  }

  const data = await res.json();

  if (!data.status || data.response_code !== '00') {
    return {
      verified: false,
      message: data.detail || data.message || 'NIN not found.',
      provider: 'prembly',
    };
  }

  const ninData = data.nin_data || data.data || {};

  return {
    verified: true,
    data: {
      firstName: ninData.firstname,
      middleName: ninData.middlename,
      lastName: ninData.surname,
      phone: ninData.telephoneno,
      dateOfBirth: ninData.birthdate,
      gender: ninData.gender,
      photo: ninData.photo,
      state: ninData.self_origin_state,
      lga: ninData.self_origin_lga,
      address: ninData.residence_AdressLine1,
    },
    message: '✅ NIN verified against NIMC database.',
    provider: 'prembly',
  };
}

// Prembly CAC verification (₦20)
async function prembly_verifyCAC(rcNumber) {
  const apiKey = process.env.PREMBLY_API_KEY;
  const appId = process.env.PREMBLY_APP_ID;
  if (!apiKey) throw new Error('PREMBLY_API_KEY not configured');

  const res = await fetch('https://api.myidentitypay.com/api/v2/biometrics/merchant/data/verification/cac', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'app-id': appId || '',
    },
    body: JSON.stringify({ rc_number: rcNumber, company_type: 'BUSINESS_NAME' }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Prembly CAC error ${res.status}: ${err}`);
  }

  const data = await res.json();

  return {
    verified: data.status && data.response_code === '00',
    data: data.data || {},
    message: data.status ? '✅ CAC verified.' : '❌ CAC not found.',
    provider: 'prembly',
  };
}


// ================================================================
// UNIFIED API — Routes to active provider automatically
// ================================================================

async function verifyBVN(bvn) {
  const provider = getProvider();
  console.log(`[Identity] Verifying BVN via ${provider}...`);

  try {
    if (provider === 'prembly') return await prembly_verifyBVN(bvn);
    return await ninbvnportal_verifyBVN(bvn);
  } catch (err) {
    console.error(`[Identity] BVN verification failed (${provider}):`, err.message);
    return {
      verified: false,
      message: `BVN verification failed: ${err.message}`,
      provider,
      error: err.message,
    };
  }
}

async function verifyNIN(nin) {
  const provider = getProvider();
  console.log(`[Identity] Verifying NIN via ${provider}...`);

  try {
    if (provider === 'prembly') return await prembly_verifyNIN(nin);
    return await ninbvnportal_verifyNIN(nin);
  } catch (err) {
    console.error(`[Identity] NIN verification failed (${provider}):`, err.message);
    return {
      verified: false,
      message: `NIN verification failed: ${err.message}`,
      provider,
      error: err.message,
    };
  }
}

async function verifyCAC(rcNumber) {
  // Only Prembly supports CAC
  try {
    return await prembly_verifyCAC(rcNumber);
  } catch (err) {
    return { verified: false, message: err.message, provider: 'prembly' };
  }
}

// ================================================================
// NAME MATCHING — Cross-reference API response with user profile
// ================================================================
function matchNames(apiData, userFirstName, userLastName) {
  if (!apiData?.firstName && !apiData?.lastName) return { match: false, score: 0 };

  const normalize = (s) => (s || '').toLowerCase().trim();

  const apiFirst = normalize(apiData.firstName);
  const apiLast = normalize(apiData.lastName);
  const apiMiddle = normalize(apiData.middleName);
  const userFirst = normalize(userFirstName);
  const userLast = normalize(userLastName);

  // Direct match
  if (apiFirst === userFirst && apiLast === userLast) {
    return { match: true, score: 100, detail: 'Exact match' };
  }

  // First name matches, last name in middle name or vice versa
  if (apiFirst === userFirst || apiLast === userLast) {
    return { match: true, score: 75, detail: 'Partial match' };
  }

  // Swapped names (common in Nigeria — surname/firstname order varies)
  if (apiFirst === userLast && apiLast === userFirst) {
    return { match: true, score: 90, detail: 'Names swapped but match' };
  }

  // Check if user's name appears anywhere in API names
  const apiFullName = `${apiFirst} ${apiMiddle} ${apiLast}`;
  if (apiFullName.includes(userFirst) || apiFullName.includes(userLast)) {
    return { match: true, score: 60, detail: 'Name found in full name' };
  }

  return { match: false, score: 0, detail: 'No match' };
}


// ================================================================
// HEALTH CHECK
// ================================================================
async function testConnection() {
  const provider = getProvider();
  const results = { activeProvider: provider };

  // Check NINBVNPortal
  if (process.env.NINBVN_API_KEY) {
    try {
      const res = await fetch('https://ninbvnportal.com.ng/api/balance', {
        headers: { 'x-api-key': process.env.NINBVN_API_KEY },
      });
      const data = await res.json();
      results.ninbvnportal = {
        connected: res.ok,
        balance: data.data?.formatted_balance || data.data?.balance,
        message: res.ok
          ? `✅ NINBVNPortal connected (Balance: ${data.data?.formatted_balance || '?'}) — BVN ₦100 / NIN ₦150`
          : '❌ NINBVNPortal connection failed',
      };
    } catch (err) {
      results.ninbvnportal = { connected: false, message: '❌ ' + err.message };
    }
  } else {
    results.ninbvnportal = { connected: false, message: '⚠️ NINBVN_API_KEY not set' };
  }

  // Check Prembly
  if (process.env.PREMBLY_API_KEY) {
    results.prembly = {
      connected: true,
      message: '✅ Prembly configured — BVN ₦20 / NIN ₦80 / CAC ₦20',
    };
  } else {
    results.prembly = { connected: false, message: '⚠️ PREMBLY_API_KEY not set (cheapest option)' };
  }

  return results;
}


module.exports = {
  verifyBVN,
  verifyNIN,
  verifyCAC,
  matchNames,
  testConnection,
  getProvider,
};
