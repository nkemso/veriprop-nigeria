'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — EMAIL SERVICE (Resend)
 * ================================================================
 * Provider: Resend (resend.com)
 * Free tier: 3,000 emails/month, 100/day
 * Paid: $20/month for 50K emails
 * 
 * Sign up: resend.com (no credit card for free tier)
 * Required env: RESEND_API_KEY
 * ================================================================
 */

const config = require('../config');

const RESEND_BASE = 'https://api.resend.com';
const FROM_EMAIL = config.email?.from || 'VeriProp Nigeria <noreply@veripropnigeria.com>';

// ================================================================
// CORE — Send email via Resend API
// ================================================================
async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — email not sent:', subject, '→', to);
    return { success: false, message: 'Email service not configured', provider: 'resend' };
  }

  try {
    const res = await fetch(`${RESEND_BASE}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || undefined,
        text: text || undefined,
        reply_to: replyTo || undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Email] Resend error:', res.status, err);
      return { success: false, message: `Email failed: ${res.status}`, provider: 'resend' };
    }

    const data = await res.json();
    console.log(`[Email] ✅ Sent "${subject}" → ${to} (id: ${data.id})`);
    return { success: true, messageId: data.id, provider: 'resend' };
  } catch (err) {
    console.error('[Email] Send error:', err.message);
    return { success: false, message: err.message, provider: 'resend' };
  }
}


// ================================================================
// TEMPLATES — Pre-built email templates
// ================================================================

function baseTemplate(title, content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f8fafc;font-family:Inter,-apple-system,sans-serif;color:#1e293b}
  .container{max-width:560px;margin:0 auto;padding:20px}
  .card{background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
  .header{text-align:center;padding-bottom:24px;border-bottom:1px solid #e2e8f0}
  .logo{font-size:1.5rem;font-weight:800;color:#1e3a5f}
  .logo span{color:#f59e0b}
  .body{padding:24px 0}
  .btn{display:inline-block;background:#1d4ed8;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem}
  .footer{text-align:center;padding-top:24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:0.75rem}
  .otp-code{font-size:2rem;font-weight:900;letter-spacing:0.3em;color:#1d4ed8;text-align:center;padding:20px;background:#eff6ff;border-radius:12px;margin:16px 0}
</style></head><body>
<div class="container"><div class="card">
  <div class="header"><div class="logo">🏠 VeriProp <span>Nigeria</span></div><p style="margin:4px 0 0;color:#64748b;font-size:0.85rem">${title}</p></div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>VeriProp Nigeria — Nigeria's Most Trusted Property Marketplace</p>
    <p>This is a transactional email. You received it because you have a VeriProp account.</p>
  </div>
</div></div></body></html>`;
}

// ── Welcome Email ──
async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: '🏠 Welcome to VeriProp Nigeria!',
    html: baseTemplate('Welcome to VeriProp', `
      <h2 style="margin:0 0 8px;color:#1e3a5f">Welcome, ${user.firstName}! 🎉</h2>
      <p style="color:#475569;line-height:1.7">Your VeriProp Nigeria account has been created. You're one step closer to Nigeria's most trusted property marketplace.</p>
      <p style="color:#475569;line-height:1.7"><strong>Next steps:</strong></p>
      <ol style="color:#475569;line-height:2">
        <li>Complete your identity verification (BVN + NIN + Document Scan)</li>
        <li>Browse verified property listings</li>
        <li>Start making secure transactions</li>
      </ol>
      <div style="text-align:center;margin:24px 0">
        <a href="https://veriprop-nigeriang.vercel.app/verify" class="btn">🛡️ Start Verification →</a>
      </div>
      <p style="color:#94a3b8;font-size:0.85rem">If you didn't create this account, please ignore this email.</p>
    `),
  });
}

// ── OTP Email ──
async function sendOTPEmail(email, otp, purpose = 'verification') {
  return sendEmail({
    to: email,
    subject: `🔐 Your VeriProp OTP: ${otp}`,
    html: baseTemplate('One-Time Password', `
      <h2 style="margin:0 0 8px;color:#1e3a5f">Your Verification Code</h2>
      <p style="color:#475569">Use this code to complete your ${purpose}:</p>
      <div class="otp-code">${otp}</div>
      <p style="color:#475569">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#ef4444;font-size:0.85rem">⚠️ VeriProp will never ask for this code via phone or chat. If someone asks, it's a scam.</p>
    `),
  });
}

