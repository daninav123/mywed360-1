/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock mínimo de firebase-admin para no tocar servicios reales
vi.mock('firebase-admin', () => {
  const apps = [];
  return {
    __esModule: true,
    default: {
      apps,
      initializeApp: () => {
        apps.push({});
      },
      credential: {
        applicationDefault: () => ({}),
        cert: () => ({}),
      },
      firestore: () => ({
        collection: () => ({
          limit: () => ({ get: async () => ({ size: 0, docs: [] }) }),
        }),
      }),
    },
  };
});

// Mocks de middlewares/dep. de infraestructura que no necesitamos en pruebas
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
}));
vi.mock('axios', () => ({ __esModule: true, default: { get: vi.fn(), post: vi.fn() } }));

let app;
beforeAll(async () => {
  app = (await import('../index.js')).default;
});

beforeEach(() => {
  // Asegurar defaults predecibles
  process.env.WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || 'twilio';
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_WHATSAPP_FROM;
});

describe('WhatsApp provider health', () => {
  it('GET /api/whatsapp/provider-status -> 200 con estado', async () => {
    const res = await request(app).get('/api/whatsapp/provider-status');
    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(typeof res.body.provider).toBe('string');
    expect(typeof res.body.configured).toBe('boolean');
    expect(res.body.success).toBe(true);
  });

  it('GET /api/whatsapp/health -> 200 con success y status', async () => {
    const res = await request(app).get('/api/whatsapp/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'whatsapp');
    expect(res.body).toHaveProperty('status');
  });
});
