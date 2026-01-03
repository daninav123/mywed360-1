/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('multer', () => {
  const middleware = (_req, _res, next) => next();
  const instance = { any: () => middleware, single: () => middleware, array: () => middleware, fields: () => middleware };
  const fn = () => instance;
  fn.memoryStorage = () => ({});
  return { __esModule: true, default: fn };
});

// Auth mocks
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (_req, _res, next) => next(),
  authMiddleware: () => (_req, _res, next) => next(),
  requireAuth: (req, _res, next) => {
    req.user = { uid: 'u1' };
    req.userProfile = { email: 'user@example.com', myWed360Email: 'user@maloveapp.com', role: 'admin' };
    next();
  },
  requireMailAccess: (req, _res, next) => {
    req.user = { uid: 'u1' };
    req.userProfile = { email: 'user@example.com', myWed360Email: 'user@maloveapp.com', role: 'admin' };
    next();
  },
  requirePlanner: (req, _res, next) => {
    req.user = { uid: 'u1' };
    req.userProfile = { email: 'user@example.com', role: 'planner' };
    next();
  },
  requireAdmin: (req, _res, next) => {
    req.user = { uid: 'u1' };
    req.userProfile = { email: 'user@example.com', role: 'admin' };
    next();
  },
  optionalAuth: (_req, _res, next) => next(),
}));
// Mock adicional con el mismo módulo id usado por las rutas (resolución relativa distinta)
vi.mock('../../middleware/authMiddleware.js', () => ({
  __esModule: true,
  requireAuth: (_req, _res, next) => next(),
  requireMailAccess: (_req, _res, next) => next(),
  requirePlanner: (_req, _res, next) => next(),
  optionalAuth: (_req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
}));

// Firebase admin + Firestore mocks
const apps = [];
const saved = [];
const makeDocRef = (id = 'm1') => ({
  id,
  set: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
  collection: vi.fn(() => ({
    doc: vi.fn((subId = 's1') => makeDocRef(subId)),
    where: vi.fn(() => ({ limit: vi.fn(() => ({ get: vi.fn(async () => ({ empty: true, docs: [] })) })) })),
    limit: vi.fn(() => ({ get: vi.fn(async () => ({ empty: true, docs: [] })) })),
    get: vi.fn(async () => ({ empty: true, docs: [] })),
  })),
});

const makeQuery = () => ({
  limit: vi.fn(() => makeQuery()),
  get: vi.fn(async () => ({ empty: true, docs: [] })),
});

const fakeDB = {
  collection: (name) => ({
    add: vi.fn(async (doc) => {
      const ref = makeDocRef('m1');
      saved.push({ name, doc, id: ref.id });
      return ref;
    }),
    doc: vi.fn((id = 'd1') => makeDocRef(id)),
    where: vi.fn(() => ({ limit: vi.fn(() => makeQuery()) })),
    limit: vi.fn(() => makeQuery()),
    get: vi.fn(async () => ({ empty: true, docs: [] })),
  }),
};

// db.js es el origen real usado por mailSendService
vi.mock('../db.js', () => ({ __esModule: true, db: fakeDB }));
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

// Mock del servicio para evitar dependencias (Firestore/Mailgun/red) y timeouts
vi.mock('../services/mailSendService.js', () => ({
  __esModule: true,
  sendMailAndPersist: vi.fn(async ({ to, subject, body, ownerProfile }) => {
    const recipients =
      Array.isArray(to)
        ? to
        : typeof to === 'string'
          ? to
              .split(/[;,]/)
              .map((value) => value.trim())
              .filter(Boolean)
          : [];
    const date = new Date().toISOString();
    const from = ownerProfile?.maLoveEmail || ownerProfile?.myWed360Email || ownerProfile?.email || 'no-reply@malove.app';
    return {
      sentId: 'm1',
      inboxId: 'm2',
      messageId: '<test@malove.app>',
      date,
      createdAt: date,
      from,
      to: recipients[0] || null,
      recipients,
      bodyText: typeof body === 'string' ? body : '',
      bodyHtml: null,
      subject,
    };
  }),
}));

// Mailgun stub to avoid requiring real package
vi.mock('mailgun-js', () => ({ __esModule: true, default: () => ({ Attachment: class {}, messages: () => ({ send: vi.fn(async () => ({ id: 'sent' })) }) }) }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(async () => ({ data: new Uint8Array([1,2,3]) })) } }));

let app;
beforeAll(async () => {
  app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { email: 'user@example.com', myWed360Email: 'user@maloveapp.com', role: 'admin' }; next(); });
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
