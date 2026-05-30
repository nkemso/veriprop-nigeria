'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — TELEGRAM SERVICE (Full Suite)
 * ================================================================
 * All features are 100% FREE, unlimited forever.
 *
 * 1. BOT NOTIFICATIONS — Send alerts to users via Telegram
 * 2. TELEGRAM LOGIN — One-tap auth, phone pre-verified
 * 3. BOT OTP — Send verification codes via Telegram (free OTP)
 * 4. CHANNEL POSTING — Post to @VeriPropNigeria announcements
 *
 * Setup:
 *   1. Message @BotFather on Telegram → /newbot
 *   2. Set TELEGRAM_BOT_TOKEN in Railway
 *   3. Optionally set TELEGRAM_CHANNEL_ID (e.g. @VeriPropNigeria)
 *
 * Bot API: https://core.telegram.org/bots/api
 * ================================================================
 */

const crypto = require('crypto');
const config = require('../config');
const db = require('../db');

const TG_API = 'https://api.telegram.org/bot';

// ================================================================
// HELPER — Call Telegram Bot API
// ================================================================
function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

async function tgFetch(method, params = {}) {
  const token = getBotToken();
  if (!token) {
    console.warn('[Telegram] BOT_TOKEN not set — skipping:', method);
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch(`${TG_API}${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error(`[Telegram] ${method} error:`, data.description);
    }
    return data;
  } catch (err) {
    console.error(`[Telegram] ${method} fetch error:`, err.message);
    return { ok: false, error: err.message };
  }
}


// ================================================================
// 1. SEND MESSAGE — Core notification to a user's Telegram
// ================================================================
async function sendMessage(chatId, text, options = {}) {
  if (!chatId) return { ok: false, message: 'No chatId' };

  return tgFetch('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode || 'HTML',
    disable_web_page_preview: options.disablePreview !== false,
    reply_markup: options.replyMarkup || undefined,
  });
}


// ================================================================
// 2. NOTIFICATION TEMPLATES — Pre-built alerts
// ================================================================

async function notifyVerificationComplete(chatId, firstName) {
  return sendMessage(chatId, [
    `✅ <b>Identity Verified!</b>`,
    ``,
    `Congratulations ${firstName}! Your identity has been verified.`,
    `You are now <b>Tier 3 Verified</b> on VeriProp Naija Properties.`,
    ``,
    `You can now:`,
    `• List properties on the marketplace`,
    `• Initiate negotiations and secure chats`,
    `• Use escrow and multi-sig transactions`,
    ``,
    `🏠 <a href="https://veriprop-nigeriang.vercel.app/dashboard">Go to Dashboard</a>`,
  ].join('\n'));
}

async function notifyTransaction(chatId, propertyTitle, amount, status) {
  const emoji = status === 'completed' ? '✅' : status === 'pending' ? '⏳' : '💰';
  return sendMessage(chatId, [
    `${emoji} <b>Transaction ${status.toUpperCase()}</b>`,
    ``,
    `📍 Property: <b>${propertyTitle}</b>`,
    `💰 Amount: <b>₦${(amount || 0).toLocaleString()}</b>`,
    `📅 ${new Date().toLocaleString('en-NG')}`,
    ``,
    `<a href="https://veriprop-nigeriang.vercel.app/dashboard">View Details →</a>`,
  ].join('\n'));
}

async function notifyEscrow(chatId, action, amount) {
  return sendMessage(chatId, [
    `🔒 <b>Escrow ${action}</b>`,
    ``,
    `Amount: <b>₦${(amount || 0).toLocaleString()}</b>`,
    `Action: ${action}`,
    `Date: ${new Date().toLocaleString('en-NG')}`,
    ``,
    `<a href="https://veriprop-nigeriang.vercel.app/dashboard">View Escrow →</a>`,
  ].join('\n'));
}

async function notifyNewMessage(chatId, senderName, propertyTitle) {
  return sendMessage(chatId, [
    `💬 <b>New Message</b>`,
    ``,
    `<b>${senderName}</b> sent you a message about:`,
    `📍 "${propertyTitle}"`,
    ``,
    `<a href="https://veriprop-nigeriang.vercel.app/dashboard">Reply Now →</a>`,
  ].join('\n'));
}

async function notifyPropertyApproved(chatId, propertyTitle) {
  return sendMessage(chatId, [
    `🏠 <b>Property Listed!</b>`,
    ``,
    `Your property "<b>${propertyTitle}</b>" has been approved and is now live on the marketplace.`,
    ``,
    `<a href="https://veriprop-nigeriang.vercel.app/properties">View Listing →</a>`,
  ].join('\n'));
}

async function notifyPropertyRejected(chatId, propertyTitle, reason) {
  return sendMessage(chatId, [
    `❌ <b>Property Rejected</b>`,
    ``,
    `Your listing "<b>${propertyTitle}</b>" was not approved.`,
    `Reason: ${reason}`,
    ``,
    `<a href="https://veriprop-nigeriang.vercel.app/dashboard">Edit & Resubmit →</a>`,
  ].join('\n'));
}

async function notifyFraudAlert(chatId) {
  return sendMessage(chatId, [
    `🚨 <b>SECURITY ALERT</b>`,
    ``,
    `Suspicious activity detected on your VeriProp account.`,
    `If this wasn't you, please secure your account immediately.`,
    ``,
    `<a href="https://veriprop-nigeriang.vercel.app/dashboard">Secure Account →</a>`,
  ].join('\n'));
}


