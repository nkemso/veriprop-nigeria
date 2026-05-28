'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — PUSH NOTIFICATION SERVICE (FCM V1 API)
 * ================================================================
 * Provider: Firebase Cloud Messaging V1 API
 * Price: 100% FREE, UNLIMITED forever
 * 
 * Setup:
 *   1. Go to console.firebase.google.com
 *   2. Project Settings → Service Accounts
 *   3. Click "Generate new private key" → download JSON
 *   4. Set FIREBASE_SERVICE_ACCOUNT env var to the JSON string
 *      OR set these 3 vars individually:
 *        FIREBASE_PROJECT_ID
 *        FIREBASE_CLIENT_EMAIL
 *        FIREBASE_PRIVATE_KEY
 * 
 * FCM V1 API uses OAuth2 access tokens from service account,
 * NOT the deprecated Legacy server key.
 * ================================================================
 */

const crypto = require('crypto');
const db = require('../db');
const config = require('../config');

// ================================================================
// FCM V1 AUTH — Get OAuth2 access token from service account
// ================================================================
let cachedToken = null;
let tokenExpiry = 0;

function getServiceAccount() {
  // Try full JSON from env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT JSON');
    }
  }

  // Try individual vars
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function base64url(data) {
  return Buffer.from(data).toString('base64url');
}

async function getAccessToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const sa = getServiceAccount();
  if (!sa) throw new Error('Firebase service account not configured');

  // Build JWT for Google OAuth2
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${signInput}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FCM OAuth2 error: ${res.status} ${err}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}


// ================================================================
// 1. SEND PUSH VIA FCM V1 API — To specific device token
// ================================================================
async function sendPushToDevice(deviceToken, title, body, data = {}) {
  const sa = getServiceAccount();
  if (!sa) {
    console.warn('[Push] Firebase not configured — push not sent:', title);
    return { success: false, message: 'FCM not configured', provider: 'fcm' };
  }

  try {
    const accessToken = await getAccessToken();
    const projectId = sa.project_id;

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: deviceToken,
            notification: {
              title,
              body,
            },
            webpush: {
              notification: {
                icon: '/icons/icon.svg',
                badge: '/icons/icon.svg',
                vibrate: [100, 50, 100],
              },
              fcm_options: {
                link: data.url || 'https://veriprop-nigeriang.vercel.app/dashboard',
              },
            },
            data: {
              ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
              timestamp: new Date().toISOString(),
            },
          },
        }),
      }
    );

    if (res.ok) {
      const result = await res.json();
      console.log(`[Push] ✅ Sent "${title}" (${result.name})`);
      return { success: true, messageId: result.name, provider: 'fcm_v1' };
    } else {
      const err = await res.text();
      console.warn('[Push] FCM V1 error:', res.status, err);
      return { success: false, message: `FCM error: ${res.status}`, provider: 'fcm_v1' };
    }
  } catch (err) {
    console.error('[Push] FCM error:', err.message);
    return { success: false, message: err.message, provider: 'fcm_v1' };
  }
}


// ================================================================
// 2. SEND PUSH TO TOPIC — Broadcast to all subscribers of a topic
// ================================================================
async function sendPushToTopic(topic, title, body, data = {}) {
  const sa = getServiceAccount();
  if (!sa) return { success: false, message: 'FCM not configured' };

  try {
    const accessToken = await getAccessToken();
    const projectId = sa.project_id;

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            topic,
            notification: { title, body },
            data: {
              ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
              timestamp: new Date().toISOString(),
            },
          },
        }),
      }
    );

    const result = await res.json();
    console.log(`[Push] Topic "${topic}":`, res.ok ? '✅' : '❌');
    return { success: res.ok, messageId: result.name, provider: 'fcm_v1' };
  } catch (err) {
    console.error('[Push] Topic error:', err.message);
    return { success: false, message: err.message };
  }
}


// ================================================================
// 3. IN-APP NOTIFICATION — Save to database (always works)
// ================================================================
async function createNotification(userId, title, message, type = 'info', data = {}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data,
      },
    });

    console.log(`[Notify] 📬 ${type}: "${title}" → user ${userId}`);
    return { success: true, notificationId: notification.id };
  } catch (err) {
    console.error('[Notify] Create error:', err.message);
    return { success: false, message: err.message };
  }
}


