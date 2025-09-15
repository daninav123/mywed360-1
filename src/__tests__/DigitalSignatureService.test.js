import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequest, getStatus } from '../services/DigitalSignatureService';

const okJson = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

describe('DigitalSignatureService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5173', hostname: 'localhost' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createRequest hace POST a /api/signature/request con payload', async () => {
    const payload = { documentId: 'd1', signers: [{ email: 'a@b.com', name: 'A' }] };
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/signature/request');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.documentId).toBe('d1');
      return okJson({ success: true, requestId: 'r1' });
    });
    const res = await createRequest(payload);
    expect(res.success).toBe(true);
    expect(res.requestId).toBe('r1');
  });

  it('getStatus consulta /api/signature/status con query documentId', async () => {
    fetch.mockImplementation((url) => {
      const u = new URL(String(url));
      expect(u.pathname).toContain('/api/signature/status');
      expect(u.searchParams.get('documentId')).toBe('d2');
      return okJson({ success: true, signature: { status: 'requested' } });
    });
    const res = await getStatus('d2');
    expect(res.signature.status).toBe('requested');
  });
});