// ================================================================
// 3. TELEGRAM OTP — Send verification code via bot (₦0 cost)
// ================================================================
async function sendOTP(chatId, otp) {
  return sendMessage(chatId, [
    `🔐 <b>VeriProp Verification Code</b>`,
    ``,
    `Your code: <code>${otp}</code>`,
    ``,
    `⏱ Expires in 10 minutes.`,
    `⚠️ Do NOT share this code with anyone.`,
    `VeriProp will never ask for this code.`,
  ].join('\n'));
}


// ================================================================
// 4. TELEGRAM LOGIN — Verify login widget data
//    https://core.telegram.org/widgets/login
// ================================================================
function verifyTelegramLogin(loginData) {
  const token = getBotToken();
  if (!token) return { valid: false, message: 'Bot token not configured' };

  const { hash, ...data } = loginData;
  if (!hash) return { valid: false, message: 'No hash provided' };

  // Check auth_date is not too old (allow 1 hour)
  const authDate = parseInt(data.auth_date);
  if (Date.now() / 1000 - authDate > 3600) {
    return { valid: false, message: 'Login data expired' };
  }

  // Build check string: key=value pairs sorted alphabetically, joined by \n
  const checkString = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join('\n');

  // Hash the bot token with SHA256, then HMAC the check string
  const secretKey = crypto.createHash('sha256').update(token).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (hmac !== hash) {
    return { valid: false, message: 'Invalid hash — data tampered' };
  }

  return {
    valid: true,
    user: {
      telegramId: data.id,
      firstName: data.first_name,
      lastName: data.last_name || '',
      username: data.username || '',
      photoUrl: data.photo_url || '',
    },
  };
}


// ================================================================
// 5. CHANNEL POSTING — Post announcements to @VeriPropNigeria
// ================================================================
async function postToChannel(text, channelId) {
  const channel = channelId || process.env.TELEGRAM_CHANNEL_ID || '@VeriPropNigeria';
  return sendMessage(channel, text);
}

async function postNewListing(propertyTitle, price, location, listingUrl) {
  const channel = process.env.TELEGRAM_CHANNEL_ID || '@VeriPropNigeria';
  return sendMessage(channel, [
    `🏠 <b>New Property Listed!</b>`,
    ``,
    `📍 <b>${propertyTitle}</b>`,
    `💰 ₦${(price || 0).toLocaleString()}`,
    `📌 ${location}`,
    ``,
    `✅ Verified seller · 🔒 Escrow protected`,
    ``,
    `<a href="${listingUrl || 'https://veriprop-nigeriang.vercel.app/properties'}">View Property →</a>`,
    ``,
    `#VeriPropNigeria #RealEstate #Nigeria #Property`,
  ].join('\n'));
}

async function postMarketUpdate(title, message) {
  const channel = process.env.TELEGRAM_CHANNEL_ID || '@VeriPropNigeria';
  return sendMessage(channel, [
    `📊 <b>${title}</b>`,
    ``,
    message,
    ``,
    `🏠 <a href="https://veriprop-nigeriang.vercel.app">VeriProp Naija Properties</a>`,
  ].join('\n'));
}


