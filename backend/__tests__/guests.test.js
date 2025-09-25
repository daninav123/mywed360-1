import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Minimal firebase-admin mock to satisfy routes
const makeDoc = () => ({
  set: async () => undefined,
  update: async () => undefined,
  get: async () => ({ exists: false, data: () => ({}) }),
  collection: () => makeCollection(),
});
const makeCollection = () => ({
  doc: () => makeDoc(),
  where: () => ({ limit: () => ({ get: async () => ({ docs: [] }) }) }),
});

const adminMock = {
  apps: [],
  initializeApp: () => {},
  credential: { applicationDefault: () => ({}) },
  firestore: () => ({ collection: () => makeCollection(), doc: () => makeDoc() }),
  FieldValue: { serverTimestamp: () => new Date(), increment: () => 0 },
};

// Apply mock before importing the route
vi.mock('firebase-admin', () => ({ default: adminMock, ...adminMock }), { virtual: true });

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

  it('accepts invite with name (200)', async () => {
    const res = await request(app)
      .post('/api/guests/w1/invite')
      .send({ name: 'Test User', email: 'u@example.com' });
    expect(res.status).toBe(200);
    expect(res.body?.token).toBeTruthy();
    expect(res.body?.link).toContain('/rsvp/');
  });

  it('rejects invalid status on update (400)', async () => {
    const res = await request(app)
      .put('/api/guests/w1/tok')
      .send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });
});

