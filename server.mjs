import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';

const app = next({ dev: false });

app.prepare().then(() => {
  const handle = app.getRequestHandler();
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(3000, () => {
    console.log('LISTENING on 3000');
  });
});
