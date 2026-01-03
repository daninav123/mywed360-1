import { apiGet, apiPost, buildAuthHeaders } from './apiClient';

export async function listEmailTemplates(user) {
  const headers = buildAuthHeaders(user);
  return apiGet('/api/email-templates', headers);
}

export async function saveEmailTemplate(user, { id, name, subject, body, category }) {
  const headers = buildAuthHeaders(user);
  return apiPost('/api/email-templates', { id, name, subject, body, category }, headers);
}


