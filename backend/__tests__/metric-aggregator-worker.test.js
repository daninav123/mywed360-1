/* @vitest-environment node */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import admin from 'firebase-admin';

// Sobrescribir el mock global de firebase-admin para este test
beforeEach(() => {
  vi.restoreAllMocks();
});

describe('metricAggregatorWorker.processMetricEvents', () => {
  it('marca eventos como processed y escribe agregados diarios', async () => {
    const ops = { sets: [], updates: [] };

    // Eventos simulados no procesados
    const events = [
      {
        id: 'e1',
        data: () => ({
          weddingId: 'w1',
          module: 'finance',
          event: 'budget_over_threshold',
          receivedAt: { toDate: () => new Date('2025-10-10T09:00:00Z') },
          processed: false,
        }),
        ref: { id: 'e1ref' },
      },
      {
        id: 'e2',
        data: () => ({
          weddingId: 'w1',
          module: 'finance',
          event: 'error_send_failed',
          receivedAt: { toDate: () => new Date('2025-10-10T10:00:00Z') },
          processed: false,
        }),
        ref: { id: 'e2ref' },
      },
    ];

    // Stub de Firestore para este test
    const collection = vi.fn((name) => {
      if (name === 'projectMetrics_events') {
        return {
          where: vi.fn(() => ({
            limit: vi.fn(() => ({ get: async () => ({ empty: false, docs: events }) })),
          })),
        };
      }
      if (name === 'projectMetrics') {
        return {
          doc: vi.fn((weddingId) => ({
            collection: vi.fn((sub) => (sub === 'modules'
              ? {
                  doc: vi.fn((mod) => ({
                    collection: vi.fn((sub2) => (sub2 === 'daily'
                      ? { doc: vi.fn((day) => ({ __path: `projectMetrics/${weddingId}/modules/${mod}/daily/${day}` })) }
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
      update: vi.fn((ref, data) => ops.updates.push({ ref, data })),
      commit: vi.fn(async () => {}),
    };

    const dbInstance = { collection, batch: () => batchObj };

    // Sustituimos admin.firestore por nuestro stub con FieldValue y Timestamp
    admin.firestore = Object.assign(
      () => dbInstance,
      {
        FieldValue: {
          serverTimestamp: () => new Date(),
          increment: (n) => ({ __inc: n }),
        },
        Timestamp: { fromDate: (d) => ({ toDate: () => d }) },
      }
    );

    const { processMetricEvents } = await import('../workers/metricAggregatorWorker.js');

    const res = await processMetricEvents(200);

    expect(res.processed).toBe(2);
    // Debe haber 2 updates (marcar processed:true)
    expect(ops.updates.length).toBe(2);
    expect(ops.updates[0].data).toMatchObject({ processed: true });
    // Debe haber 2 sets a daily (dos eventos mismo día)
    expect(ops.sets.length).toBe(2);
    // Verificar que usa increments
    const firstSet = ops.sets[0].data;
    expect(firstSet.totals.events.__inc).toBe(1);
    expect(firstSet.breakdown).toBeTruthy();
  });
});
