'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — FILE STORAGE SERVICE (Telegram Cloud)
 * ================================================================
 * Uses Telegram Bot API as FREE UNLIMITED cloud storage.
 * 
 * How it works:
 *   1. Image uploaded to backend (base64 or buffer)
 *   2. Backend sends image to a private Telegram chat/channel
 *   3. Telegram stores it permanently, returns file_id
 *   4. We generate a public proxy URL for the image
 *   5. URL stored in PropertyImage.url — works everywhere
 *
 * Limits:
 *   - Max 20MB per file (photos compressed to 10MB by Telegram)
 *   - Max 10 uploads per second
 *   - Unlimited total storage
 *   - Files never expire
 *
 * Fallback: If Telegram not configured, stores as base64 data URI
 * 
 * Required env: TELEGRAM_BOT_TOKEN (already set)
 * Optional env: TELEGRAM_STORAGE_CHAT_ID (private channel for storage)
 * ================================================================
 */

const config = require('../config');
const crypto = require('crypto');

const TG_API = 'https://api.telegram.org/bot';
const TG_FILE_API = 'https://api.telegram.org/file/bot';

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

// Storage chat — use a private channel/group dedicated to file storage
// This keeps property images separate from the public announcement channel
function getStorageChatId() {
  return process.env.TELEGRAM_STORAGE_CHAT_ID || process.env.TELEGRAM_CHANNEL_ID || null;
}


// ================================================================
// 1. UPLOAD IMAGE — Send to Telegram, get permanent file_id
// ================================================================
async function uploadImage(imageData, filename = 'property.jpg', caption = '') {
  const token = getBotToken();
  const chatId = getStorageChatId();

  if (!token || !chatId) {
    console.warn('[Storage] Telegram not configured — returning data URI');
    // Fallback: return the image as-is (data URI or URL)
    if (imageData.startsWith('data:') || imageData.startsWith('http')) {
      return { success: true, url: imageData, provider: 'passthrough' };
    }
    return { success: true, url: `data:image/jpeg;base64,${imageData}`, provider: 'base64' };
  }

  try {
    // Convert base64 to buffer if needed
    let imageBuffer;
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageData.startsWith('http')) {
      // Download from URL first
      const res = await fetch(imageData);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Assume raw base64
      imageBuffer = Buffer.from(imageData, 'base64');
    }

    // Build multipart form data manually
    const boundary = `----TGUpload${Date.now()}`;
    const ext = filename.split('.').pop() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const parts = [];

    // chat_id field
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
      `${chatId}\r\n`
    );

    // caption field
    if (caption) {
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="caption"\r\n\r\n` +
        `${caption}\r\n`
      );
    }

    // photo field (binary)
    const fileHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="photo"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const fileFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const textParts = Buffer.from(parts.join(''));

    const body = Buffer.concat([textParts, fileHeader, imageBuffer, fileFooter]);

    const res = await fetch(`${TG_API}${token}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body,
    });

    const data = await res.json();

    if (!data.ok) {
      console.error('[Storage] Telegram upload failed:', data.description);
      // Fallback to base64
      return { success: true, url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`, provider: 'base64_fallback' };
    }

    // Get the largest photo size (Telegram creates multiple sizes)
    const photos = data.result.photo || [];
    const largest = photos[photos.length - 1]; // Last one is largest

    if (!largest) {
      return { success: false, message: 'No photo returned from Telegram' };
    }

    // Get the file URL
    const fileInfo = await fetch(`${TG_API}${token}/getFile?file_id=${largest.file_id}`);
    const fileData = await fileInfo.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      // Store file_id — we can resolve the URL later
      const proxyUrl = `/api/v1/media/${largest.file_id}`;
      return {
        success: true,
        url: proxyUrl,
        fileId: largest.file_id,
        width: largest.width,
        height: largest.height,
        provider: 'telegram',
      };
    }

    // Direct Telegram CDN URL
    const directUrl = `${TG_FILE_API}${token}/${fileData.result.file_path}`;

    // We'll use a proxy URL instead (hides bot token)
    const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'https://veriprop-nigeria-production.up.railway.app';

    const proxyUrl = `${backendUrl}/api/v1/media/${largest.file_id}`;

    console.log(`[Storage] ✅ Image uploaded to Telegram (${(imageBuffer.length / 1024).toFixed(0)}KB) → ${largest.file_id}`);

    return {
      success: true,
      url: proxyUrl,
      fileId: largest.file_id,
      directUrl, // Internal use only — contains bot token
      width: largest.width,
      height: largest.height,
      fileSize: largest.file_size,
      provider: 'telegram',
    };
  } catch (err) {
    console.error('[Storage] Upload error:', err.message);
    return { success: false, message: err.message, provider: 'telegram' };
  }
}


// ================================================================
// 2. UPLOAD DOCUMENT — For PDFs, contracts, etc (up to 50MB)
// ================================================================
async function uploadDocument(fileBuffer, filename, caption = '') {
  const token = getBotToken();
  const chatId = getStorageChatId();

  if (!token || !chatId) {
    return { success: false, message: 'Telegram not configured for document storage' };
  }

  try {
    const boundary = `----TGDoc${Date.now()}`;

    const parts = [];
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`);
    if (caption) {
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`);
    }

    const fileHeader = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    );
    const fileFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
    const textParts = Buffer.from(parts.join(''));

    const buf = typeof fileBuffer === 'string' ? Buffer.from(fileBuffer, 'base64') : fileBuffer;
    const body = Buffer.concat([textParts, fileHeader, buf, fileFooter]);

    const res = await fetch(`${TG_API}${token}/sendDocument`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body,
    });

    const data = await res.json();

    if (!data.ok) {
      return { success: false, message: data.description };
    }

    const doc = data.result.document;
    const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'https://veriprop-nigeria-production.up.railway.app';

    return {
      success: true,
      url: `${backendUrl}/api/v1/media/${doc.file_id}`,
      fileId: doc.file_id,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      provider: 'telegram',
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}


// ================================================================
// 3. GET FILE — Proxy endpoint to serve Telegram files
//    This hides the bot token from public URLs
// ================================================================
async function getFileUrl(fileId) {
  const token = getBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${TG_API}${token}/getFile?file_id=${fileId}`);
    const data = await res.json();

    if (!data.ok || !data.result?.file_path) return null;

    return `${TG_FILE_API}${token}/${data.result.file_path}`;
  } catch {
    return null;
  }
}

