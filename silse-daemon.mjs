import { spawn } from 'child_process';
import { writeFileSync, existsSync, readFileSync, unlinkSync } from 'fs';

const PID_FILE = '/tmp/silse-serve.pid';

// Kill old server
if (existsSync(PID_FILE)) {
  try {
    const oldPid = parseInt(readFileSync(PID_FILE, 'utf-8'));
    process.kill(oldPid, 9);
  } catch {}
  unlinkSync(PID_FILE);
}

const child = spawn('node', ['silse-serve.mjs'], {
  cwd: '/home/z/my-project',
  detached: true,
  stdio: 'ignore',
  env: { ...process.env, PORT: '3000' },
});

child.unref();

writeFileSync(PID_FILE, String(child.pid));
console.log(`SILSE server started with PID ${child.pid}`);
