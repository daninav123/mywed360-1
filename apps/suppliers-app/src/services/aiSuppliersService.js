import { apiPost, buildAuthHeaders } from './apiClient';

export async function compareSuppliers(user, providers, criteria = {}, context = {}) {
  const headers = buildAuthHeaders(user);
  return apiPost('/api/ai-suppliers/compare', { providers, criteria, context }, headers);
}

