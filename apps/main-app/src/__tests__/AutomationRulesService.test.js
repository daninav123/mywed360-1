import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { listRules, upsertRule, evaluateTrigger } from '../services/AutomationRulesService';

const okJson = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

describe('AutomationRulesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
    // Simular entorno de navegador para getBackendBase
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173', hostname: 'localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listRules devuelve lista', async () => {
    fetch.mockImplementation((url) => {
      expect(String(url)).toContain('/api/automation/rules');
      expect(String(url)).toContain('weddingId=w1');
      return okJson({ success: true, rules: [{ id: 'r1', enabled: true }] });
    });
    const res = await listRules('w1');
    expect(res).toEqual([{ id: 'r1', enabled: true }]);
  });

  it('upsertRule hace POST y devuelve la regla guardada', async () => {
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/automation/rules');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.weddingId).toBe('w2');
      expect(body.rule).toEqual({ enabled: true });
      return okJson({ success: true, rule: { id: 'r2', enabled: true } });
    });
    const saved = await upsertRule('w2', { enabled: true });
    expect(saved).toEqual({ id: 'r2', enabled: true });
  });

  it('evaluateTrigger devuelve acciones', async () => {
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/automation/evaluate');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.trigger).toEqual({ type: 'rsvp_deadline', deadline: '2025-10-01' });
      return okJson({
        success: true,
        actions: [{ type: 'send_notification', template: 'rsvp_reminder' }],
      });
    });
    const res = await evaluateTrigger('w3', { type: 'rsvp_deadline', deadline: '2025-10-01' });
    expect(res.actions?.[0]?.type).toBe('send_notification');
  });
});
