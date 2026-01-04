/**
 * Email Metrics Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function getAggregatedStats(userId) {
  if (!userId) return null;
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/email-metrics/${userId}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return null;
    const result = await response.json();
    return result.stats || result.data;
  } catch {
    return null;
  }
}

export async function getDailyStats(userId, days = 30) {
  if (!userId) return [];
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/email-metrics/${userId}/daily?days=${days}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.stats || result.data || [];
  } catch {
    return [];
  }
}
