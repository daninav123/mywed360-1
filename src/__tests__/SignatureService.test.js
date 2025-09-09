import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSignatureRequest, listSignatureRequests, getSignatureStatus, updateSignatureStatus } from '../services/SignatureService';

const okJson = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

describe('SignatureService', () => {
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

  it('createSignatureRequest hace POST a /api/signature/create', async () => {
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/signature/create');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.weddingId).toBe('w1');
      expect(body.documentMeta?.title).toBe('Contrato');
      return okJson({ success: true, request: { id: 'sig_1', status: 'pending' } });
    });
    const res = await createSignatureRequest('w1', { id: 'd1', title: 'Contrato' }, [{ email: 'a@b.com', name: 'A' }]);
    expect(res.success).toBe(true);
  });

  it('listSignatureRequests llama /api/signature/list con query', async () => {
    fetch.mockImplementation((url) => {
      const u = new URL(String(url));
      expect(u.pathname).toContain('/api/signature/list');
      expect(u.searchParams.get('weddingId')).toBe('w2');
      expect(u.searchParams.get('limit')).toBe('10');
      return okJson({ success: true, signatures: [{ id: 's1' }] });
    });
    const data = await listSignatureRequests('w2', 10);
    expect(data.signatures?.length).toBe(1);
  });

  it('getSignatureStatus llama /api/signature/status/:id', async () => {
    fetch.mockImplementation((url) => {
      const u = new URL(String(url));
      expect(u.pathname).toContain('/api/signature/status/s1');
      expect(u.searchParams.get('weddingId')).toBe('w3');
      return okJson({ success: true, status: { id: 's1', status: 'pending' } });
    });
    const data = await getSignatureStatus('w3', 's1');
    expect(data.status?.id).toBe('s1');
  });

  it('updateSignatureStatus hace POST /api/signature/status/:id', async () => {
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/signature/status/s1');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.weddingId).toBe('w4');
      expect(body.updates).toEqual({ status: 'completed' });
      return okJson({ success: true, status: { id: 's1', status: 'completed' } });
    });
    const data = await updateSignatureStatus('w4', 's1', { status: 'completed' });
    expect(data.status?.status).toBe('completed');
  });
});
