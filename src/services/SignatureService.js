// SignatureService.js - Cliente frontend para /api/signature
import i18n from '../i18n';
import { auth } from '../firebaseConfig';
import { getBackendBase } from '../utils/backendBase';

const base = () => `${getBackendBase()}/api/signature`;

async function getAuthToken() {
  try {
    const user = auth?.currentUser;
    if (!user?.getIdToken) {
      throw new Error(i18n.t('common.signatureservice_autenticacion_requerida'));
    }
    try {
      return await user.getIdToken(true);
    } catch (err) {
      console.warn('[SignatureService] Error refrescando token, usando cache:', err);
      return await user.getIdToken();
    }
  } catch (error) {
    throw new Error(error?.message || i18n.t('common.signatureservice_pudo_obtener_token_autenticacion'));
  }
}

async function authHeader(extra = {}) {
  const token = await getAuthToken();
  return { ...extra, Authorization: `Bearer ${token}` };
}

export async function createSignatureRequest(weddingId, documentMeta, signers = []) {
  const res = await fetch(`${base()}/create`, {
    method: 'POST',
    headers: await authHeader({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ weddingId, documentMeta, signers }),
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
    body: JSON.stringify({ weddingId, updates }),
  });
  if (!res.ok) throw new Error('updateSignatureStatus failed');
  return res.json();
}
