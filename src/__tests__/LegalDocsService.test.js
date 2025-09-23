import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { listTemplates, generateDocument, listDocuments } from '../services/LegalDocsService';

const okJson = (data) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) });

describe('LegalDocsService', () => {
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

  it('listTemplates devuelve plantillas', async () => {
    fetch.mockImplementation((url) => {
      expect(String(url)).toContain('/api/legal-docs/templates');
      return okJson({ success: true, templates: [{ id: 't1' }] });
    });
    const res = await listTemplates();
    expect(res).toEqual([{ id: 't1' }]);
  });

  it('generateDocument devuelve documento y envía weddingId+payload', async () => {
    fetch.mockImplementation((url, opts) => {
      expect(String(url)).toContain('/api/legal-docs/generate');
      expect(opts?.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.weddingId).toBe('w1');
      expect(body.payload).toEqual({ type: 'provider_contract', title: 'Contrato' });
      return okJson({
        success: true,
        document: { id: 'd1', pdfBase64: 'PD94bWw', meta: { title: 'Contrato' } },
      });
    });
    const doc = await generateDocument('w1', { type: 'provider_contract', title: 'Contrato' });
    expect(doc.id).toBe('d1');
    expect(doc.meta.title).toBe('Contrato');
  });

  it('listDocuments usa query params weddingId y limit', async () => {
    fetch.mockImplementation((url) => {
      const u = new URL(String(url));
      expect(u.pathname).toContain('/api/legal-docs/list');
      expect(u.searchParams.get('weddingId')).toBe('w9');
      expect(u.searchParams.get('limit')).toBe('25');
      return okJson({ success: true, documents: [{ id: 'd9' }] });
    });
    const list = await listDocuments('w9', 25);
    expect(list).toEqual([{ id: 'd9' }]);
  });
});
