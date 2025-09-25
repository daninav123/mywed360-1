/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock firebase-admin firestore minimal
vi.mock('firebase-admin', () => {
  const apps = [];
  const store = { contracts: {} };
  const FieldValue = { serverTimestamp: () => new Date('2025-01-01T00:00:00Z') };
  const mkDoc = (col, id) => ({
    async get(){ const d = store[col][id]; return { exists: !!d, id, data: () => (d ? { ...d } : undefined) }; },
    async set(data, opts){ store[col][id] = opts?.merge ? { ...(store[col][id]||{}), ...data } : { ...data }; },
  });
  const mkCol = (name) => ({
    async add(data){ const id = 'id_' + Math.random().toString(36).slice(2,9); store[name] = store[name] || {}; store[name][id] = { ...data }; return { id }; },
    doc(id){ return mkDoc(name, id); },
    limit(n){ return this; },
    async get(){ return { docs: Object.entries(store[name] || {}).map(([id, data]) => ({ id, data: () => ({ ...data }) })) }; },
  });
  const firestore = () => ({ FieldValue, collection: mkCol });
  return { __esModule: true, default: { apps, initializeApp: () => { apps.push({}); }, credential: { applicationDefault: () => ({}) }, firestore } };
});

// Bypass auth
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
  requireAuth: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requireMailAccess: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin', email: 'user@example.com' }; next(); },
  requirePlanner: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'planner' }; next(); },
  optionalAuth: (_req, _res, next) => next(),
  requireAdmin: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
}));

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));

let app;
beforeAll(async () => { app = (await import('../index.js')).default; });

describe('Contracts CRUD', () => {
  const auth = { Authorization: 'Bearer mock-uid1-user@example.com' };
  let id;

  it('POST /api/contracts -> 201', async () => {
    const res = await request(app).post('/api/contracts').set(auth).send({ title: 'Contrato DJ', amount: 500 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    id = res.body.id;
  });

  it('GET /api/contracts -> 200 list', async () => {
    const res = await request(app).get('/api/contracts').set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/contracts/:id -> 200', async () => {
    const res = await request(app).get(`/api/contracts/${id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('PATCH /api/contracts/:id -> 200', async () => {
    const res = await request(app).patch(`/api/contracts/${id}`).set(auth).send({ status: 'sent' });
    expect(res.status).toBe(200);
  });

  it('POST /api/contracts/:id/send -> 200', async () => {
    const res = await request(app).post(`/api/contracts/${id}/send`).set(auth).send({});
    expect(res.status).toBe(200);
  });
});
