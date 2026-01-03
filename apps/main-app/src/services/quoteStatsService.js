import { auth } from '../firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Obtener token de autenticación
 */
async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

/**
 * Obtener estadísticas de presupuestos por categoría
 */
export async function getCategoryStats(category) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/api/quote-stats/category/${category}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[quoteStatsService] Error obteniendo stats de categoría:', error);
    throw error;
  }
}

/**
 * Obtener resumen de todas las categorías
 */
export async function getOverviewStats() {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/api/quote-stats/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[quoteStatsService] Error obteniendo overview:', error);
    throw error;
  }
}
