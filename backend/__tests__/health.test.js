/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock mínimo de firebase-admin para no tocar servicios reales
vi.mock('firebase-admin', () => {
  const apps = [];
  return {
    __esModule: true,
    default: {
      apps,
      initializeApp: () => { apps.push({}); },
      credential: {
        applicationDefault: () => ({}),
        cert: () => ({})
      },
      firestore: () => ({
        collection: () => ({
          limit: () => ({
            get: async () => ({ size: 0, docs: [] })
          })
        })
      }),
      storage: () => ({ bucket: () => ({ file: () => ({ save: async () => {} }) }) })
    }
  };
});

// Mocks de middlewares/dep. de infraestructura que no necesitamos en pruebas
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('multer', () => ({ __esModule: true, default: () => ({ any: () => (req, _res, next) => next() }) }));

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
