import { get } from './apiClient';

export async function fetchProviderStatus(providerId) {
  if (!providerId) throw new Error('providerId required');
  const res = await get(`/api/providers/${encodeURIComponent(String(providerId))}/status`, { auth: true });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