async function proxyFile(fileId) {
  const url = await getFileUrl(fileId);
  if (!url) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get('content-type') || 'image/jpeg',
    };
  } catch {
    return null;
  }
}


// ================================================================
// 4. UPLOAD MULTIPLE IMAGES — For property listings
// ================================================================
async function uploadPropertyImages(images, propertyTitle = '') {
  const results = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const caption = i === 0 ? `📸 ${propertyTitle} (Primary)` : `📸 ${propertyTitle} (${i + 1}/${images.length})`;

    const result = await uploadImage(img, `property_${i + 1}.jpg`, caption);
    results.push(result);

    // Respect Telegram rate limits (max 30 msgs/second to same chat)
    if (i < images.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return results;
}


// ================================================================
// 5. HEALTH CHECK
// ================================================================
async function testConnection() {
  const token = getBotToken();
  const chatId = getStorageChatId();

  if (!token) {
    return { connected: false, message: '⚠️ TELEGRAM_BOT_TOKEN not set — using fallback storage' };
  }

  if (!chatId) {
    return {
      connected: false,
      message: '⚠️ TELEGRAM_STORAGE_CHAT_ID not set — set to a private channel ID for image storage',
    };
  }

  return {
    connected: true,
    provider: 'telegram_cloud',
    storageChatId: chatId,
    message: '✅ Telegram Cloud Storage ready (FREE unlimited)',
  };
}


module.exports = {
  uploadImage,
  uploadDocument,
  uploadPropertyImages,
  getFileUrl,
  proxyFile,
  testConnection,
};
