// SignatureService.js - Cliente frontend para /api/signature
import { getBackendBase } from '../utils/backendBase';
import { auth } from '../firebaseConfig';

const base = () => `${getBackendBase()}/api/signature`;

async function getAuthToken() {
  try {
    const user = auth?.currentUser;
    if (user?.getIdToken) {
      return await user.getIdToken();
    }
    const profile = JSON.parse(localStorage.getItem('lovendaProfile') || '{}');
    if (profile?.email || profile?.account?.email) {
      const uid = profile?.uid || 'local';
      const email = profile?.email || profile?.account?.email;
      return `mock-${uid}-${email}`;
    }
  } catch (_) {}
  return null;
}

async function authHeader(extra = {}) {
  const token = await getAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export async function createSignatureRequest(weddingId, documentMeta, signers = []) {
  const res = await fetch(`${base()}/create`, {
    method: 'POST',
    headers: await authHeader({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ weddingId, documentMeta, signers })
  });
  if (!res.ok) throw new Error('createSignatureRequest failed');
  return res.json();
}

export async function listSignatureRequests(weddingId, limit = 50) {
  const url = new URL(`${base()}/list`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (limit) url.searchParams.set('limit', String(limit));
  const res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  if (!res.ok) throw new Error('listSignatureRequests failed');
  return res.json();
}

export async function getSignatureStatus(weddingId, signatureId) {
  const url = new URL(`${base()}/status/${signatureId}`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  const res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  if (!res.ok) throw new Error('getSignatureStatus failed');
  return res.json();
}

export async function updateSignatureStatus(weddingId, signatureId, updates) {
  const res = await fetch(`${base()}/status/${signatureId}`, {
    method: 'POST',
    headers: await authHeader({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ weddingId, updates })
  });
  if (!res.ok) throw new Error('updateSignatureStatus failed');
  return res.json();
}
