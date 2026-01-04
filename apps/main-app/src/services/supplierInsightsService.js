/**
 * Supplier Insights Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function fetchSupplierInsights(supplierId) {
  if (!supplierId) return null;
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/supplier-insights/${supplierId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return null;
    const result = await response.json();
    return result.insights || result.data;
  } catch {
    return null;
  }
}

export async function recordSupplierInsight({
  supplierId,
  weddingId,
  service,
  budget,
  responseTimeMinutes,
  satisfaction,
  status,
}) {
  if (!supplierId) return;
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/supplier-insights`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supplierId,
        weddingId,
        service,
        budget,
        responseTimeMinutes,
        satisfaction,
        status,
      })
    });
  } catch (error) {
    console.error('Error recording insight:', error);
  }
}
