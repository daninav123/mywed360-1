import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-functions (CommonJS style)
vi.mock('firebase-functions', () => ({
  https: { onRequest: (fn) => fn },
  pubsub: { schedule: () => ({ timeZone: () => ({ onRun: () => vi.fn() }) }) },
  config: () => ({}),
}), { virtual: true });

// Minimal admin mock
const adminMock = {
  apps: [],
  initializeApp: vi.fn(),
  auth: () => ({ verifyIdToken: vi.fn(async () => ({ uid: 'uid', email: 'u@e' })) }),
  firestore: vi.fn(() => ({
    batch: () => ({ set: vi.fn(), commit: vi.fn() }),
  })),
};
vi.mock('firebase-admin', () => ({
  ...adminMock,
  default: adminMock,
}), { virtual: true });

function callHandler(handler, { method = 'GET', headers = {}, query = {}, body = undefined } = {}) {
  return new Promise((resolve) => {
    const req = { method, headers, query, body };
    const res = {
      statusCode: 200,
      headers: {},
      set: vi.fn(),
      setHeader: vi.fn((k, v) => { res.headers[k] = v; }),
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode || 200, body: payload, headers: this.headers }); },
      send(payload) { resolve({ status: this.statusCode || 200, body: payload, headers: this.headers }); },
    };
    handler(req, res);
  });
}

describe('getMailgunEvents auth and params', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_MOCK_TOKENS = 'true';
  });

  it('returns 401 without Authorization', async () => {
    const mod = await import('../index.js');
    const handler = mod.getMailgunEvents;
    const res = await callHandler(handler, { method: 'GET', headers: { origin: 'http://localhost:5173' }, query: {} });
    expect(res.status).toBe(401);
  });

  it('returns 400 with auth but missing recipient/from', async () => {
    const mod = await import('../index.js');
    const handler = mod.getMailgunEvents;
    const res = await callHandler(handler, {
      method: 'GET',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      query: {},
    });
    expect(res.status).toBe(400);
  });

  it('clamps limit and calls fetch (200)', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ items: [] }) }));
    globalThis.fetch = fetchSpy;
    const mod = await import('../index.js');
    const handler = mod.getMailgunEvents;
    const res = await callHandler(handler, {
      method: 'GET',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      query: { recipient: 'user@maloveapp.com', limit: '9999' },
    });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toMatch(/limit=300/); // clamped
    expect(url).toMatch(/recipient=user%40mywed360\.com/);
  });
});

describe('mailgunWebhook CORS preflight', () => {
  it('responds 204 to OPTIONS', async () => {
    const mod = await import('../index.js');
    const webhook = mod.mailgunWebhook;
    const res = await callHandler(webhook, { method: 'OPTIONS', headers: { origin: 'http://localhost:5173' } });
    expect(res.status).toBe(204);
  });
});

