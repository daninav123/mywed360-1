const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function getProtocolTexts(weddingId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/protocol-texts/${weddingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return {};
    const result = await response.json();
    return result.texts || result.data || {};
  } catch { return {}; }
}

export async function saveProtocolTexts(weddingId, texts) {
  const token = localStorage.getItem('authToken');
  await fetch(`${API_URL}/api/protocol-texts/${weddingId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(texts)
  });
}
