const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';

const app = require('../app');

test('health endpoints and malformed login requests return expected responses', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const { port } = server.address();
  const request = (path, method = 'GET', body, origin) => new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        connection: 'close',
        ...(payload ? {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        } : {}),
        ...(origin ? { origin } : {}),
      },
    }, res => {
      let response = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { response += chunk; });
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: JSON.parse(response),
      }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

  try {
    const live = await request('/health/live');
    const ready = await request('/health/ready');
    const login = await request('/api/auth/login', 'POST', { '$where': 'true' });
    const disallowedOrigin = await request('/health/live', 'GET', undefined, 'https://not-allowed.example');
    const allowedOrigin = await request('/health/live', 'GET', undefined, 'http://localhost:5173');
    const protectedRoute = await request('/api/admin/students');
    assert.equal(live.status, 200);
    assert.equal(live.body.status, 'live');
    assert.equal(ready.status, 503);
    assert.equal(ready.body.status, 'not ready');
    assert.equal(login.status, 400);
    assert.equal(login.body.success, false);
    assert.equal(disallowedOrigin.status, 200);
    assert.equal(disallowedOrigin.headers['access-control-allow-origin'], undefined);
    assert.equal(allowedOrigin.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(protectedRoute.status, 401);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
