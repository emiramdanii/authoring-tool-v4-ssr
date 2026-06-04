// ── SILSE Lightweight Sandbox Server ────────────────────────────
// Serves pre-built Next.js static assets without running full Next.js server.
// This reduces memory from ~1.3GB (dev) to ~60MB.
//
// Usage: node sandbox-server.mjs
// Listens on port 3000 (direct) and 8080 (Caddy gateway proxy)

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const CADDY_PORT = 8080;

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.map':  'application/json',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.webmanifest': 'application/manifest+json',
};

function serve(res, filePath, fallbackMime = 'application/octet-stream') {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || fallbackMime;
  
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

function handler(req, res) {
  let urlPath = req.url.split('?')[0];
  
  // API routes → 503 sandbox response
  if (urlPath.startsWith('/api')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'API tidak tersedia dalam mode sandbox', sandbox: true }));
    return;
  }
  
  // Static assets from .next/static/
  if (urlPath.startsWith('/_next/static/')) {
    const filePath = path.join(__dirname, '.next', 'static', urlPath.replace('/_next/static/', ''));
    serve(res, filePath);
    return;
  }
  
  // Other .next/ resources
  if (urlPath.startsWith('/_next/') && urlPath.includes('.')) {
    const filePath = path.join(__dirname, '.next', urlPath.replace('/_next/', ''));
    serve(res, filePath);
    return;
  }
  
  // Public assets
  if (!urlPath.startsWith('/_next')) {
    const publicPath = path.join(__dirname, 'public', urlPath);
    try {
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        serve(res, publicPath);
        return;
      }
    } catch {}
  }
  
  // All other routes → serve index.html (SPA fallback)
  const indexHtml = path.join(__dirname, '.next', 'server', 'app', 'index.html');
  serve(res, indexHtml, 'text/html; charset=utf-8');
}

// Start on port 3000
const server = http.createServer(handler);
server.listen(PORT, '0.0.0.0', () => {
  const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`🚀 SILSE Sandbox Server running at http://0.0.0.0:${PORT} (${mem}MB)`);
});

// Also listen on port 8080 for Caddy gateway proxy
if (CADDY_PORT !== PORT) {
  const caddyServer = http.createServer(handler);
  caddyServer.listen(CADDY_PORT, '0.0.0.0', () => {
    console.log(`   Caddy gateway: http://0.0.0.0:${CADDY_PORT}`);
  });
}

// Periodic GC
setInterval(() => {
  const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
  if (mem > 200) {
    global.gc?.();
  }
}, 30000);
