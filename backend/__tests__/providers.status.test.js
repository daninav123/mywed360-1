/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// In-memory Firestore mock for providers + contracts + payments
vi.mock('firebase-admin', () => {
  const apps = [];
  const store = { providers: {}, contracts: {}, payments: {} };
  const FieldValue = { serverTimestamp: () => new Date('2025-01-01T00:00:00Z') };

  function makeDocRef(colName, id) {
    return {
      async get() {
        const col = store[colName] || {};
        const data = col[id];
        return { exists: !!data, id, data: () => (data ? { ...data } : undefined) };
      },
      async set(data, opts) {
        store[colName] = store[colName] || {};
        if (opts && opts.merge) {
          store[colName][id] = { ...(store[colName][id] || {}), ...data };
        } else {
          store[colName][id] = { ...data };
        }
      },
      async delete() { if (store[colName]) delete store[colName][id]; },
    };
  }

  function makeQuery(colName, filters = [], _limit = 20) {
    return {
      where(field, op, value) {
        if (op !== '==') return this; // minimal
        return makeQuery(colName, [...filters, { field, value }], _limit);
      },
      limit(n) { return makeQuery(colName, filters, n); },
      async get() {
        const rows = Object.entries(store[colName] || {}).map(([id, data]) => ({ id, data: () => ({ ...data }) }));
        const filtered = filters.length ? rows.filter((d) => filters.every((f) => (d.data()[f.field] || null) === f.value)) : rows;
        const limited = filtered.slice(0, _limit);
        return { empty: limited.length === 0, size: limited.length, docs: limited };
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

  return { __esModule: true, default: { apps, initializeApp: () => { apps.push({}); }, credential: { applicationDefault: () => ({}) }, firestore } };
});

// Bypass auth middleware
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
  requireAuth: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requireAdmin: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requirePlanner: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'planner' }; next(); },
  requireMailAccess: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  optionalAuth: (_req, _res, next) => next(),
}));

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));

let app;
beforeAll(async () => {
  const admin = (await import('firebase-admin')).default;
  // Seed some data
  const fs = admin.firestore();
  await fs.collection('providers').doc('p1').set({ name: 'Proveedor 1' });
  await fs.collection('contracts').add({ providerId: 'p1', status: 'draft', amount: 100, updatedAt: new Date('2025-01-01') });
  await fs.collection('contracts').add({ providerId: 'p1', status: 'signed', amount: 300, updatedAt: new Date('2025-01-02') });
  await fs.collection('payments').add({ providerId: 'p1', status: 'paid', amount: 200, updatedAt: new Date('2025-01-03') });
  await fs.collection('payments').add({ providerId: 'p1', status: 'pending', amount: 150, updatedAt: new Date('2025-01-04') });
  app = (await import('../index.js')).default;
});

describe('Providers status aggregation', () => {
  const auth = { Authorization: 'Bearer mock-uid1-user@example.com' };

  it('GET /api/providers/:id/status -> aggregates contracts and payments', async () => {
    const res = await request(app).get('/api/providers/p1/status').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('contracts');
    expect(res.body.contracts.total).toBe(2);
    expect(res.body.contracts.byStatus.signed).toBe(1);
    expect(res.body.contracts.amountSigned).toBe(300);
    expect(res.body).toHaveProperty('payments');
    expect(res.body.payments.total).toBe(2);
    expect(res.body.payments.byStatus.paid).toBe(1);
    expect(res.body.payments.amount.paid).toBe(200);
    expect(res.body.payments.amount.pending).toBe(150);
  });
});

