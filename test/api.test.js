'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildApp } = require('../src/server/app');
const { DatabaseRepository } = require('../src/db/database');
const { JwtHelper } = require('../src/auth/jwt');
const { BroadcastController } = require('../src/broadcast/controller');

const CONFIG = {
  name: 'test',
  port: 0,
  host: '127.0.0.1',
  database: 'database.json',
  idType: 'int',
  enableSocket: false,
  socketPort: 0,
  broadcastProvider: ['socket'],
  storage: { folder: 'storage/' },
  auth: {
    jwtSecret: 'test-secret',
    jwtExpire: 3600,
    unauthorizedStatusCode: 403,
    enableAdm: false,
    urlUserPermission: [],
    urlSkip: [],
    authFields: [],
  },
};

function createContext(configOverride) {
  const config = { ...CONFIG, ...(configOverride || {}) };
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jrs-test-'));
  const paths = {
    baseDir,
    databasePath: path.join(baseDir, 'database.json'),
    configPath: path.join(baseDir, 'config.yaml'),
    storageFolder: path.join(baseDir, 'storage'),
  };
  fs.writeFileSync(
    paths.databasePath,
    JSON.stringify({
      users: [
        { id: 1, email: 'a@a.com', password: 'x', name: 'Alice' },
        { id: 2, email: 'b@b.com', password: 'y', name: 'Bob' },
      ],
      adm_users: [{ id: 1, email: 'adm@a.com', password: 'z' }],
      products: [
        { id: 1, title: 'Apple', price: 5 },
        { id: 2, title: 'Banana', price: 3 },
      ],
    })
  );

  const database = new DatabaseRepository(config, paths);
  database.load();
  const jwt = new JwtHelper(config);
  const broadcast = new BroadcastController();
  const ctx = { config, paths, database, jwt, broadcast };
  const app = buildApp(ctx);
  return { ctx, app, baseDir };
}

function noAuthContext() {
  return createContext({ auth: null });
}

function authContext() {
  return createContext();
}

function request(app, method, url, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: url,
          method,
          headers: {
            ...(payload ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            let json = null;
            try {
              json = data ? JSON.parse(data) : null;
            } catch {
              json = data;
            }
            server.close();
            resolve({ status: res.statusCode, body: json });
          });
        }
      );
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  });
}

test('GET collection returns array', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/products');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.strictEqual(res.body.length, 2);
});

test('GET by id returns object', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/products/1');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.title, 'Apple');
});

test('GET by missing id returns {} with 200', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/products/999');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, {});
});

test('GET missing table returns 404', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/nope');
  assert.strictEqual(res.status, 404);
});

test('GET filter is case-insensitive contains', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/products?title=apple');
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].title, 'Apple');
});

test('GET pagination returns metadata', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/products?page=1&limit=1');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.total, 2);
  assert.strictEqual(res.body.page, 1);
  assert.strictEqual(res.body.limit, 1);
  assert.strictEqual(res.body.totalPages, 2);
  assert.strictEqual(res.body.data.length, 1);
});

test('POST creates resource and returns 200 with id', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'POST', '/products', {
    body: { title: 'Cherry', price: 7 },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.id, 3);
  assert.strictEqual(res.body.title, 'Cherry');
});

test('PUT updates existing resource', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'PUT', '/products/1', {
    body: { title: 'AppleX', price: 9 },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.title, 'AppleX');
  assert.strictEqual(res.body.id, 1);
});

test('PUT missing id returns 404', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'PUT', '/products/999', {
    body: { title: 'Z' },
  });
  assert.strictEqual(res.status, 404);
});

test('PATCH updates partial resource', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'PATCH', '/products/1', { body: { price: 11 } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.price, 11);
  assert.strictEqual(res.body.title, 'Apple');
});

test('DELETE returns 200 even for missing id', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'DELETE', '/products/999');
  assert.strictEqual(res.status, 200);
});

test('auth: GET /products without token is unauthorized', async () => {
  const { app } = authContext();
  const res = await request(app, 'GET', '/products');
  assert.strictEqual(res.status, 403);
});

test('auth: login and access /products with token', async () => {
  const { app } = authContext();
  const login = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'x' },
  });
  assert.strictEqual(login.status, 200);
  assert.ok(login.body.access_token);

  const res = await request(app, 'GET', '/products', {
    headers: { Authorization: `Bearer ${login.body.access_token}` },
  });
  assert.strictEqual(res.status, 200);
});

test('auth: /me removes password', async () => {
  const { app } = authContext();
  const login = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'x' },
  });
  const me = await request(app, 'GET', '/me', {
    headers: { Authorization: `Bearer ${login.body.access_token}` },
  });
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.email, 'a@a.com');
  assert.strictEqual(me.body.password, undefined);
});

test('auth: wrong password is unauthorized', async () => {
  const { app } = authContext();
  const res = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'wrong' },
  });
  assert.strictEqual(res.status, 403);
});

test('auth: refresh token has nbf=jwtExpire so is rejected before access token expires', async () => {
  const { app } = authContext();
  const login = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'x' },
  });
  const refresh = await request(app, 'PUT', '/auth/refresh', {
    body: { refresh_token: login.body.refresh_token },
    headers: { Authorization: `Bearer ${login.body.access_token}` },
  });
  assert.strictEqual(refresh.status, 403);
  assert.strictEqual(refresh.body.error, 'refresh_token_not_yet_valid');
});

test('#userAuthRef is replaced by the authenticated user id', async () => {
  const { app } = authContext();
  const login = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'x' },
  });
  const headers = { Authorization: `Bearer ${login.body.access_token}` };
  const created = await request(app, 'POST', '/products', {
    body: { title: 'Private', owner: '#userAuthRef' },
    headers,
  });
  assert.strictEqual(created.status, 200);
  assert.strictEqual(created.body.owner, '1');
});

test('rejects malformed json body', async () => {
  const { app } = noAuthContext();
  const res = await new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const req = http.request(
        { host: '127.0.0.1', port, path: '/products', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        (r) => {
          let d = '';
          r.on('data', (c) => (d += c));
          r.on('end', () => {
            server.close();
            resolve({ status: r.statusCode, body: JSON.parse(d) });
          });
        }
      );
      req.on('error', reject);
      req.write('{bad json');
      req.end();
    });
  });
  assert.strictEqual(res.status, 400);
});

test('GET /me without auth config returns 404', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'GET', '/me');
  assert.strictEqual(res.status, 404);
});

test('POST /auth without auth config and invalid creds returns 403 (no crash)', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'wrong' },
  });
  assert.strictEqual(res.status, 403);
});

test('POST /auth with valid creds but no auth config returns 500 with clear message (no crash)', async () => {
  const { app } = noAuthContext();
  const res = await request(app, 'POST', '/auth', {
    body: { email: 'a@a.com', password: 'x' },
  });
  assert.strictEqual(res.status, 500);
  assert.match(res.body.error, /not configured/i);
});