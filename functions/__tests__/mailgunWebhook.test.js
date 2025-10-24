import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock firebase-functions to return raw handlers
vi.mock('firebase-functions', () => ({
  https: { onRequest: (fn) => fn },
  pubsub: { schedule: () => ({ timeZone: () => ({ onRun: () => vi.fn() }) }) },
  config: () => ({}),
}), { virtual: true });

// Minimal Firestore admin mock (batch + collection/doc)
const batchOps = [];
const commitMock = vi.fn(async () => {});
const batch = {
  set: vi.fn((ref, data, opts) => batchOps.push({ ref, data, opts })),
  commit: commitMock,
};
const firestoreMock = {
  batch: () => batch,
  collection: (name) => ({ doc: (id) => ({ path: `${name}/${id}` }) }),
};

const adminMock = {
  apps: [],
  initializeApp: vi.fn(),
  firestore: vi.fn(() => firestoreMock),
};

vi.mock('firebase-admin', () => ({
  ...adminMock,
  default: adminMock,
}), { virtual: true });

// cors real es suficiente si el origen permitido coincide

function makeSignature(key, token, timestamp) {
  const h = crypto.createHmac('sha256', key).update(timestamp + token).digest('hex');
  return h;
}

function callHandler(handler, body) {
  return new Promise((resolve) => {
    const req = { method: 'POST', headers: { origin: 'http://localhost:5173' }, body };
    const res = {
      statusCode: 200,
      headers: {},
      set: vi.fn(),
      setHeader: vi.fn((k, v) => { res.headers[k] = v; }),
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode || 200, body: payload }); },
      send(payload) { resolve({ status: this.statusCode || 200, body: payload }); },
    };
    handler(req, res);
  });
}

describe('mailgunWebhook signature verification', () => {
  beforeEach(() => {
    batchOps.length = 0;
    commitMock.mockClear();
    process.env.MAILGUN_SIGNING_KEY = 'test_signing_key';
    process.env.NODE_ENV = 'production';
  });

  it('accepts a valid single event and writes to Firestore', async () => {
    const token = 'tok1';
    const timestamp = '1737072000';
    const signature = makeSignature(process.env.MAILGUN_SIGNING_KEY, token, timestamp);
    const payload = {
      signature: { token, timestamp, signature },
      'event-data': { id: 'evt1', event: 'delivered', recipient: 'user@maloveapp.com' },
    };
    const mod = await import('../index.js');
    const mailgunWebhook = mod.mailgunWebhook || (mod.default && mod.default.mailgunWebhook);
    const res = await callHandler(mailgunWebhook, payload);
    expect(res.status).toBe(200);
    expect(res.body && res.body.received).toBe(1);
    expect(batchOps.length).toBe(1);
    expect(commitMock).toHaveBeenCalled();
  });

  it('rejects when signature missing', async () => {
    const payload = {
      'event-data': { id: 'evt2', event: 'delivered', recipient: 'user@maloveapp.com' },
    };
    const mod = await import('../index.js');
    const mailgunWebhook = mod.mailgunWebhook || (mod.default && mod.default.mailgunWebhook);
    const res = await callHandler(mailgunWebhook, payload);
    expect(res.status).toBe(401);
  });

  it('validates all events in array (fails on any invalid)', async () => {
    const t1 = '1737072000';
    const tok1 = 'tok1';
    const sig1 = makeSignature(process.env.MAILGUN_SIGNING_KEY, tok1, t1);
    const good = { signature: { token: tok1, timestamp: t1, signature: sig1 }, 'event-data': { id: 'e1' } };
    const bad = { signature: { token: 'tok2', timestamp: '1737072111', signature: 'invalid' }, 'event-data': { id: 'e2' } };
    const mod = await import('../index.js');
    const mailgunWebhook = mod.mailgunWebhook || (mod.default && mod.default.mailgunWebhook);
    const res = await callHandler(mailgunWebhook, [good, bad]);
    expect(res.status).toBe(401);
    expect(commitMock).not.toHaveBeenCalled();
  });
});
