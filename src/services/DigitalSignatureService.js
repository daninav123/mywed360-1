// DigitalSignatureService.js - Cliente frontend para /api/signature (DocuSign/HelloSign proxy)
import { getBackendBase } from '../utils/backendBase';

const base = () => `${getBackendBase()}/api/signature`;

export async function createRequest(payload) {
  const res = await fetch(`${base()}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('signature request failed');
  return res.json();
}

export async function getStatus(documentId) {
  const url = new URL(`${base()}/status`);
  if (documentId) url.searchParams.set('documentId', documentId);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('signature status failed');
  return res.json();
}

// named exports already declared above