// ── Verification Complete ──
async function sendVerificationCompleteEmail(user) {
  return sendEmail({
    to: user.email,
    subject: '✅ Identity Verified — You are now Tier 3!',
    html: baseTemplate('Verification Complete', `
      <h2 style="margin:0 0 8px;color:#10b981">🎉 Fully Verified!</h2>
      <p style="color:#475569;line-height:1.7">Congratulations, ${user.firstName}! Your identity has been verified through Didit AI. You are now <strong style="color:#10b981">Tier 3 Verified</strong>.</p>
      <p style="color:#475569"><strong>You can now:</strong></p>
      <ul style="color:#475569;line-height:2">
        <li>✅ List properties on the marketplace</li>
        <li>✅ Initiate negotiations and secure chats</li>
        <li>✅ Use escrow and multi-sig transactions</li>
        <li>✅ Access priority listing visibility</li>
      </ul>
      <div style="text-align:center;margin:24px 0">
        <a href="https://veriprop-nigeriang.vercel.app/dashboard" class="btn">🏠 Go to Dashboard →</a>
      </div>
    `),
  });
}

// ── Transaction Alert ──
async function sendTransactionEmail(user, transaction) {
  return sendEmail({
    to: user.email,
    subject: `💰 Transaction Update — ${transaction.status}`,
    html: baseTemplate('Transaction Update', `
      <h2 style="margin:0 0 8px;color:#1e3a5f">Transaction ${transaction.status}</h2>
      <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#475569"><strong>Property:</strong> ${transaction.propertyTitle || 'N/A'}</p>
        <p style="margin:4px 0;color:#475569"><strong>Amount:</strong> ₦${(transaction.amount || 0).toLocaleString()}</p>
        <p style="margin:4px 0;color:#475569"><strong>Status:</strong> <span style="color:#1d4ed8;font-weight:700">${transaction.status}</span></p>
        <p style="margin:4px 0;color:#475569"><strong>Date:</strong> ${new Date().toLocaleString('en-NG')}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="https://veriprop-nigeriang.vercel.app/dashboard" class="btn">View Details →</a>
      </div>
    `),
  });
}

// ── Password Reset ──
async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `https://veriprop-nigeriang.vercel.app/reset-password?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: '🔑 Reset Your VeriProp Password',
    html: baseTemplate('Password Reset', `
      <h2 style="margin:0 0 8px;color:#1e3a5f">Reset Your Password</h2>
      <p style="color:#475569;line-height:1.7">We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetUrl}" class="btn">🔑 Reset Password →</a>
      </div>
      <p style="color:#94a3b8;font-size:0.85rem">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `),
  });
}

// ── Escrow Alert ──
async function sendEscrowEmail(user, escrow, action) {
  return sendEmail({
    to: user.email,
    subject: `🔒 Escrow ${action} — ₦${(escrow.amount || 0).toLocaleString()}`,
    html: baseTemplate('Escrow Update', `
      <h2 style="margin:0 0 8px;color:#1e3a5f">Escrow ${action}</h2>
      <p style="color:#475569">Your escrow transaction has been updated:</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:4px 0;color:#166534"><strong>Amount:</strong> ₦${(escrow.amount || 0).toLocaleString()}</p>
        <p style="margin:4px 0;color:#166534"><strong>Action:</strong> ${action}</p>
        <p style="margin:4px 0;color:#166534"><strong>Date:</strong> ${new Date().toLocaleString('en-NG')}</p>
      </div>
    `),
  });
}


// ================================================================
// HEALTH CHECK
// ================================================================
async function testConnection() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { connected: false, provider: 'resend', message: '⛔ RESEND_API_KEY not set. Get free key at resend.com' };
  }
  try {
    const res = await fetch(`${RESEND_BASE}/api-keys`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return {
      connected: res.ok,
      provider: 'resend',
      message: res.ok ? '✅ Resend connected (3,000 free/month)' : `❌ Resend error: ${res.status}`,
    };
  } catch (err) {
    return { connected: false, provider: 'resend', message: `❌ ${err.message}` };
  }
}


module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendVerificationCompleteEmail,
  sendTransactionEmail,
  sendPasswordResetEmail,
  sendEscrowEmail,
  testConnection,
};
