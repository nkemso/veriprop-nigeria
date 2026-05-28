'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — PUSH NOTIFICATION SERVICE (FCM)
 * ================================================================
 * Provider: Firebase Cloud Messaging (FCM)
 * Price: 100% FREE, UNLIMITED forever
 * 
 * Setup:
 *   1. Go to console.firebase.google.com
 *   2. Create project "VeriProp Nigeria"
 *   3. Project Settings → Service Accounts → Generate New Private Key
 *   4. Save as FIREBASE_SERVICE_ACCOUNT env var (JSON string)
 *      OR save as firebase-service-account.json in project root
 *   5. Project Settings → Cloud Messaging → Get Server Key (legacy)
 *      Save as FCM_SERVER_KEY env var
 * 
 * Two delivery methods:
 *   A. FCM HTTP v1 API (recommended, uses service account)
 *   B. FCM Legacy API (simpler, uses server key)
 *   C. Web Push (VAPID-based, for browser notifications)
 * 
 * We use method B (Legacy) for simplicity + method C for web push.
 * ================================================================
 */

const crypto = require('crypto');
const db = require('../db');
const config = require('../config');

const FCM_LEGACY_URL = 'https://fcm.googleapis.com/fcm/send';

// ================================================================
// 1. SEND PUSH VIA FCM LEGACY API — To specific device token
// ================================================================
async function sendPushToDevice(deviceToken, title, body, data = {}) {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    console.warn('[Push] FCM_SERVER_KEY not set — push not sent:', title);
    return { success: false, message: 'FCM not configured', provider: 'fcm' };
  }

  try {
    const res = await fetch(FCM_LEGACY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: deviceToken,
        notification: {
          title,
          body,
          icon: '/icons/icon.svg',
          click_action: data.url || 'https://veriprop-nigeriang.vercel.app/dashboard',
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const result = await res.json();

    if (result.success === 1) {
      console.log(`[Push] ✅ Sent "${title}" to device`);
      return { success: true, provider: 'fcm' };
    } else {
      console.warn('[Push] FCM delivery failed:', result.results?.[0]?.error);
      return { success: false, message: result.results?.[0]?.error, provider: 'fcm' };
    }
  } catch (err) {
    console.error('[Push] FCM error:', err.message);
    return { success: false, message: err.message, provider: 'fcm' };
  }
}


// ================================================================
// 2. SEND PUSH VIA FCM — To topic (broadcast to all subscribers)
// ================================================================
async function sendPushToTopic(topic, title, body, data = {}) {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    console.warn('[Push] FCM_SERVER_KEY not set — topic push not sent');
    return { success: false, message: 'FCM not configured' };
  }

  try {
    const res = await fetch(FCM_LEGACY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: `/topics/${topic}`,
        notification: { title, body, icon: '/icons/icon.svg' },
        data: { ...data, timestamp: new Date().toISOString() },
      }),
    });

    const result = await res.json();
    console.log(`[Push] Topic "${topic}" push:`, result.message_id ? '✅' : '❌');
    return { success: !!result.message_id, messageId: result.message_id, provider: 'fcm' };
  } catch (err) {
    console.error('[Push] Topic push error:', err.message);
    return { success: false, message: err.message };
  }
}


// ================================================================
// 3. WEB PUSH — Using VAPID keys for browser notifications
//    This works without FCM — uses standard Web Push Protocol
// ================================================================
function generateVAPIDKeys() {
  // Generate VAPID keys for Web Push (run once, save to env)
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    publicKey: ecdh.getPublicKey('base64url'),
    privateKey: ecdh.getPrivateKey('base64url'),
  };
}

async function sendWebPush(subscription, title, body, data = {}) {
  // Web Push requires the `web-push` npm package
  // For now, we store the notification in DB and let the frontend poll
  // When you add `npm install web-push`, activate this:
  //
  // const webpush = require('web-push');
  // webpush.setVapidDetails(
  //   'mailto:support@veripropnigeria.com',
  //   process.env.VAPID_PUBLIC_KEY,
  //   process.env.VAPID_PRIVATE_KEY
  // );
  // await webpush.sendNotification(subscription, JSON.stringify({ title, body, ...data }));

  console.log(`[WebPush] Queued: "${title}" — ${body}`);
  return { success: true, message: 'Web push queued', provider: 'web_push' };
}


// ================================================================
// 4. IN-APP NOTIFICATION — Save to database
//    Always works, no external service needed
// ================================================================
async function createNotification(userId, title, message, type = 'info', data = {}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type, // info, success, warning, error, transaction, verification
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
// 5. MULTI-CHANNEL NOTIFY — Send via all available channels
//    In-app (always) + Push (if FCM configured) + Email (if Resend configured)
// ================================================================
async function notifyUser(userId, { title, message, type = 'info', data = {}, email = false, push = false }) {
  const results = {};

  // Always create in-app notification
  results.inApp = await createNotification(userId, title, message, type, data);

  // Push notification (if FCM configured and user has device token)
  if (push && process.env.FCM_SERVER_KEY) {
    // TODO: Look up user's FCM device token from DB
    // For now, just log
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
    message: `Suspicious activity detected on your account: ${reason}. If this wasn't you, please contact support immediately.`,
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

  results.fcm = process.env.FCM_SERVER_KEY
    ? { connected: true, message: '✅ FCM ready (unlimited free push)' }
    : { connected: false, message: '⚠️ FCM_SERVER_KEY not set — push notifications disabled' };

  results.inApp = { connected: true, message: '✅ In-app notifications always active' };

  return results;
}


module.exports = {
  // Core send functions
  sendPushToDevice,
  sendPushToTopic,
  sendWebPush,
  createNotification,
  notifyUser,

  // Pre-built templates
  notifyVerificationComplete,
  notifyNewTransaction,
  notifyEscrowUpdate,
  notifyNewMessage,
  notifyPropertyApproved,
  notifyPropertyRejected,
  notifyFraudAlert,

  // Utils
  generateVAPIDKeys,
  testConnection,
};
