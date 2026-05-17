import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, createWriteStream, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = resolve(__dirname, '.server.pid');
const LOG_FILE = resolve(__dirname, 'dev.log');

// Kill previous server if running
if (existsSync(PID_FILE)) {
  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10);
    if (pid && !isNaN(pid)) {
      try { process.kill(pid, 'SIGKILL'); } catch {}
      // Also kill any children
      try { process.kill(pid + 1, 'SIGKILL'); } catch {}
      try { process.kill(pid + 2, 'SIGKILL'); } catch {}
    }
  } catch {}
  try { unlinkSync(PID_FILE); } catch {}
}

// Wait a moment for port to free
import { execSync } from 'child_process';
try { execSync('sleep 2'); } catch {}

const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
  cwd: __dirname,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
});

// Write PID file
writeFileSync(PID_FILE, String(child.pid));

// Pipe output to log file
const logStream = createWriteStream(LOG_FILE, { flags: 'w' });
child.stdout.pipe(logStream);
child.stderr.pipe(logStream);

// Unref so this script can exit while server keeps running
child.unref();

console.log(`Server started with PID ${child.pid}`);

// Wait for server to be ready
let attempts = 0;
const check = setInterval(() => {
  attempts++;
  try {
    const result = execSync('curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000/', { encoding: 'utf8' }).trim();
    if (result === '200') {
      console.log('Server is ready!');
      clearInterval(check);
      process.exit(0);
    }
  } catch {}
  if (attempts > 30) {
    console.log('Timeout waiting for server');
    clearInterval(check);
    process.exit(1);
  }
}, 2000);
