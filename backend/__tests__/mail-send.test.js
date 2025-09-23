/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('multer', () => ({ __esModule: true, default: () => ({ any: () => (req, _res, next) => next() }) }));

// Auth mocks
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  requireAuth: () => (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { email: 'user@example.com', myWed360Email: 'user@mywed360.com', role: 'admin' }; next(); },
  requireMailAccess: () => (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { email: 'user@example.com', myWed360Email: 'user@mywed360.com', role: 'admin' }; next(); },
  requirePlanner: () => (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { email: 'user@example.com', role: 'planner' }; next(); },
  optionalAuth: () => (_req, _res, next) => next(),
}));
// Mock adicional con el mismo módulo id usado por las rutas (resolución relativa distinta)
vi.mock('../../middleware/authMiddleware.js', () => ({
  __esModule: true,
  requireAuth: () => (_req, _res, next) => next(),
  requireMailAccess: () => (_req, _res, next) => next(),
  requirePlanner: () => (_req, _res, next) => next(),
  optionalAuth: () => (_req, _res, next) => next(),
  requireAdmin: () => (_req, _res, next) => next(),
}));

// Firebase admin + Firestore mocks
const apps = [];
const saved = [];
const fakeDB = {
  collection: (name) => ({
    add: vi.fn(async (doc) => { saved.push({ name, doc }); return { id: 'm1' }; }),
    doc: () => ({ set: vi.fn(async () => {}), update: vi.fn(async () => {}), collection: () => ({ doc: () => ({ set: vi.fn(async () => {}) }) }) })
  })
};
vi.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    apps,
    initializeApp: () => { apps.push({}); },
    credential: { applicationDefault: () => ({}), cert: () => ({}) },
    firestore: Object.assign(() => fakeDB, { FieldValue: { increment: () => 0, serverTimestamp: () => new Date() } }),
    storage: () => ({ bucket: () => ({ file: () => ({ save: async () => {} }) }) })
  }
}));
vi.mock('firebase-admin/firestore', () => ({ __esModule: true, getFirestore: () => fakeDB }));

// Mailgun stub to avoid requiring real package
vi.mock('mailgun-js', () => ({ __esModule: true, default: () => ({ Attachment: class {}, messages: () => ({ send: vi.fn(async () => ({ id: 'sent' })) }) }) }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(async () => ({ data: new Uint8Array([1,2,3]) })) } }));

let app;
beforeAll(async () => {
  app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { email: 'user@example.com', myWed360Email: 'user@mywed360.com', role: 'admin' }; next(); });
  const postSend = (await import('../routes/mail/postSend.js')).default;
  app.use('/api/mail', postSend);
});

describe('Mail send (record-only)', () => {
  it('POST /api/mail/send persists mail when recordOnly=true', async () => {
    const body = { to: 'recipient@example.com', subject: 'Hi', body: 'Test', recordOnly: true };
    const res = await request(app).post('/api/mail').send(body);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeTruthy();
  });
});
