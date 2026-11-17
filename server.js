const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

// Whitelisted MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8',
  '.webmanifest': 'application/manifest+json; charset=UTF-8'
};

// Security: Explicitly forbidden file extensions
const BLOCKED_EXTENSIONS = new Set([
  '.env', '.yml', '.yaml', '.bat', '.cmd', '.sh', '.ps1',
  '.exe', '.dll', '.so', '.md', '.bak', '.config', '.ini',
  '.lock', '.log', '.map'
]);

// Security: Explicitly blocked file names in the root or any folder
const BLOCKED_FILES = new Set([
  'server.js',
  'package.json',
  'package-lock.json',
  'render.yaml',
  'open-site.bat',
  'design.md',
  'readme.md',
  '.gitignore'
]);

// --- In-Memory Rate Limiter (Sliding Window) ---
const ipRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_GLOBAL_PER_MIN = 300; // max 300 requests/min per IP
const MAX_API_PER_15MIN = 15; // max 15 consultation submits per 15 min per IP

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function checkRateLimit(ip, isApi = false) {
  const now = Date.now();
  let client = ipRateLimits.get(ip);
  if (!client) {
    client = { 
      globalCount: 0, 
      globalReset: now + RATE_LIMIT_WINDOW_MS, 
      apiCount: 0, 
      apiReset: now + (15 * 60 * 1000) 
    };
    ipRateLimits.set(ip, client);
  }

  // Global static request rate limit
  if (now > client.globalReset) {
    client.globalCount = 0;
    client.globalReset = now + RATE_LIMIT_WINDOW_MS;
  }
  client.globalCount++;
  if (client.globalCount > MAX_GLOBAL_PER_MIN) {
    return false;
  }

  // API specific rate limit
  if (isApi) {
    if (now > client.apiReset) {
      client.apiCount = 0;
      client.apiReset = now + (15 * 60 * 1000);
    }
    client.apiCount++;
    if (client.apiCount > MAX_API_PER_15MIN) {
      return false;
    }
  }

  return true;
}

// Garbage collect expired rate limiter entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRateLimits.entries()) {
    if (now > data.globalReset && now > data.apiReset) {
      ipRateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// --- Comprehensive OWASP Security Headers ---
function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Server', 'WebCore');

  // Modern Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me mailto:",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
}

// --- Anti-Injection String Sanitizer ---
function sanitizeInputString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  let safe = str.slice(0, maxLen);
  // Strip control characters except newline and tab
  safe = safe.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Disarm HTML/script injection tokens
  return safe.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Clean log string to prevent Log Injection (CWE-117)
function sanitizeForLog(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n\t]/g, ' ').slice(0, 200);
}

