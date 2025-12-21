/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// In-memory Firestore mock with nested collections (weddings/{id}/guests/{id}) and rsvpTokens
vi.mock('firebase-admin', () => {
  const apps = [];
  const store = { weddings: {}, rsvpTokens: {} };
  const FieldValue = { serverTimestamp: () => new Date('2025-01-01T00:00:00Z') };

  function ensurePath(path) {
    const parts = path.split('/');
    let node = store;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      node[key] = node[key] || {};
      node = node[key];
    }
    return node;
  }

  function getPath(path) {
    const parts = path.split('/');
    let node = store;
    for (let i = 0; i < parts.length; i++) {
      node = node?.[parts[i]];
      if (!node) return undefined;
    }
    return node;
  }

  function makeDocRef(basePath, id) {
    const path = basePath ? `${basePath}/${id}` : id;
    return {
      collection(sub) {
        const subPath = `${path}/${sub}`;
        return makeCollectionRef(subPath);
      },
      async get() {
        const data = getPath(path);
        return { exists: !!data, id, data: () => (data ? { ...data } : undefined) };
      },
      async set(data, opts) {
        const node = getPath(path) || {};
        const merged = opts && opts.merge ? { ...node, ...data } : { ...data };
        const containerPath = basePath;
        if (containerPath) {
          const parent = ensurePath(containerPath);
          parent[id] = merged;
        }
      },
    };
  }

  function makeCollectionRef(path) {
    return {
      doc(id) { return makeDocRef(path, id); },
      async add(data) {
        const id = 'id_' + Math.random().toString(36).slice(2, 9);
        const parent = ensurePath(path);
        parent[id] = { ...data };
        return { id };
      },
      async get() {
        const parent = getPath(path) || {};
        const docs = Object.entries(parent).map(([id, data]) => ({ id, data: () => ({ ...data }) }));
        return { empty: docs.length === 0, docs };
      },
      where() { return this; },
      limit() { return this; },
    };
  }

  const firestore = () => ({
    FieldValue,
    collection(name) {
      if (name === 'weddings') {
        return {
          doc(id) {
            const basePath = `weddings/${id}`;
            return {
              collection(sub) { return makeCollectionRef(`${basePath}/${sub}`); },
              async get() { const d = getPath(basePath); return { exists: !!d, id, data: () => (d ? { ...d } : undefined) }; },
              async set(data, opts) {
                const node = getPath(basePath) || {};
                const merged = opts && opts.merge ? { ...node, ...data } : { ...data };
                ensurePath('weddings');
                store.weddings[id] = merged;
              },
            };
          },
        };
      }
      // rsvpTokens and any flat top-level collection
      return {
        doc(id) { return makeDocRef(name, id); },
        async add(data) { const parent = ensurePath(name); const id = 'id_' + Math.random().toString(36).slice(2, 9); parent[id] = { ...data }; return { id }; },
        async get() { const parent = getPath(name) || {}; const docs = Object.entries(parent).map(([id, data]) => ({ id, data: () => ({ ...data }) })); return { empty: docs.length === 0, docs }; },
        where() { return this; },
        limit() { return this; },
      };
    },
  });

  // Ensure admin.firestore.FieldValue works (property on function)
  firestore.FieldValue = FieldValue;
  return { __esModule: true, default: { apps, initializeApp: () => { apps.push({}); }, credential: { applicationDefault: () => ({}) }, firestore } };
});

// Bypass auth middleware; allow requirePlanner
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
  authMiddleware: () => (_req, _res, next) => next(),
  requireAuth: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requireAdmin: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requirePlanner: (req, _res, next) => { req.user = { uid: 'planner1' }; req.userProfile = { role: 'planner' }; next(); },
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
  const fs = admin.firestore();
  // Seed a guest without token
  await fs.collection('weddings').doc('w1').collection('guests').doc('g1').set({ name: 'Guest 1', status: 'pending' });
  app = (await import('../index.js')).default;
}, 30000);

describe('RSVP generate link', () => {
  const auth = { Authorization: 'Bearer mock-planner@example.com' };

  it('POST /api/rsvp/generate-link -> returns token + link for existing guest', async () => {
    const res = await request(app).post('/api/rsvp/generate-link').set(auth).send({ weddingId: 'w1', guestId: 'g1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data?.token).toBe('string');
    expect(res.body.data?.link).toContain('/rsvp/');
    expect(res.body.data?.weddingId).toBe('w1');
    expect(res.body.data?.guestId).toBe('g1');
  });

  it('POST /api/rsvp/generate-link -> 404 if guest not found', async () => {
    const res = await request(app).post('/api/rsvp/generate-link').set(auth).send({ weddingId: 'w1', guestId: 'nope' });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe('not_found');
  });
});
