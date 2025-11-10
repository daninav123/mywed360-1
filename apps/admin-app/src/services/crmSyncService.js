import { getBackendBase } from '../utils/backendBase';

const baseUrl = () => `${getBackendBase()}/api/crm`;

export async function syncWeddingWithCRM(weddingId, payload = {}) {
  if (!weddingId) throw new Error('weddingId requerido');
  const res = await fetch(`${baseUrl()}/sync-wedding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ weddingId, payload }),
  });
  if (!res.ok) {
    const error = await safeJson(res);
    const message = error?.error?.message || `syncWeddingWithCRM failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

export async function bulkSyncWeddings(weddingIds = [], context = {}) {
  const ids = Array.isArray(weddingIds) ? weddingIds.filter(Boolean) : [];
  if (!ids.length) return { queued: [] };
  const res = await fetch(`${baseUrl()}/sync-weddings/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ weddingIds: ids, context }),
  });
  if (!res.ok) {
    const error = await safeJson(res);
    const message = error?.error?.message || `bulkSyncWeddings failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

