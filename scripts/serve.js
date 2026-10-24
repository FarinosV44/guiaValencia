// Servidor local para revisar dist/ (no publica nada). Uso: npm run serve [-- puerto]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain' };
const port = Number(process.argv[2] || process.env.PORT || 4173);

export function startServer(p = port) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let file = join(DIST, path);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      const nf = path.startsWith('/en/') ? 'en/404.html' : '404.html';
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      res.end(await readFile(join(DIST, nf)).catch(() => 'Not found'));
    }
  });
  return new Promise((r) => server.listen(p, '127.0.0.1', () => r(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().then(() => console.log(`http://127.0.0.1:${port}/`));
}