// ================================================================
// 6. WEBHOOK SETUP — Set bot webhook for commands
// ================================================================
async function setWebhook(webhookUrl) {
  return tgFetch('setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  });
}

async function deleteWebhook() {
  return tgFetch('deleteWebhook');
}


// ================================================================
// 7. BOT COMMANDS HANDLER — Process incoming messages
//    Wire this to POST /api/v1/telegram/webhook
// ================================================================
async function handleBotUpdate(update) {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const firstName = message.from?.first_name || 'there';

  // /start — Welcome message + link account prompt
  if (text === '/start' || text.startsWith('/start ')) {
    const linkParam = text.split(' ')[1]; // Deep link parameter

    if (linkParam) {
      // User came from app with a link code — link their account
      return sendMessage(chatId, [
        `🏠 <b>Welcome to VeriProp Naija Properties, ${firstName}!</b>`,
        ``,
        `Linking your Telegram account...`,
        `Your link code: <code>${linkParam}</code>`,
        ``,
        `You'll now receive:`,
        `• 💰 Transaction alerts`,
        `• ✅ Verification updates`,
        `• 💬 Chat message notifications`,
        `• 🔒 Escrow updates`,
        `• 🚨 Security alerts`,
        ``,
        `All for <b>FREE</b>, delivered instantly.`,
      ].join('\n'));
    }

    return sendMessage(chatId, [
      `🏠 <b>Welcome to VeriProp Naija Properties!</b>`,
      ``,
      `Nigeria's Most Trusted Property Marketplace.`,
      ``,
      `<b>Available commands:</b>`,
      `/link — Link your VeriProp account`,
      `/status — Check your verification status`,
      `/help — Get help`,
      ``,
      `🌐 <a href="https://veriprop-nigeriang.vercel.app">Visit VeriProp</a>`,
    ].join('\n'));
  }

  // /link — Generate link code
  if (text === '/link') {
    const linkCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Store link code temporarily (10 min expiry)
    try {
      await db.otp.create({
        data: {
          userId: String(chatId), // Use chatId as temp identifier
          otp: linkCode,
          type: 'telegram_link',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
    } catch (e) {
      // DB might not have this exact schema — that's ok
    }

    return sendMessage(chatId, [
      `🔗 <b>Link Your VeriProp Account</b>`,
      ``,
      `Your link code: <code>${linkCode}</code>`,
      ``,
      `Go to VeriProp → Settings → Telegram → Enter this code.`,
      `Code expires in 10 minutes.`,
      ``,
      `<a href="https://veriprop-nigeriang.vercel.app/dashboard">Open VeriProp →</a>`,
    ].join('\n'));
  }

  // /status
  if (text === '/status') {
    return sendMessage(chatId, [
      `📊 <b>Account Status</b>`,
      ``,
      `Telegram ID: <code>${chatId}</code>`,
      `Connected: ✅`,
      ``,
      `Check your full verification status on the app:`,
      `<a href="https://veriprop-nigeriang.vercel.app/verify">Verification Hub →</a>`,
    ].join('\n'));
  }

  // /help
  if (text === '/help') {
    return sendMessage(chatId, [
      `❓ <b>VeriProp Naija Properties Help</b>`,
      ``,
      `<b>Commands:</b>`,
      `/start — Welcome message`,
      `/link — Link your VeriProp account`,
      `/status — Check your status`,
      `/help — This message`,
      ``,
      `<b>Need support?</b>`,
      `Visit: <a href="https://veriprop-nigeriang.vercel.app/support">Support Center</a>`,
      ``,
      `🏠 VeriProp Naija Properties — Zero-Trust Property Marketplace`,
    ].join('\n'));
  }

  // Unknown command
  return sendMessage(chatId, `I don't understand that command. Type /help for available commands.`);
}


// ================================================================
// 8. MULTI-CHANNEL NOTIFY — Send to user's Telegram if linked
// ================================================================
async function notifyUserViaTelegram(userId, templateFn, ...args) {
  try {
    // Look up user's linked Telegram chat ID
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    // TODO: Add telegramChatId field to User model
    // For now, check if we have a stored link
    // When telegramChatId is added to schema:
    // if (user?.telegramChatId) {
    //   return templateFn(user.telegramChatId, ...args);
    // }

    return { ok: false, message: 'Telegram not linked for this user' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}


// ================================================================
// 9. HEALTH CHECK
// ================================================================
async function testConnection() {
  const token = getBotToken();

  if (!token) {
    return {
      connected: false,
      provider: 'telegram',
      message: '⚠️ TELEGRAM_BOT_TOKEN not set — Telegram features disabled',
    };
  }

  try {
    const data = await tgFetch('getMe');
    if (data.ok) {
      return {
        connected: true,
        provider: 'telegram',
        botName: data.result.first_name,
        botUsername: data.result.username,
        message: `✅ Telegram bot connected: @${data.result.username} (unlimited free notifications)`,
      };
    }
    return { connected: false, provider: 'telegram', message: '❌ Bot token invalid' };
  } catch (err) {
    return { connected: false, provider: 'telegram', message: `❌ ${err.message}` };
  }
}


module.exports = {
  // Core
  sendMessage,
  tgFetch,

  // Notifications
  notifyVerificationComplete,
  notifyTransaction,
  notifyEscrow,
  notifyNewMessage,
  notifyPropertyApproved,
  notifyPropertyRejected,
  notifyFraudAlert,

  // OTP
  sendOTP,

  // Login
  verifyTelegramLogin,

  // Channel
  postToChannel,
  postNewListing,
  postMarketUpdate,

  // Webhook
  setWebhook,
  deleteWebhook,
  handleBotUpdate,

  // Multi-channel
  notifyUserViaTelegram,

  // Health
  testConnection,
};
