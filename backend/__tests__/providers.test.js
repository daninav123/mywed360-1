/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// In-memory Firestore mock for providers
vi.mock('firebase-admin', () => {
  const apps = [];
  const store = {};
  const getBucket = (path) => {
    if (!store[path]) store[path] = {};
    return store[path];
  };
  const FieldValue = { serverTimestamp: () => new Date('2025-01-01T00:00:00Z') };
  const Timestamp = { now: () => new Date('2025-01-01T00:00:00Z') };

  function makeDocRef(colPath, id) {
    return {
      async get() {
        const col = getBucket(colPath);
        const data = col[id];
        return {
          exists: !!data,
          id,
          data: () => (data ? { ...data } : undefined),
        };
      },
      async set(data, opts) {
        const bucket = getBucket(colPath);
        bucket[id] = opts && opts.merge ? { ...(bucket[id] || {}), ...data } : { ...data };
      },
      async delete() {
        const bucket = getBucket(colPath);
        delete bucket[id];
      },
      collection(subName) {
        return makeCollection(`${colPath}/${id}/${subName}`);
      },
    };
  }

  function makeQuery(colName, filters = [], _limit = 20) {
    return {
      where(field, op, value) {
        if (op !== '==') return this; // minimal
        return makeQuery(colName, [...filters, { field, value }], _limit);
      },
      limit(n) {
        return makeQuery(colName, filters, n);
      },
      async get() {
        const col = Object.entries(getBucket(colName)).map(([id, data]) => ({ id, data: () => ({ ...data }) }));
        const filtered = filters.length
          ? col.filter((d) => filters.every((f) => (d.data()[f.field] || null) === f.value))
          : col;
        const limited = filtered.slice(0, _limit);
        return { empty: limited.length === 0, size: limited.length, docs: limited };
      },
    };
  }

  function makeCollection(name) {
    return {
      where(field, op, val) {
        return makeQuery(name, []).where(field, op, val);
      },
      limit(n) {
        return makeQuery(name, [], n);
      },
      orderBy() {
        return makeCollection(name);
      },
      select() {
        return makeCollection(name);
      },
      async get() {
        return makeQuery(name).get();
      },
      async add(data) {
        const id = 'id_' + Math.random().toString(36).slice(2, 9);
        const bucket = getBucket(name);
        bucket[id] = { ...data };
        return { id };
      },
      doc(id) {
        return makeDocRef(name, id);
      },
    };
  }

  const firestore = () => ({
    FieldValue,
    Timestamp,
    collection(name) {
      return makeCollection(name);
    },
  });

  firestore.FieldValue = FieldValue;
  firestore.Timestamp = Timestamp;

  return {
    __esModule: true,
    default: {
      apps,
      initializeApp: () => { apps.push({}); },
      credential: { applicationDefault: () => ({}) },
      firestore,
      auth: () => ({}),
    }
  };
});

// Bypass auth middleware to avoid real token verification
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
  authMiddleware: () => (_req, _res, next) => next(),
  requireAuth: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requireAdmin: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requirePlanner: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'planner' }; next(); },
  requireMailAccess: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin', email: 'user@example.com' }; next(); },
  optionalAuth: (_req, _res, next) => next(),
}));

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));

let app;
beforeAll(async () => {
  app = (await import('../index.js')).default;
}, 30000);

describe('Providers API', () => {
  const auth = { Authorization: 'Bearer mock-uid1-user@example.com' };

  it('GET /api/providers -> 200 empty list by default', async () => {
    const res = await request(app).get('/api/providers').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('POST /api/providers -> 400 when missing name', async () => {
    const res = await request(app).post('/api/providers').set(auth).send({});
    expect(res.status).toBe(400);
  });
});
