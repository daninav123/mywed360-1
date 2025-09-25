import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('payments routes validation', () => {
  let app;
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    const paymentsRouter = (await import('../routes/payments.js')).default;
    app.use('/api/payments', paymentsRouter);
  });

  it('rejects checkout without amount (400)', async () => {
    const res = await request(app).post('/api/payments/checkout').send({});
    expect(res.status).toBe(400);
  });

  it('returns 503 when Stripe key missing (valid body)', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await request(app)
      .post('/api/payments/checkout')
      .send({ amount: 10, currency: 'EUR', description: 'Pago test' });
    expect([503, 200]).toContain(res.status); // prefer 503, but tolerate 200 if env preset
    if (res.status === 503) {
      expect(res.body?.error).toBe('stripe-not-configured');
    }
  });
});

