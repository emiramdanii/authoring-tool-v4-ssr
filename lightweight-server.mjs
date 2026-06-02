import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = '/home/z/my-project';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function serve(req, res) {
  let url = req.url.split('?')[0];
  
  // Route mapping
  let filePath;
  if (url === '/' || url === '/index.html') {
    filePath = join(ROOT, '.next/server/app/index.html');
  } else if (url === '/mockup') {
    filePath = join(ROOT, '.next/server/app/mockup.html');
  } else if (url.startsWith('/_next/static/')) {
    filePath = join(ROOT, url.slice(1));  // Remove leading /
  } else if (url.startsWith('/_next/image')) {
    // Image optimization - redirect to original
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  } else if (url.startsWith('/api/')) {
    // API routes - return 501
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'SANDBOX_MODE' }));
    return;
  } else {
    // Try public folder
    filePath = join(ROOT, 'public', url);
    if (!existsSync(filePath)) {
      // Fallback to index.html for SPA
      filePath = join(ROOT, '.next/server/app/index.html');
    }
  }

  try {
    const data = readFileSync(filePath);
    const ext = extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
  }
}

createServer(serve).listen(3000, () => {
  console.log('Lightweight server on :3000');
});
