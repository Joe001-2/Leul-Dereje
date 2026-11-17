const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

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
  '.txt': 'text/plain; charset=UTF-8'
};

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

const server = http.createServer((req, res) => {
  applySecurityHeaders(res);

  // Handle Consultation API
  if (req.method === 'POST' && req.url === '/api/consultation') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('====================================================');
        console.log('📬 NEW CONSULTATION REQUEST RECEIVED');
        console.log('Principal Name :', data.name);
        console.log('Phone / WhatsApp:', data.phone);
        console.log('Email           :', data.email);
        console.log('Advisory Scope  :', data.scope);
        console.log('Consultation Summary:');
        console.log(data.summary);
        console.log('====================================================');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Consultation request received successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON format' }));
      }
    });
    return;
  }

  // Parse request path
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = decodeURI(parsedUrl.pathname);

  // 1. Canonical Redirects: prevent ".html" in URLs, redirect to clean routes
  if (reqPath.endsWith('.html') && !reqPath.startsWith('/google')) {
    let clean = reqPath.slice(0, -5);
    if (clean === '/index') clean = '/';
    const target = clean + (parsedUrl.search || '');
    res.writeHead(301, {
      'Location': target,
      'Cache-Control': 'public, max-age=3600'
    });
    return res.end();
  }

  // 2. Resolve Root and Clean URLs
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (!path.extname(reqPath)) {
    if (reqPath === '/projects' && fs.existsSync(path.join(PUBLIC_DIR, 'projects-showcase.html'))) {
      reqPath = '/projects-showcase.html';
    } else if (fs.existsSync(path.join(PUBLIC_DIR, reqPath + '.html'))) {
      reqPath = reqPath + '.html';
    }
  }

  const filePath = path.resolve(PUBLIC_DIR, '.' + reqPath);

  // 3. Security check: prevent directory traversal attacks
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Caching Strategy
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
