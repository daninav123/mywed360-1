const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function sendBulkRFQ(weddingId, suppliers, message) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/api/bulk-rfq`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ weddingId, suppliers, message })
  });
  if (!response.ok) throw new Error('Error sending bulk RFQ');
  return response.json();
}

export async function trackBulkRFQ(weddingId, batchId) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/api/bulk-rfq/${batchId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const result = await response.json();
  return result.status || result.data;
}
