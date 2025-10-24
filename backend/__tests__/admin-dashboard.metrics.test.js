/* @vitest-environment node */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mockData = {};

class MockDoc {
  constructor(id, raw) {
    this.id = id;
    this._raw = raw;
  }

  data() {
    return { ...this._raw };
  }
}

const toDocs = (items = []) =>
  items.map((item, index) => {
    if (item instanceof MockDoc) return item;
    if (item && typeof item === 'object' && 'data' in item && typeof item.data === 'object' && !Array.isArray(item.data)) {
      return new MockDoc(item.id ?? `doc-${index}`, item.data);
    }
    return new MockDoc(item?.id ?? `doc-${index}`, item ?? {});
  });

const toComparable = (value) => {
  if (!value) return value;
  if (typeof value.toDate === 'function') {
    const dateValue = value.toDate();
    return dateValue instanceof Date ? dateValue.getTime() : dateValue;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return JSON.stringify(value);
};

const compareValues = (docValue, op, compareTo) => {
  if (op === '>=') {
    const left = toComparable(docValue);
    const right = toComparable(compareTo);
    if (typeof left === 'number' && typeof right === 'number') return left >= right;
    return false;
  }
  if (op === '==') {
    return JSON.stringify(docValue) === JSON.stringify(compareTo);
  }
  if (op === '!=') {
    return JSON.stringify(docValue) !== JSON.stringify(compareTo);
  }
  return true;
};

class MockQuery {
  constructor(name, supplier, docs = null) {
    this.name = name;
    this._supplier = supplier;
    this._docs = docs ?? toDocs(supplier());
  }

  where(field, op, value) {
    const filtered = this._docs.filter((doc) => {
      const data = doc.data();
      return compareValues(data[field], op, value);
    });
    return new MockQuery(this.name, this._supplier, filtered);
  }

  select() {
    return this;
  }

  orderBy() {
    return this;
  }

  limit() {
    return this;
  }

  count() {
    const total = this._docs.length;
    return {
      get: async () => ({
        data: () => ({ count: total }),
      }),
    };
  }

  async get() {
    const docs = this._docs;
    return {
      empty: docs.length === 0,
      docs,
      forEach: (cb) => docs.forEach(cb),
      size: docs.length,
    };
  }
}

const mockDb = {
  collection: vi.fn((name) => new MockQuery(name, () => mockData[name] || [])),
  collectionGroup: vi.fn((name) => new MockQuery(name, () => mockData[name] || [])),
};

vi.mock('../db.js', () => ({
  db: mockDb,
}));

const mockTimestamp = (date) => ({
  toDate: () => date,
  _seconds: Math.floor(date.getTime() / 1000),
});

vi.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    firestore: {
      Timestamp: {
        fromDate: (date) => mockTimestamp(date),
      },
      FieldValue: {
        serverTimestamp: vi.fn(() => new Date()),
      },
    },
  },
  firestore: {
    Timestamp: {
      fromDate: (date) => mockTimestamp(date),
    },
    FieldValue: {
      serverTimestamp: vi.fn(() => new Date()),
    },
  },
}));

