/**
 * Configuración de la aplicación
 */

/**
 * Obtiene la URL base del backend según el entorno
 */
export function getBackendUrl() {
  // En desarrollo
  if (import.meta.env.DEV) {
    return 'http://localhost:4004';
  }
  
  // En producción, usar la variable de entorno o la URL actual
  return import.meta.env.VITE_BACKEND_URL || window.location.origin;
}

/**
 * Obtiene la URL completa de un endpoint del backend
 * @param {string} path - Ruta del endpoint (ej: '/api/users')
 */
export function getBackendEndpoint(path) {
  const baseUrl = getBackendUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export default {
  getBackendUrl,
  getBackendEndpoint,
};
