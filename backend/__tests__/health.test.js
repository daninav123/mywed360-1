/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock mínimo de firebase-admin para no tocar servicios reales
vi.mock('firebase-admin', () => {
  const apps = [];

  const makeQuery = () => ({
    get: vi.fn(async () => ({ empty: true, docs: [], size: 0, forEach: () => {} })),
    limit: vi.fn(() => makeQuery()),
    orderBy: vi.fn(() => makeQuery()),
    where: vi.fn(() => makeQuery()),
    select: vi.fn(() => ({ get: vi.fn(async () => ({ forEach: () => {} })) })),
  });

  const makeCollectionRef = () => ({
    doc: vi.fn(() => makeDocRef()),
    where: vi.fn(() => makeQuery()),
    orderBy: vi.fn(() => makeCollectionRef()),
    limit: vi.fn(() => makeQuery()),
    select: vi.fn(() => ({ get: vi.fn(async () => ({ forEach: () => {} })) })),
    get: vi.fn(async () => ({ empty: true, docs: [], size: 0, forEach: () => {} })),
    add: vi.fn(async () => ({ id: 'id1' })),
  });

  const makeDocRef = () => {
    const ref = {
      get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
      set: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
      delete: vi.fn(async () => {}),
    };
    ref.collection = vi.fn(() => makeCollectionRef());
    return ref;
  };

  const firestoreFn = vi.fn(() => ({
    collection: vi.fn(() => makeCollectionRef()),
    doc: vi.fn(() => makeDocRef()),
    batch: vi.fn(() => ({
      set: vi.fn(() => {}),
      update: vi.fn(() => {}),
      delete: vi.fn(() => {}),
      commit: vi.fn(async () => {}),
    })),
  }));
  firestoreFn.FieldValue = {
    serverTimestamp: () => new Date(),
    increment: () => 0,
    arrayUnion: (...vals) => ({ __op: 'arrayUnion', vals }),
  };
  firestoreFn.Timestamp = {
    fromDate: (d) => ({ toDate: () => d, toMillis: () => d.getTime() }),
  };

  return {
    __esModule: true,
    default: {
      apps,
      initializeApp: () => { apps.push({}); },
      credential: {
        applicationDefault: () => ({}),
        cert: () => ({}),
      },
      firestore: firestoreFn,
      auth: () => ({ verifyIdToken: async () => ({ uid: 'test' }) }),
      storage: () => ({ bucket: () => ({ file: () => ({ save: async () => {} }) }) }),
    },
  };
});

// Mocks de middlewares/dep. de infraestructura que no necesitamos en pruebas
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

let app;
beforeAll(async () => {
  // Import tardío para que el mock se aplique a todas las rutas
  app = (await import('../index.js')).default;
});

describe('Health endpoints', () => {
  it('GET /api/health -> 200 ok body', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(res.body.ok).toBe(true);
  });

  it('GET /api/health/livez -> 200 ok text', async () => {
    const res = await request(app).get('/api/health/livez');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('GET /api/health/readyz -> 200 ok body', async () => {
    const res = await request(app).get('/api/health/readyz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
