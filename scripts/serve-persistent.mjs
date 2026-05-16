import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const PORT = parseInt(process.env.PORT || '8080', 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(PORT, () => {
    console.log(`✅ SILSE server running on http://localhost:${PORT}`);
  });

  // Keep process alive
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err.message);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
});
