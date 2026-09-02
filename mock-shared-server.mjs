import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.env.MOCK_SHARED_PORT || 3001);
const STORE_PATH = path.join(process.cwd(), '.mock-shared-store.json');
const ALLOWED_ORIGINS = new Set([
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:19000',
  'http://127.0.0.1:19000',
]);

function getCorsHeaders(origin) {
  const requestOrigin = typeof origin === 'string' ? origin : '';
  const allowedOrigin = ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : 'http://localhost:19006';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(data) {
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const corsHeaders = getCorsHeaders(req.headers.origin || '');

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...corsHeaders,
        'Content-Length': '0',
      });
      res.end();
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
    res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
    res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
    res.setHeader('Vary', corsHeaders['Vary']);

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, port: PORT }));
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/mock-db/')) {
      const businessId = decodeURIComponent(url.pathname.replace('/api/mock-db/', ''));
      const store = await readStore();
      const snapshot = businessId ? store[businessId] ?? null : null;
      res.writeHead(snapshot ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(snapshot ?? null));
      return;
    }

    if (req.method === 'PUT' && url.pathname.startsWith('/api/mock-db/')) {
      const businessId = decodeURIComponent(url.pathname.replace('/api/mock-db/', ''));
      if (!businessId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Business id is required.' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const incoming = body ? JSON.parse(body) : null;
          const store = await readStore();
          store[businessId] = incoming;
          await writeStore(store);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, businessId }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found.' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Shared mock store listening on http://localhost:${PORT}`);
});
