/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mocks infra
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
// Stub router that depends on multer to avoid resolution at transform time
vi.mock('../routes/mailgun-inbound.js', async () => {
  const express = (await import('express')).default;
  return { __esModule: true, default: express.Router() };
});

// Mock prom-client para habilitar /metrics
vi.mock('prom-client', () => {
  class Registry {
    constructor(){ this.contentType = 'text/plain; version=0.0.4'; }
    async metrics(){ return '# HELP http_requests_total'; }
  }
  class Counter {
    constructor(){ }
    labels(){ return { inc(){ } }; }
  }
  class Histogram {
    constructor(){ }
    labels(){ return { observe(){ } }; }
  }
  return { __esModule: true, default: { Registry, collectDefaultMetrics: () => {}, Counter, Histogram } };
});

// Auth mocks para evitar bloqueo
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  requireAuth: () => (req, _res, next) => { req.user = { uid: 't' }; next(); },
  requireMailAccess: () => (req, _res, next) => { req.user = { uid: 't' }; next(); },
  requirePlanner: () => (req, _res, next) => { req.user = { uid: 't' }; req.userProfile = { role: 'planner' }; next(); },
  requireAdmin: () => (req, _res, next) => { req.user = { uid: 'admin' }; req.userProfile = { role: 'admin' }; next(); },
  optionalAuth: () => (_req, _res, next) => next(),
}));

let app;
beforeAll(async () => {
  app = (await import('../index.js')).default;
});

describe('Prometheus metrics', () => {
  it('GET /metrics returns text/plain when prom-client available', async () => {
    const res = await request(app).get('/metrics');
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect((res.headers['content-type'] || '').includes('text/plain')).toBe(true);
      expect(typeof res.text).toBe('string');
    }
  });
});
