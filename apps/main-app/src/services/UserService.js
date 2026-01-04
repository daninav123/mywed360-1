/**
 * User Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function getUserByEmail(email) {
  if (!email) return null;
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/users/by-email/${encodeURIComponent(email.toLowerCase())}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return null;
    
    const result = await response.json();
    return result.user || result.data || null;
  } catch {
    return null;
  }
}
