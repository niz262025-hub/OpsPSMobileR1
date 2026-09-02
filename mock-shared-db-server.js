const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'mock-shared-db-store.json');

function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '{}', 'utf8');
      return {};
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore store write failures during restricted runtime contexts.
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

const store = readStore();

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const target = new URL(req.url, `http://localhost:${PORT}`);

  if (!target.pathname.startsWith('/api/mock-db/')) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const businessId = decodeURIComponent(target.pathname.replace('/api/mock-db/', '') || '').trim();

  if (!businessId) {
    sendJson(res, 400, { error: 'businessId is required' });
    return;
  }

  if (req.method === 'GET') {
    const snapshot = store[businessId] ?? null;
    sendJson(res, snapshot ? 200 : 404, snapshot ?? null);
    return;
  }

  if (req.method === 'PUT') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : null;
        if (parsed && typeof parsed === 'object') {
          store[businessId] = parsed;
          writeStore(store);
          sendJson(res, 200, { ok: true, businessId });
          return;
        }

        sendJson(res, 400, { error: 'Invalid snapshot payload' });
      } catch {
        sendJson(res, 400, { error: 'Invalid JSON payload' });
      }
    });
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock shared database server running on http://localhost:${PORT}`);
});
