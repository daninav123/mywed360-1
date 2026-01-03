import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(async () => 'test-token'),
    },
  },
  db: null,
  storage: null,
  analytics: null,
  firebaseReady: Promise.resolve(),
  getFirebaseAuth: () => null,
  isOnline: true,
}));

const okJson = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

describe('GamificationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
    try {
      window?.sessionStorage?.removeItem('maloveapp_gamification_disabled');
    } catch {}
    vi.resetModules();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173', hostname: 'localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('awardPoints llama a /api/gamification/award', async () => {
    const { awardPoints } = await import('../services/GamificationService');
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/gamification/award');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.weddingId).toBe('w1');
      expect(body.eventType).toBe('create_timeline');
      expect(String(opts?.headers?.Authorization || '')).toContain('Bearer ');
      return okJson({ success: true, result: { totalPoints: 100, level: 2 } });
    });
    const res = await awardPoints('w1', 'create_timeline', { source: 'test' });
    expect(res.success).toBe(true);
  });

  it('getStats consulta /api/gamification/stats con query', async () => {
    const { getStats } = await import('../services/GamificationService');
    fetch.mockImplementation((url) => {
      const u = new URL(String(url));
      expect(u.pathname).toContain('/api/gamification/stats');
      expect(u.searchParams.get('weddingId')).toBe('w2');
      expect(u.searchParams.get('uid')).toBe('u9');
      return okJson({ success: true, stats: { totalPoints: 50, level: 1 } });
    });
    const data = await getStats('w2', 'u9');
    expect(data.stats.totalPoints).toBe(50);
  });

  it('getAchievements consulta /api/gamification/achievements', async () => {
    const { getAchievements } = await import('../services/GamificationService');
    fetch.mockImplementation((url) => {
      const u = new URL(String(url));
      expect(u.pathname).toContain('/api/gamification/achievements');
      return okJson({ success: true, achievements: [{ id: 'a1', name: 'Primer Paso' }] });
    });
    const data = await getAchievements('w3', 'u1');
    expect(data.achievements[0].id).toBe('a1');
  });
});
