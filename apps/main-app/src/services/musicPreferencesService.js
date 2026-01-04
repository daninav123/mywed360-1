const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function getMusicPreferences(weddingId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/music-preferences/${weddingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.preferences || result.data;
  } catch { return null; }
}

export async function saveMusicPreferences(weddingId, preferences) {
  const token = localStorage.getItem('authToken');
  await fetch(`${API_URL}/api/music-preferences/${weddingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preferences)
  });
}
