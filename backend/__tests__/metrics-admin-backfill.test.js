/* @vitest-environment node */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import admin from 'firebase-admin';
import metricsAdminRouter from '../routes/metrics-admin.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Admin Metrics Backfill', () => {
  it('POST /api/admin/metrics/backfill agrega series diarias desde eventos', async () => {
    const ops = { sets: [], commits: 0 };

    // Eventos con eventAt (>= startTs)
    const eventsWithEventAt = [
      {
        id: 'a1',
        data: () => ({
          weddingId: 'w1',
          module: 'finance',
          event: 'email_bounced',
          eventAt: { toDate: () => new Date('2025-10-10T08:00:00Z') },
        }),
      },
    ];
    // Eventos sin eventAt (usa receivedAt)
    const eventsWithoutEventAt = [
      {
        id: 'b1',
        data: () => ({
          weddingId: 'w1',
          module: 'finance',
          event: 'budget_over_threshold',
          receivedAt: { toDate: () => new Date('2025-10-10T09:00:00Z') },
        }),
      },
    ];

    const makeEventsQuery = () => {
      let lastOp = null;
      const api = {
        where: (field, op, _val) => {
          if (field === 'eventAt') lastOp = op === '==' ? 'null' : 'gte';
          return api;
        },
        get: async () => (lastOp === 'null' ? { docs: eventsWithoutEventAt } : { docs: eventsWithEventAt }),
      };
      return api;
    };

    const collection = vi.fn((name) => {
      if (name === 'projectMetrics_events') {
        return makeEventsQuery();
      }
      if (name === 'projectMetrics') {
        return {
          doc: vi.fn((weddingId) => ({
            collection: vi.fn((sub) => (sub === 'modules'
              ? {
                  doc: vi.fn((mod) => ({
                    collection: vi.fn((sub2) => (sub2 === 'daily'
                      ? {
                          doc: vi.fn((day) => ({ __path: `projectMetrics/${weddingId}/modules/${mod}/daily/${day}` })),
                        }
                      : {})),
                  })),
                }
              : {})),
          })),
        };
      }
      return {};
    });

    const batchObj = {
      set: vi.fn((ref, data, opts) => ops.sets.push({ ref, data, opts })),
      commit: vi.fn(async () => { ops.commits += 1; }),
    };

    const dbInstance = { collection, batch: () => batchObj };

    admin.firestore = Object.assign(
      () => dbInstance,
      {
        FieldValue: { serverTimestamp: () => new Date() },
      }
    );

    const app = express();
    app.use(express.json());
    app.use('/api/admin/metrics', metricsAdminRouter);

    const res = await request(app)
      .post('/api/admin/metrics/backfill')
      .send({ module: 'finance', days: 7 })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(ops.sets.length).toBe(1);
    const payload = ops.sets[0].data;
    expect(payload.totals.events).toBe(2);
    expect(payload.totals.alerts).toBe(1);
    expect(payload.totals.errors).toBe(1);
    expect(typeof payload.metadata.computedAt).toBe('object');
  });
});
