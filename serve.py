import http.server
import socketserver
import os
import json

ROOT = '/home/z/my-project'

MIME_TYPES = {
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
}

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

# Preload HTML files into memory
CACHE = {}

def preload():
    """Preload all common files into memory"""
    # Main HTML page
    index_path = os.path.join(ROOT, '.next/server/app/index.html')
    if os.path.isfile(index_path):
        with open(index_path, 'rb') as f:
            CACHE['/'] = f.read()
        print(f'Preloaded index.html ({len(CACHE["/"])} bytes)', flush=True)
    
    mockup_path = os.path.join(ROOT, '.next/server/app/mockup.html')
    if os.path.isfile(mockup_path):
        with open(mockup_path, 'rb') as f:
            CACHE['/mockup'] = f.read()
    
    # Static assets
    static_dir = os.path.join(ROOT, '.next/static')
    for dirpath, dirnames, filenames in os.walk(static_dir):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            # Map to URL: /_next/static/...
            url_path = '/_next/' + os.path.relpath(filepath, os.path.join(ROOT, '.next'))
            try:
                with open(filepath, 'rb') as f:
                    CACHE[url_path] = f.read()
            except:
                pass
    
    # Public folder
    public_dir = os.path.join(ROOT, 'public')
    if os.path.isdir(public_dir):
        for dirpath, dirnames, filenames in os.walk(public_dir):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                url_path = '/' + os.path.relpath(filepath, public_dir)
                try:
                    with open(filepath, 'rb') as f:
                        CACHE[url_path] = f.read()
                except:
                    pass
    
    print(f'Preloaded {len(CACHE)} files into cache', flush=True)

class SILSEHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        
        if path.startswith('/api/'):
            self.send_response(501)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error":"SANDBOX_MODE"}')
            return
        
        # Check cache first
        if path in CACHE:
            data = CACHE[path]
            ext = os.path.splitext(path)[1]
            mime = MIME_TYPES.get(ext, 'application/octet-stream')
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'public, max-age=31536000' if ext != '.html' else 'no-cache')
            self.end_headers()
            self.wfile.write(data)
            return
        
        # Fallback to index.html for SPA routing
        if '/' in CACHE:
            data = CACHE['/']
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(data)
            return
        
        self.send_response(404)
        self.end_headers()
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    preload()
    server = ThreadedHTTPServer(('0.0.0.0', 3000), SILSEHandler)
    print('SILSE cached server on :3000', flush=True)
    server.serve_forever()
