import { apiPost } from './apiClient';

export async function requestBudgetAdvisor(payload, options = {}) {
  const res = await apiPost('/api/ai/budget-advisor', payload, { ...(options || {}), auth: true });
  if (!res.ok) {
    let details = null;
    try {
      details = await res.json();
    } catch (_) {}
    const error = new Error(details?.message || details?.error || 'No se pudo obtener la recomendación del consejero');
    error.code = details?.error || res.status;
    error.traceId = details?.traceId || null;
    error.details = details?.details || null;
    throw error;
  }
  return res.json();
}
