import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-functions to return raw handlers
vi.mock('firebase-functions', () => ({
  https: { onRequest: (fn) => fn },
  pubsub: { schedule: () => ({ timeZone: () => ({ onRun: () => vi.fn() }) }) },
  config: () => ({}),
}), { virtual: true });

// Mock firebase-admin: only auth.verifyIdToken used here
const adminMock = {
  apps: [],
  initializeApp: vi.fn(),
  auth: () => ({ verifyIdToken: vi.fn(async () => ({ uid: 'uid', email: 'u@e' })) }),
  firestore: vi.fn(() => ({
    batch: () => ({ set: vi.fn(), commit: vi.fn() }),
  })),
};
vi.mock('firebase-admin', () => ({
  ...adminMock,
  default: adminMock,
}), { virtual: true });

function callHandler(handler, { method = 'POST', headers = {}, body = {} } = {}) {
  return new Promise((resolve) => {
    const req = { method, headers, body };
    const res = {
      statusCode: 200,
      headers: {},
      set: vi.fn(),
      setHeader: vi.fn((k, v) => { res.headers[k] = v; }),
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode || 200, body: payload, headers: this.headers }); },
      send(payload) { resolve({ status: this.statusCode || 200, body: payload, headers: this.headers }); },
    };
    handler(req, res);
  });
}

describe('sendEmail CORS and auth', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_MOCK_TOKENS = 'true';
    process.env.MAILGUN_API_KEY = 'test';
    process.env.MAILGUN_DOMAIN = 'maloveapp.com';
    process.env.MAILGUN_BASE_URL = 'https://api.mailgun.net/v3';
  });

  it('returns 401 without Authorization', async () => {
    const mod = await import('../index.js');
    const handler = mod.sendEmail;
    const res = await callHandler(handler, { method: 'POST', headers: { origin: 'http://localhost:5173' }, body: {} });
    expect(res.status).toBe(401);
  });

  it('succeeds without attachments and posts to Mailgun', async () => {
    const fetchSpy = vi.fn(async (url, init) => {
      // Only one fetch call (to Mailgun messages)
      return { ok: true, json: async () => ({ id: 'msg1', url, method: init?.method }) };
    });
    globalThis.fetch = fetchSpy;
    const mod = await import('../index.js');
    const handler = mod.sendEmail;
    const res = await callHandler(handler, {
      method: 'POST',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      body: { from: 'a@maloveapp.com', to: 'b@maloveapp.com', subject: 's', body: 'hi' },
    });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toMatch(/\/mywed360\.com\/messages$/);
  });

  it('downloads attachment from URL and posts to Mailgun', async () => {
    const fetchSpy = vi.fn(async (url, init) => {
      if (typeof url === 'string' && url.startsWith('http') && !/\/messages$/.test(url)) {
        // Attachment download
        return { ok: true, headers: { get: () => null }, arrayBuffer: async () => new Uint8Array([1,2,3]).buffer };
      }
      // Mailgun post
      return { ok: true, json: async () => ({ id: 'msg2' }) };
    });
    globalThis.fetch = fetchSpy;
    const mod = await import('../index.js');
    const handler = mod.sendEmail;
    const res = await callHandler(handler, {
      method: 'POST',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      body: {
        from: 'a@maloveapp.com', to: 'b@maloveapp.com', subject: 's', html: '<b>hi</b>',
        attachments: [{ url: 'https://example.com/file.pdf', filename: 'f.pdf' }],
      },
    });
    expect(res.status).toBe(200);
    // two calls: one to download attachment, one to Mailgun
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips disallowed MIME and still sends', async () => {
    const fetchSpy = vi.fn(async (url, init) => {
      if (typeof url === 'string' && url.startsWith('http') && !/\/messages$/.test(url)) {
        // simulate disallowed content-type
        return { ok: true, headers: { get: (k) => (k.toLowerCase() === 'content-type' ? 'application/x-msdownload' : null) }, arrayBuffer: async () => new Uint8Array([1,2,3]).buffer };
      }
      return { ok: true, json: async () => ({ id: 'msgX' }) };
    });
    globalThis.fetch = fetchSpy;
    const mod = await import('../index.js');
    const handler = mod.sendEmail;
    const res = await callHandler(handler, {
      method: 'POST',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      body: {
        from: 'a@maloveapp.com', to: 'b@maloveapp.com', subject: 's', html: '<b>hi</b>',
        attachments: [{ url: 'https://example.com/bad.exe', filename: 'bad.exe' }],
      },
    });
    expect(res.status).toBe(200);
    // two calls: download + messages
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips attachment exceeding size limit and still sends', async () => {
    process.env.EMAIL_ATTACHMENT_MAX_BYTES = '50'; // very small
    const bigBuf = new Uint8Array(200).buffer;
    const fetchSpy = vi.fn(async (url, init) => {
      if (typeof url === 'string' && url.startsWith('http') && !/\/messages$/.test(url)) {
        return {
          ok: true,
          headers: { get: (k) => (k.toLowerCase() === 'content-length' ? '200' : null) },
          arrayBuffer: async () => bigBuf,
        };
      }
      return { ok: true, json: async () => ({ id: 'msg3' }) };
    });
    globalThis.fetch = fetchSpy;
    const mod = await import('../index.js');
    const handler = mod.sendEmail;
    const res = await callHandler(handler, {
      method: 'POST',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      body: {
        from: 'a@maloveapp.com', to: 'b@maloveapp.com', subject: 's', html: '<b>hi</b>',
        attachments: [{ url: 'https://example.com/too-big.bin', filename: 'big.bin' }],
      },
    });
    expect(res.status).toBe(200);
    // should attempt to download and then still post to Mailgun
    expect(fetchSpy.mock.calls.some(([u]) => /too-big\.bin/.test(String(u)))).toBe(true);
    expect(fetchSpy.mock.calls.some(([u]) => /\/messages$/.test(String(u)))).toBe(true);
  });

  it('aborts attachment download on timeout and still sends', async () => {
    process.env.EMAIL_ATTACHMENT_TIMEOUT_MS = '50';
    const fetchSpy = vi.fn((url, init) => {
      if (typeof url === 'string' && url.startsWith('http') && !/\/messages$/.test(url)) {
        // never resolves, but will reject on abort
        return new Promise((resolve, reject) => {
          if (init && init.signal && typeof init.signal.addEventListener === 'function') {
            init.signal.addEventListener('abort', () => reject(new Error('AbortError')));
          }
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ id: 'msg4' }) });
    });
    globalThis.fetch = fetchSpy;
    const mod = await import('../index.js');
    const handler = mod.sendEmail;
    const res = await callHandler(handler, {
      method: 'POST',
      headers: { origin: 'http://localhost:5173', Authorization: 'Bearer mock-uid-u@e' },
      body: {
        from: 'a@maloveapp.com', to: 'b@maloveapp.com', subject: 's', body: 'hi',
        attachments: [{ url: 'https://example.com/file-timeout.bin', filename: 't.bin' }],
      },
    });
    expect(res.status).toBe(200);
    // called at least twice: one for download, one for Mailgun
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(fetchSpy.mock.calls.some(([u]) => /file-timeout\.bin/.test(String(u)))).toBe(true);
    expect(fetchSpy.mock.calls.some(([u]) => /\/messages$/.test(String(u)))).toBe(true);
  });
});
