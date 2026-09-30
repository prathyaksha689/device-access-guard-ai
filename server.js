const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const otpStore = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(JSON.stringify(payload));
}

function validatePhone(phone) {
  const normalized = String(phone || '').replace(/[\s()-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

function getBrowserInfo(ua) {
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Edg|Edge/i.test(ua)) return 'Edge';
  return 'Other';
}

function getOSInfo(ua) {
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  return 'Unknown';
}

function getDeviceChecks(req) {
  const ua = req.headers['user-agent'] || '';
  const scheme = req.headers['x-forwarded-proto'] || 'http';
  const checks = [
    { name: 'Browser Type', value: getBrowserInfo(ua), severity: 'info' },
    { name: 'OS Platform', value: getOSInfo(ua), severity: 'info' },
    { name: 'HTTPS', value: scheme === 'https' ? '✓ Encrypted' : '⚠ Not encrypted', severity: scheme === 'https' ? 'good' : 'warning' },
    { name: 'JavaScript', value: 'Enabled', severity: 'good' },
    { name: 'Cookies', value: 'Enabled', severity: 'good' },
    { name: 'Network', value: req.headers['x-forwarded-for'] || 'Local', severity: 'info' },
    { name: 'Browser Security', value: /Chrome|Firefox|Edge/.test(ua) ? 'Good' : 'Review', severity: 'info' }
  ];
  return checks;
}

function handleApi(req, res, url) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (url.pathname === '/api/send-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const phone = String(payload.phoneNumber || '').trim();

        if (!validatePhone(phone)) {
          return sendJson(res, 400, { success: false, error: 'Use a valid international number such as +15551234567.' });
        }

        const otp = generateOTP();
        otpStore.set(phone, {
          code: otp,
          createdAt: Date.now(),
          attempts: 0,
          maxAttempts: MAX_ATTEMPTS
        });

        console.log(`[OTP DEMO] Sent OTP to ${phone}: ${otp}`);
        return sendJson(res, 200, {
          success: true,
          message: 'Verification code sent successfully.',
          demoCode: otp,
          maskedPhone: phone.slice(0, -4) + '****'
        });
      } catch (error) {
        return sendJson(res, 400, { success: false, error: 'Invalid request body.' });
      }
    });
    return;
  }

  if (url.pathname === '/api/verify-otp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const phone = String(payload.phoneNumber || '').trim();
        const otp = String(payload.otp || '').trim();

        const record = otpStore.get(phone);
        if (!record) {
          return sendJson(res, 400, { success: false, error: 'No active OTP for this phone number.' });
        }

        if (Date.now() - record.createdAt > OTP_TTL_MS) {
          otpStore.delete(phone);
          return sendJson(res, 400, { success: false, error: 'Verification code expired. Please request a new one.' });
        }

        if (record.attempts >= record.maxAttempts) {
          otpStore.delete(phone);
          return sendJson(res, 429, { success: false, error: 'Too many failed attempts. Please request a new code.' });
        }

        if (otp !== record.code) {
          record.attempts += 1;
          otpStore.set(phone, record);
          const attemptsLeft = Math.max(0, record.maxAttempts - record.attempts);
          return sendJson(res, 401, { success: false, error: `Incorrect code. ${attemptsLeft} attempt(s) left.` });
        }

        otpStore.delete(phone);
        return sendJson(res, 200, { success: true, message: 'Verification successful.' });
      } catch (error) {
        return sendJson(res, 400, { success: false, error: 'Invalid request body.' });
      }
    });
    return;
  }

  if (url.pathname === '/api/device-checks' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, checks: getDeviceChecks(req) });
  }

  sendJson(res, 404, { success: false, error: 'Not found.' });
}

function serveStaticFile(res, filePath) {
  const safePath = path.normalize(filePath).replace(/^(\.+[\\/])+/, '');
  const fullPath = path.join(__dirname, safePath);

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      sendJson(res, 404, { success: false, error: 'File not found.' });
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'text/plain; charset=utf-8';
    res.writeHead(200, { 'Content-Type': mimeType, 'Access-Control-Allow-Origin': '*' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url);
    return;
  }

  let requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  if (requestedPath.startsWith('/')) requestedPath = requestedPath.slice(1);
  serveStaticFile(res, requestedPath);
});

server.listen(PORT, () => {
  console.log(`Device Access Guard backend running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});
