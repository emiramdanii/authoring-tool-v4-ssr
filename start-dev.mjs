import { spawn } from 'child_process';
import { unlinkSync, existsSync } from 'fs';

const PID_FILE = '/tmp/next-dev.pid';

// Kill old server if PID file exists
if (existsSync(PID_FILE)) {
  try {
    const oldPid = parseInt(await import('fs').then(f => f.readFileSync(PID_FILE, 'utf-8')));
    process.kill(oldPid, 9);
  } catch {}
  unlinkSync(PID_FILE);
}

const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  detached: true,
  stdio: 'ignore',
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
});

child.unref();

import { writeFileSync } from 'fs';
writeFileSync(PID_FILE, String(child.pid));
console.log(`Dev server started with PID ${child.pid}`);
