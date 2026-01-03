/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';

// Mocks para evitar dependencias externas reales
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('multer', () => {
  const middleware = (_req, _res, next) => next();
  const instance = { any: () => middleware, single: () => middleware, array: () => middleware, fields: () => middleware };
  const fn = () => instance;
  fn.memoryStorage = () => ({});
  return { __esModule: true, default: fn };
});

// Mock de firebase-admin y firestore helper para backend/db.js
const apps = [];
const fakeDB = {
  collection: () => ({
    add: vi.fn(async () => ({ id: 'fake' })),
    where: () => ({ limit: () => ({ get: vi.fn(async () => ({ empty: true, docs: [] })) }) }),
    doc: () => ({
      set: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
      collection: () => ({ add: vi.fn(async () => {}), doc: () => ({ set: vi.fn(async () => {}) }) })
    })
  })
};

vi.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    apps,
    initializeApp: () => { apps.push({}); },
    credential: { applicationDefault: () => ({}), cert: () => ({}) },
    firestore: Object.assign(() => fakeDB, { FieldValue: { increment: () => 0 } }),
    storage: () => ({ bucket: () => ({ file: () => ({ save: async () => {} }) }) })
  }
}));

vi.mock('firebase-admin/firestore', () => ({ __esModule: true, getFirestore: () => fakeDB }));

let app;
beforeAll(async () => {
  process.env.MAILGUN_SIGNING_KEY = 'test_mailgun_signing_key';
  app = (await import('../index.js')).default;
});

describe('Mailgun Webhook', () => {
  it('POST /api/mailgun/webhook -> 200 with minimal payload when signature check bypassed', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const token = 't_' + Math.random().toString(36).slice(2, 10);
    const signature = crypto
      .createHmac('sha256', process.env.MAILGUN_SIGNING_KEY)
      .update(timestamp + token)
      .digest('hex');

    const payload = {
      signature: { timestamp, token, signature },
      'event-data': {
        event: 'delivered',
        recipient: 'user@maloveapp.com',
        message: { headers: { 'message-id': '<abc@maloveapp.com>' } },
        timestamp: Math.floor(Date.now() / 1000)
      }
    };
    const res = await request(app).post('/api/mailgun/webhook').send(payload);
    expect(res.status).toBe(200);
    expect(res.body && res.body.success).toBe(true);
  });
});

