/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mocks para evitar dependencias externas reales
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('multer', () => ({ __esModule: true, default: () => ({ any: () => (req, _res, next) => next() }) }));

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
  app = (await import('../index.js')).default;
});

describe('Mailgun Webhook', () => {
  it('POST /api/mailgun/webhook -> 200 with minimal payload when signature check bypassed', async () => {
    // No MAILGUN_SIGNING_KEY in env => route allows processing in dev/tests
    const payload = {
      'event-data': {
        event: 'delivered',
        recipient: 'user@mywed360.com',
        message: { headers: { 'message-id': '<abc@mywed360.com>' } },
        timestamp: Math.floor(Date.now() / 1000)
      }
    };
    const res = await request(app).post('/api/mailgun/webhook').send(payload);
    expect(res.status).toBe(200);
    expect(res.body && res.body.success).toBe(true);
  });
});