const server = http.createServer((req, res) => {
  applySecurityHeaders(res);
  const clientIp = getClientIp(req);

  // Global Rate Limiting Check
  if (!checkRateLimit(clientIp, false)) {
    res.writeHead(429, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('429 Too Many Requests: Rate limit exceeded.');
  }

  // Handle CORS / Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Allow': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // Safe URI parsing with error handling (protects against URIError crash)
  let rawPathname = '';
  let searchParams = '';
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    rawPathname = decodeURI(parsedUrl.pathname);
    searchParams = parsedUrl.search || '';
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('400 Bad Request: Malformed URI');
  }

  // Security: Reject Null bytes, Backslashes, or Traversal tokens
  if (rawPathname.includes('\0') || rawPathname.includes('\\') || rawPathname.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden: Path traversal detected.');
  }

  // Handle Consultation API
  if (req.method === 'POST' && rawPathname === '/api/consultation') {
    if (!checkRateLimit(clientIp, true)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }));
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      res.writeHead(415, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Unsupported Media Type. Expected application/json.' }));
    }

    let body = '';
    let size = 0;
    const MAX_PAYLOAD_BYTES = 50 * 1024; // 50 KB limit
    let exceeded = false;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_PAYLOAD_BYTES && !exceeded) {
        exceeded = true;
        req.destroy(); // Terminate incoming stream to prevent memory exhaustion
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Payload too large. Maximum allowed size is 50KB.' }));
      }
      if (!exceeded) {
        body += chunk;
      }
    });

    req.on('end', () => {
      if (exceeded) return;

      try {
        // Prototype pollution check on raw input
        if (body.includes('__proto__') || body.includes('constructor') || body.includes('prototype')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid input attributes detected.' }));
        }

        const data = JSON.parse(body);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Invalid payload structure.' }));
        }

        // Whitelist, enforce bounds, and sanitize fields
        const sanitized = {
          name: sanitizeInputString(data.name, 100),
          phone: sanitizeInputString(data.phone, 50),
          email: sanitizeInputString(data.email, 120),
          scope: sanitizeInputString(data.scope, 100),
          mode: sanitizeInputString(data.mode, 100),
          location: sanitizeInputString(data.location, 150),
          summary: sanitizeInputString(data.summary, 5000),
          channel: sanitizeInputString(data.channel, 50)
        };

        if (!sanitized.name || !sanitized.summary) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Name and Summary are required fields.' }));
        }

        // Safe console output with log-injection protection (CWE-117)
        console.log('====================================================');
        console.log('📬 NEW CONSULTATION REQUEST RECEIVED (SECURE)');
        console.log('Principal Name  :', sanitizeForLog(sanitized.name));
        console.log('Phone / WhatsApp:', sanitizeForLog(sanitized.phone));
        console.log('Email           :', sanitizeForLog(sanitized.email));
        console.log('Advisory Scope  :', sanitizeForLog(sanitized.scope));
        console.log('Preferred Mode  :', sanitizeForLog(sanitized.mode));
        console.log('Location / Scale:', sanitizeForLog(sanitized.location));
        console.log('Channel         :', sanitizeForLog(sanitized.channel || 'web_direct'));
        console.log('Summary Preview :', sanitizeForLog(sanitized.summary));
        console.log('====================================================');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Consultation request received successfully.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload.' }));
      }
    });

    return;
  }

  // Method Check: Only GET and HEAD for static assets
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8', 'Allow': 'GET, HEAD, POST, OPTIONS' });
    return res.end('405 Method Not Allowed');
  }

  // Normalize path using POSIX rules
  let reqPath = path.posix.normalize(rawPathname);

  // Security: Block any dotfile or hidden directory (e.g. /.git, /.env, /.vscode)
  const segments = reqPath.split('/').filter(Boolean);
  if (segments.some(seg => seg.startsWith('.'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden');
  }

  // 1. Canonical Redirects: prevent ".html" in URLs, redirect to clean routes
  if (reqPath.endsWith('.html') && !reqPath.startsWith('/google')) {
    let clean = reqPath.slice(0, -5);
    if (clean === '/index') clean = '/';
    const target = clean + searchParams;
    res.writeHead(301, {
      'Location': target,
      'Cache-Control': 'public, max-age=3600'
    });
    return res.end();
  }

  // 2. Resolve Root and Clean URLs
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (!path.posix.extname(reqPath)) {
    if (reqPath === '/projects' && fs.existsSync(path.join(PUBLIC_DIR, 'projects-showcase.html'))) {
      reqPath = '/projects-showcase.html';
    } else if ((reqPath === '/privacy' || reqPath === '/privacy-policy') && fs.existsSync(path.join(PUBLIC_DIR, 'privacy-policy.html'))) {
      reqPath = '/privacy-policy.html';
    } else if (fs.existsSync(path.join(PUBLIC_DIR, reqPath + '.html'))) {
      reqPath = reqPath + '.html';
    }
  }

  const requestedBaseName = path.basename(reqPath).toLowerCase();
  const ext = path.extname(reqPath).toLowerCase();

  // Security: Block access to sensitive system/root files
  if (BLOCKED_FILES.has(requestedBaseName)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden: Restricted system file.');
  }

  // Security: Block dangerous file extensions
  if (BLOCKED_EXTENSIONS.has(ext)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden');
  }

  // Security: Restrict .js execution/serving exclusively to /assets/js/
  if (ext === '.js' && !reqPath.startsWith('/assets/js/')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden: Scripts outside /assets/js/ are restricted.');
  }

  // Security: Whitelist allowed MIME extensions
  if (ext && !MIME_TYPES[ext]) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden: Unsupported media type.');
  }

  const filePath = path.resolve(PUBLIC_DIR, '.' + reqPath);

  // Security: Final Directory Traversal Boundary Verification
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('404 Not Found');
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Caching Strategy
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    if (req.method === 'HEAD') {
      return res.end();
    }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/ with full security hardening active.`);
});
