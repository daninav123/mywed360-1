/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('multer', () => ({ __esModule: true, default: () => ({ any: () => (req, _res, next) => next() }) }));
// OpenAI mock to avoid real network and timeouts
vi.mock('openai', () => ({
  __esModule: true,
  default: class OpenAI {
    constructor(){ this.chat = { completions: { create: async () => ({ choices: [{ message: { function_call: { arguments: '{"guests":[],"tasks":[]}' }, content: 'Resumen breve' } }] }) } }; }
  }
}));

// Auth mocks
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  requireAuth: () => (req, _res, next) => { req.user = { uid: 'test' }; req.userProfile = { email: 'test@example.com' }; next(); },
  requireMailAccess: () => (req, _res, next) => { req.user = { uid: 'test' }; req.userProfile = { email: 'test@example.com' }; next(); },
  requirePlanner: () => (req, _res, next) => { req.user = { uid: 'test' }; req.userProfile = { email: 'test@example.com', role: 'planner' }; next(); },
  optionalAuth: () => (_req, _res, next) => next(),
}));

// Firebase admin + Firestore mocks
const apps = [];
const fakeDB = { collection: () => ({ add: vi.fn(async () => ({ id: 'id1' })) }) };
vi.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    apps,
    initializeApp: () => { apps.push({}); },
    credential: { applicationDefault: () => ({}), cert: () => ({}) },
    firestore: Object.assign(() => fakeDB, { FieldValue: { serverTimestamp: () => new Date() } }),
    storage: () => ({ bucket: () => ({ file: () => ({ save: async () => {} }) }) })
  }
}));
vi.mock('firebase-admin/firestore', () => ({ __esModule: true, getFirestore: () => fakeDB }));

let app;
beforeAll(async () => {
  app = (await import('../index.js')).default;
});

describe.skip('AI parse-dialog', () => {
  it('POST /api/ai/parse-dialog returns simulated reply when OPENAI_API_KEY missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await request(app).post('/api/ai/parse-dialog').send({ text: 'hola, necesito ayuda' });
    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(typeof res.body.reply).toBe('string');
  });
});