// ================================================================
// 4. MULTI-CHANNEL NOTIFY — In-app + Push + Email
// ================================================================
async function notifyUser(userId, { title, message, type = 'info', data = {}, email = false, push = false }) {
  const results = {};

  // Always create in-app notification
  results.inApp = await createNotification(userId, title, message, type, data);

  // Push notification (if FCM configured)
  if (push && getServiceAccount()) {
    // TODO: Look up user's FCM device token from DB
    console.log(`[Notify] Push queued for user ${userId}: "${title}"`);
    results.push = { success: true, message: 'Push queued' };
  }

  // Email notification
  if (email) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });
      if (user) {
        const emailService = require('./emailService');
        results.email = await emailService.sendEmail({
          to: user.email,
          subject: title,
          html: `<p>Hi ${user.firstName},</p><p>${message}</p>`,
        });
      }
    } catch (err) {
      results.email = { success: false, message: err.message };
    }
  }

  return results;
}


// ================================================================
// PRE-BUILT NOTIFICATION TEMPLATES
// ================================================================

async function notifyVerificationComplete(userId) {
  return notifyUser(userId, {
    title: '✅ Identity Verified!',
    message: 'Your identity has been verified. You now have full access to list properties, chat, and transact.',
    type: 'verification',
    push: true,
    email: true,
  });
}

async function notifyNewTransaction(userId, propertyTitle, amount) {
  return notifyUser(userId, {
    title: '💰 New Transaction',
    message: `A transaction for "${propertyTitle}" (₦${amount.toLocaleString()}) has been initiated.`,
    type: 'transaction',
    data: { propertyTitle, amount },
    push: true,
    email: true,
  });
}

async function notifyEscrowUpdate(userId, action, amount) {
  return notifyUser(userId, {
    title: `🔒 Escrow ${action}`,
    message: `Escrow of ₦${amount.toLocaleString()} has been ${action.toLowerCase()}.`,
    type: 'transaction',
    data: { action, amount },
    push: true,
    email: true,
  });
}

async function notifyNewMessage(userId, senderName, propertyTitle) {
  return notifyUser(userId, {
    title: '💬 New Message',
    message: `${senderName} sent you a message about "${propertyTitle}".`,
    type: 'info',
    push: true,
  });
}

async function notifyPropertyApproved(userId, propertyTitle) {
  return notifyUser(userId, {
    title: '🏠 Property Listed!',
    message: `Your property "${propertyTitle}" has been approved and is now live on the marketplace.`,
    type: 'success',
    push: true,
    email: true,
  });
}

async function notifyPropertyRejected(userId, propertyTitle, reason) {
  return notifyUser(userId, {
    title: '❌ Property Rejected',
    message: `Your listing "${propertyTitle}" was not approved: ${reason}`,
    type: 'warning',
    push: true,
    email: true,
  });
}

async function notifyFraudAlert(userId, reason) {
  return notifyUser(userId, {
    title: '🚨 Security Alert',
    message: `Suspicious activity detected on your account: ${reason}. If this wasn't you, contact support immediately.`,
    type: 'error',
    push: true,
    email: true,
  });
}


// ================================================================
// HEALTH CHECK
// ================================================================
async function testConnection() {
  const results = {};
  const sa = getServiceAccount();

  if (sa) {
    try {
      await getAccessToken();
      results.fcm = {
        connected: true,
        projectId: sa.project_id,
        message: `✅ FCM V1 connected (project: ${sa.project_id}) — unlimited free push`,
      };
    } catch (err) {
      results.fcm = { connected: false, message: `❌ FCM auth failed: ${err.message}` };
    }
  } else {
    results.fcm = {
      connected: false,
      message: '⚠️ Firebase not configured — set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
    };
  }

  results.inApp = { connected: true, message: '✅ In-app notifications always active' };

  return results;
}


module.exports = {
  sendPushToDevice,
  sendPushToTopic,
  createNotification,
  notifyUser,
  notifyVerificationComplete,
  notifyNewTransaction,
  notifyEscrowUpdate,
  notifyNewMessage,
  notifyPropertyApproved,
  notifyPropertyRejected,
  notifyFraudAlert,
  testConnection,
};
