import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('guests routes validation', () => {
  let app;
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    const guestsRouter = (await import('../routes/guests.js')).default;
    app.use('/api/guests', guestsRouter);
  });

  it('rejects invite without name (400)', async () => {
    const res = await request(app).post('/api/guests/w1/invite').send({});
    expect(res.status).toBe(400);
    expect(res.body?.error?.code || res.body?.error).toBeDefined();
  });

  it('accepts invite with name (201)', async () => {
    const res = await request(app)
      .post('/api/guests/w1/invite')
      .send({ name: 'Test User', email: 'u@example.com' });
    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.token).toBeTruthy();
    expect(res.body?.data?.link).toContain('/rsvp/');
  });

  it('rejects invalid status on update (400)', async () => {
    const res = await request(app)
      .put('/api/guests/w1/tok')
      .send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });
});

