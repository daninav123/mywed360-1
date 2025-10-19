import express from 'express';
import request from 'supertest';
import admin from 'firebase-admin';
import projectMetricsRouter from '../routes/project-metrics.js';

function makeApp(withAuth = false) {
  const app = express();
  app.use(express.json());
  if (withAuth) {
    app.use((req, _res, next) => {
      req.user = { uid: 'user1' };
      next();
    });
  }
  app.use('/api/project-metrics', projectMetricsRouter);
  return app;
}

function stubFirestoreForPost(capture = { last: null }) {
  const add = vi.fn(async (doc) => { capture.last = doc; return { id: 'evt1' }; });
  const collection = vi.fn((name) => {
    if (name === 'projectMetrics_events') {
      return { add };
    }
    return { add: vi.fn(async () => ({ id: 'x' })) };
  });
  admin.firestore = Object.assign(
    () => ({ collection }),
    {
      FieldValue: { serverTimestamp: () => new Date() },
      Timestamp: { fromDate: (d) => d },
    }
  );
  return { add, capture };
}

function stubFirestoreForGet({ points = [] } = {}) {
  const weddingData = {
    ownerIds: ['user1'],
    plannerIds: [],
    assistantIds: [],
  };
  const dailyDocs = points.map((p) => ({ id: p.date, data: () => ({ totals: { ...p.totals } }) }));

  const dailyCol = {
    orderBy: () => ({ startAt: () => ({ endAt: () => ({ get: async () => ({ docs: dailyDocs }) }) }) }),
    get: async () => ({ docs: dailyDocs }),
  };

  const modulesDoc = { collection: (sub) => (sub === 'daily' ? dailyCol : {}) };
  const modulesCol = { doc: () => modulesDoc };
  const projectMetricsDoc = { collection: (sub) => (sub === 'modules' ? modulesCol : {}) };
  const projectMetricsCol = { doc: () => projectMetricsDoc };

  const weddingsCol = {
    doc: () => ({ get: async () => ({ exists: true, data: () => weddingData }) }),
  };

  const collection = vi.fn((name) => {
    if (name === 'weddings') return weddingsCol;
    if (name === 'projectMetrics') return projectMetricsCol;
    return {};
  });

  admin.firestore = () => ({ collection });
}

function stubFirestoreForGetForbidden() {
  const weddingData = {
    ownerIds: ['other'],
    plannerIds: [],
    assistantIds: [],
  };
  const weddingsCol = {
    doc: () => ({ get: async () => ({ exists: true, data: () => weddingData }) }),
  };
  const collection = vi.fn((name) => {
    if (name === 'weddings') return weddingsCol;
    return {};
  });
  admin.firestore = () => ({ collection });
}

describe('Project Metrics API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('POST /api/project-metrics - valida payload y responde 202 con processed:false', async () => {
    const { add, capture } = stubFirestoreForPost();
    const app = makeApp();
    const res = await request(app)
      .post('/api/project-metrics')
      .send({ weddingId: 'w123', module: 'finance', event: 'budget_over_threshold' })
      .expect(202);
    expect(res.body.success).toBe(true);
    expect(add).toHaveBeenCalledTimes(1);
    expect(capture.last && capture.last.processed).toBe(false);
  });

  test('POST /api/project-metrics - 400 si payload inválido', async () => {
    stubFirestoreForPost();
    const app = makeApp();
    const res = await request(app).post('/api/project-metrics').send({}).expect(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/project-metrics - 400 si faltan params', async () => {
    stubFirestoreForGet({ points: [] });
    const app = makeApp(true);
    const res = await request(app).get('/api/project-metrics').expect(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/project-metrics - 200 y puntos diarios cuando usuario pertenece a la boda', async () => {
    stubFirestoreForGet({ points: [ { date: '2025-10-08', totals: { events: 3, alerts: 1 } } ] });
    const app = makeApp(true);
    const res = await request(app)
      .get('/api/project-metrics')
      .query({ weddingId: 'w123', module: 'finance', range: '7d', groupBy: 'daily' })
      .expect(200);
    expect(Array.isArray(res.body.points)).toBe(true);
    expect(res.body.points[0].date).toBe('2025-10-08');
    expect(res.body.points[0].events).toBe(3);
    expect(res.body.points[0].alerts).toBe(1);
  });

  test('GET /api/project-metrics - 403 si usuario no pertenece a la boda', async () => {
    stubFirestoreForGetForbidden();
    const app = makeApp(true);
    const res = await request(app)
      .get('/api/project-metrics')
      .query({ weddingId: 'w999', module: 'finance', range: '7d', groupBy: 'daily' })
      .expect(403);
    expect(res.body.success).toBe(false);
  });
});
