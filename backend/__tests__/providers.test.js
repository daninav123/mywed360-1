/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// In-memory Firestore mock for providers
vi.mock('firebase-admin', () => {
  const apps = [];
  const store = { providers: {} };
  const FieldValue = { serverTimestamp: () => new Date('2025-01-01T00:00:00Z') };

  function makeDocRef(colName, id) {
    return {
      async get() {
        const col = store[colName] || {};
        const data = col[id];
        return {
          exists: !!data,
          id,
          data: () => (data ? { ...data } : undefined),
        };
      },
      async set(data, opts) {
        store[colName] = store[colName] || {};
        if (opts && opts.merge) {
          store[colName][id] = { ...(store[colName][id] || {}), ...data };
        } else {
          store[colName][id] = { ...data };
        }
      },
      async delete() {
        if (store[colName]) delete store[colName][id];
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
        const col = Object.entries(store[colName] || {}).map(([id, data]) => ({ id, data: () => ({ ...data }) }));
        const filtered = filters.length
          ? col.filter((d) => filters.every((f) => (d.data()[f.field] || null) === f.value))
          : col;
        const limited = filtered.slice(0, _limit);
        return { size: limited.length, docs: limited };
      },
    };
  }

  const firestore = () => ({
    FieldValue,
    collection(name) {
      return {
        where(field, op, val) { return makeQuery(name, []).where(field, op, val); },
        limit(n) { return makeQuery(name, [], n); },
        async get() { return makeQuery(name).get(); },
        async add(data) {
          const id = 'id_' + Math.random().toString(36).slice(2, 9);
          store[name] = store[name] || {};
          store[name][id] = { ...data };
          return { id };
        },
        doc(id) { return makeDocRef(name, id); },
      };
    },
  });

  return {
    __esModule: true,
    default: {
      apps,
      initializeApp: () => { apps.push({}); },
      credential: { applicationDefault: () => ({}) },
      firestore,
    }
  };
});

// Bypass auth middleware to avoid real token verification
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
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
});

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
