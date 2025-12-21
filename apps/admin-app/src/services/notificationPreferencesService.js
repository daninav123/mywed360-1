import { apiGet, apiPut, buildAuthHeaders } from './apiClient';

export async function getNotificationPreferences(user) {
  const headers = buildAuthHeaders(user);
  return apiGet('/api/notification-preferences', headers);
}

export async function saveNotificationPreferences(user, prefs) {
  const headers = buildAuthHeaders(user);
  return apiPut('/api/notification-preferences', prefs, headers);
}