vi.mock('../logger.js', () => ({
  __esModule: true,
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import {
  calculateStorageUsageStats,
  countDownloadsTotal,
  countDownloadsLast30d,
  aggregateWebVisitStats,
  aggregateUserGrowthMetrics,
} from '../routes/admin-dashboard.js';

const BYTES_IN_GB = 1024 ** 3;

beforeEach(() => {
  Object.keys(mockData).forEach((key) => delete mockData[key]);
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-11-01T00:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('admin dashboard aggregators', () => {
  it('calcula el uso de almacenamiento total y promedio premium', async () => {
    mockData.weddings = [
      { id: 'w1', data: { storageUsage: { bytes: 2 * BYTES_IN_GB }, plan: 'Premium Plus' } },
      { id: 'w2', data: { storage: { usageBytes: 0.5 * BYTES_IN_GB }, subscriptionPlan: 'basic' } },
      {
        id: 'w3',
        data: {
          storage: { totalBytes: 1.5 * BYTES_IN_GB },
          subscription: { currentPlan: { id: 'plan_B' } },
        },
      },
    ];

    const stats = await calculateStorageUsageStats();
    expect(stats.totalGigabytes).toBeCloseTo(4, 3);
    expect(stats.premiumAverageGigabytes).toBeCloseTo(1.75, 2);
    expect(stats.premiumCount).toBe(2);
    expect(stats.source).toBe('firestore');
  });

  it('deduplica descargas totales a través de colecciones', async () => {
    mockData.appDownloads = [
      { id: 'd1', data: { createdAt: new Date('2025-09-01') } },
      { id: 'd2', data: { createdAt: new Date('2025-10-10') } },
    ];
    mockData.appDownloadEvents = [
      { id: 'd2', data: { timestamp: new Date('2025-10-12') } },
      { id: 'd3', data: { timestamp: new Date('2025-10-15') } },
    ];
    mockData.mobileDownloads = [{ id: 'd4', data: { updatedAt: new Date('2025-10-20') } }];
    mockData.analyticsAppDownloads = [
      { id: 'd3', data: { eventAt: new Date('2025-10-25') } },
      { id: 'd5', data: { eventAt: new Date('2025-10-28') } },
    ];

    const total = await countDownloadsTotal();
    expect(total).toBe(5);
  });

  it('cuenta descargas únicas en los últimos 30 días', async () => {
    mockData.appDownloads = [
      { id: 'l1', data: { createdAt: new Date('2025-10-20') } },
      { id: 'l2', data: { createdAt: new Date('2025-09-05') } },
      { id: 'l3', data: { createdAt: new Date('2025-10-22') } },
    ];
    mockData.mobileDownloads = [
      { id: 'l3', data: { updatedAt: new Date('2025-10-18') } },
      { id: 'l4', data: { updatedAt: new Date('2025-08-01') } },
    ];

    const recent = await countDownloadsLast30d();
    expect(recent).toBe(2);
  });

  it('agrega visitas web totales y recientes', async () => {
    mockData.analyticsWebVisits = [
      { id: 'v1', data: { createdAt: new Date('2025-10-25') } },
      { id: 'v2', data: { createdAt: new Date('2025-09-15') } },
      { id: 'v3', data: { createdAt: new Date('2025-10-05') } },
    ];
    mockData.webVisits = [
      { id: 'v4', data: { visitedAt: new Date('2025-10-22') } },
      { id: 'v5', data: { visitedAt: new Date('2025-08-12') } },
    ];

    const stats = await aggregateWebVisitStats(30);
    expect(stats.totalVisits).toBe(5);
    expect(stats.newVisits).toBe(3);
    expect(stats.source).toBe('analyticsWebVisits');
    expect(stats.since).toBe('2025-10-02T00:00:00.000Z');
  });

  it('calcula crecimiento de usuarios y proporción premium', async () => {
    mockData.users = [
      { id: 'u1', data: { createdAt: new Date('2025-10-10'), plan: 'Premium Plus' } },
      { id: 'u2', data: { createdAt: new Date('2025-09-01'), subscriptionPlan: 'basic' } },
      {
        id: 'u3',
        data: {
          createdAt: new Date('2025-10-15'),
          subscription: { currentPlan: { id: 'plan_B' } },
        },
      },
      { id: 'u4', data: { createdAt: new Date('2025-10-20'), planType: 'free' } },
    ];

    const growth = await aggregateUserGrowthMetrics(30);
    expect(growth.newUsers).toBe(3);
    expect(growth.newPremiumUsers).toBe(2);
    expect(growth.newPremiumShare).toBeCloseTo(2 / 3, 5);
    expect(growth.totalUsers).toBe(4);
    expect(growth.since).toBe('2025-10-02T00:00:00.000Z');
    expect(growth.source).toBe('firestore');
  });
});
