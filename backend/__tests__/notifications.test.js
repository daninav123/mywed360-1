/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Bypass auth
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
  requireAuth: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requireAdmin: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requirePlanner: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'planner' }; next(); },
  requireMailAccess: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin', email: 'user@example.com' }; next(); },
  optionalAuth: (req, _res, next) => next(),
}));

// Minimal in-memory db mock for notifications
vi.mock('../db.js', () => {
  const store = { notifications: {} };
  const mkSnap = (arr) => ({ empty: arr.length === 0, docs: arr.map(([id, data]) => ({ id, data: () => ({ ...data }) })) });
  const mkDoc = (col, id) => ({
    async get() { const d = store[col][id]; return { exists: !!d, id, data: () => (d ? { ...d } : undefined) }; },
    async update(data) { store[col][id] = { ...(store[col][id] || {}), ...data }; },
    async set(data, opts) { store[col][id] = opts?.merge ? { ...(store[col][id]||{}), ...data } : { ...data }; },
    async delete() { delete store[col][id]; },
  });
  const mkCol = (name) => ({
    async add(data) { const id = 'id_' + Math.random().toString(36).slice(2,9); if(!store[name]) store[name] = {}; store[name][id] = { ...data }; return { id }; },
    doc(id) { return mkDoc(name, id); },
    orderBy(field, dir){
      return { async get(){ const entries = Object.entries(store[name] || {}); const sorted = entries.sort((a,b)=> String(b[1]?.date||'').localeCompare(String(a[1]?.date||''))); return mkSnap(sorted); } };
    },
    async get(){ return mkSnap(Object.entries(store[name] || {})); },
  });
  return { __esModule: true, db: { collection: mkCol } };
});

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));

let app;
beforeAll(async () => {
  app = (await import('../index.js')).default;
});

describe('Notifications CRUD', () => {
  const auth = { Authorization: 'Bearer mock-uid1-user@example.com' };
  let createdId = null;

  it('POST /api/notifications -> 201', async () => {
    const res = await request(app).post('/api/notifications').set(auth).send({ message: 'Hola mundo' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdId = res.body.id;
  });

  it('GET /api/notifications -> 200 list', async () => {
    const res = await request(app).get('/api/notifications').set(auth);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/notifications/:id/read -> 200', async () => {
    const res = await request(app).patch(`/api/notifications/${createdId}/read`).set(auth).send({});
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });

  it('PATCH /api/notifications/:id -> 200', async () => {
    const res = await request(app).patch(`/api/notifications/${createdId}`).set(auth).send({ message: 'Actualizado' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Actualizado');
  });

  it('DELETE /api/notifications/:id -> 204', async () => {
    const res = await request(app).delete(`/api/notifications/${createdId}`).set(auth);
    expect(res.status).toBe(204);
  });
});
