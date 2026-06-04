import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const GATEWAY_PORT = 8080;

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

function serve(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  } catch(e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

function handler(req, res) {
  let urlPath = req.url.split('?')[0];

  if (urlPath.startsWith('/api')) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'API tidak tersedia dalam mode sandbox', sandbox: true }));
    return;
  }

  if (urlPath.startsWith('/_next/static/')) {
    const filePath = path.join(__dirname, '.next', 'static', urlPath.replace('/_next/static/', ''));
    serve(res, filePath);
    return;
  }

  if (urlPath.startsWith('/_next/') && urlPath.includes('.')) {
    const filePath = path.join(__dirname, '.next', urlPath.replace('/_next/', ''));
    serve(res, filePath);
    return;
  }

  if (!urlPath.startsWith('/_next')) {
    const publicPath = path.join(__dirname, 'public', urlPath);
    try {
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        serve(res, publicPath);
        return;
      }
    } catch {}
  }

  const indexHtml = path.join(__dirname, '.next', 'server', 'app', 'index.html');
  serve(res, indexHtml);
}

process.on('uncaughtException', (e) => console.error('Uncaught:', e.message));
process.on('unhandledRejection', (e) => console.error('Unhandled:', e));

// Port 3000 (direct access)
const server3000 = http.createServer(handler);
server3000.listen(PORT, '0.0.0.0', () => {
  const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
  console.log(`SILSE Server on :${PORT} (${mem}MB)`);
});

// Port 8080 (gateway proxy target)
const server8080 = http.createServer(handler);
server8080.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`Gateway proxy on :${GATEWAY_PORT}`);
});

// Periodic GC
setInterval(() => {
  if (global.gc) global.gc();
}, 60000);
