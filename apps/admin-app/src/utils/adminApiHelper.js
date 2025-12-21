import { auth } from '../firebaseConfig';
import { getAdminFetchOptions } from '../services/adminSession';

/**
 * Helper para obtener opciones de fetch con token Firebase para llamadas admin
 * @param {Object} extraOptions - Opciones adicionales
 * @returns {Promise<Object>} Opciones de fetch con token
 */
export async function getAuthenticatedAdminOptions(extraOptions = {}) {
  const baseOptions = getAdminFetchOptions({ auth: false, silent: true, ...extraOptions });
  
  try {
    const currentUser = auth?.currentUser;
    if (currentUser && typeof currentUser.getIdToken === 'function') {
      const token = await currentUser.getIdToken(false);
      return {
        ...baseOptions,
        headers: {
          ...(baseOptions.headers || {}),
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
        },
      };
    }
  } catch (error) {
    console.warn('[adminApiHelper] Error obteniendo token Firebase:', error);
  }
  
  return baseOptions;
}

/**
 * Obtiene el token Firebase del usuario actual
 * @param {boolean} forceRefresh - Forzar refresh del token
 * @returns {Promise<string|null>} Token o null
 */
export async function getFirebaseIdToken(forceRefresh = false) {
  try {
    const currentUser = auth?.currentUser;
    if (currentUser && typeof currentUser.getIdToken === 'function') {
      return await currentUser.getIdToken(forceRefresh);
    }
  } catch (error) {
    console.warn('[adminApiHelper] Error obteniendo token:', error);
  }
  return null;
}
