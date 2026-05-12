const { spawn } = require('child_process');
const fs = require('fs');

const STANDALONE_DIR = '/home/z/authoring-tool-v4-ssr/.next/standalone';
const LOG_FILE = '/tmp/mpi-server.log';
const PID_FILE = '/tmp/mpi-server.pid';

function startServer() {
    const child = spawn('node', ['server.js'], {
        cwd: STANDALONE_DIR,
        env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0', NODE_ENV: 'production' },
        detached: true,
        stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')]
    });
    child.unref();
    fs.writeFileSync(PID_FILE, String(child.pid));
    console.log(`Server started with PID ${child.pid}`);
}

startServer();
