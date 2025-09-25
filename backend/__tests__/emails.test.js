/* @vitest-environment node */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Bypass auth for testing
vi.mock('../middleware/authMiddleware.js', () => ({
  __esModule: true,
  default: () => (req, _res, next) => next(),
  requireAuth: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requireAdmin: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin' }; next(); },
  requirePlanner: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'planner' }; next(); },
  requireMailAccess: (req, _res, next) => { req.user = { uid: 'u1' }; req.userProfile = { role: 'admin', email: 'user@example.com' }; next(); },
  optionalAuth: (req, _res, next) => next(),
}));

// Infra mocks
vi.mock('helmet', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('cors', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));
vi.mock('express-rate-limit', () => ({ __esModule: true, default: () => (req, _res, next) => next() }));

let app;
beforeAll(async () => {
  app = (await import('../index.js')).default;
});

describe('Emails analyze', () => {
  it('POST /api/emails/analyze -> returns structured analysis', async () => {
    const res = await request(app)
      .post('/api/emails/analyze')
      .set({ Authorization: 'Bearer mock-uid-user@example.com' })
      .send({ subject: 'Presupuesto y contrato', body: 'Reunión 2025-10-10 a las 10:30, presupuesto 300€' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(res.body).toHaveProperty('meetings');
    expect(res.body).toHaveProperty('budgets');
    expect(res.body).toHaveProperty('contracts');
  });
});
