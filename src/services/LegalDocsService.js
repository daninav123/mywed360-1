// LegalDocsService.js - Cliente frontend para /api/legal-docs
import { getBackendBase } from '../utils/backendBase';

const base = () => `${getBackendBase()}/api/legal-docs`;

export async function listTemplates() {
  const res = await fetch(`${base()}/templates`, { credentials: 'include' });
  if (!res.ok) throw new Error('templates failed');
  const data = await res.json();
  return data.templates || [];
}

export async function generateDocument(weddingId, payload, { saveMeta = true } = {}) {
  const res = await fetch(`${base()}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ weddingId, payload, saveMeta })
  });
  if (!res.ok) throw new Error('generate failed');
  const data = await res.json();
  return data.document; // { id, pdfBase64, meta }
}

export async function listDocuments(weddingId, limit = 50) {
  const url = new URL(`${base()}/list`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (limit) url.searchParams.set('limit', String(limit));
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('list docs failed');
  const data = await res.json();
  return data.documents || [];
}
