/**
 * Utilidades de autenticación para proveedores
 */

/**
 * Obtiene el token de autenticación del proveedor
 */
export function getSupplierToken() {
  return localStorage.getItem('supplier_token');
}

/**
 * Obtiene el ID del proveedor autenticado
 */
export function getSupplierId() {
  return localStorage.getItem('supplier_id');
}

/**
 * Obtiene los datos del proveedor autenticado
 */
export function getSupplierData() {
  const data = localStorage.getItem('supplier_data');
  return data ? JSON.parse(data) : null;
}

/**
 * Verifica si el proveedor está autenticado
 */
export function isSupplierAuthenticated() {
  const token = getSupplierToken();
  const supplierId = getSupplierId();
  return !!(token && supplierId && token !== 'null' && token !== 'undefined');
}

/**
 * Cierra la sesión del proveedor
 */
export function logoutSupplier() {
  localStorage.removeItem('supplier_token');
  localStorage.removeItem('supplier_id');
  localStorage.removeItem('supplier_data');
}

/**
 * Crea headers de autenticación para peticiones HTTP
 */
export function getSupplierAuthHeaders() {
  const token = getSupplierToken();
  const supplierId = getSupplierId();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (supplierId && supplierId !== 'null' && supplierId !== 'undefined') {
    headers['x-supplier-id'] = supplierId;
  }

  return headers;
}

/**
 * Realiza una petición autenticada como proveedor
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
export async function supplierFetch(url, options = {}) {
  const authHeaders = getSupplierAuthHeaders();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });

  // Si es 401, limpiar sesión y redirigir
  if (response.status === 401) {
    logoutSupplier();
    window.location.href = '/supplier/login';
  }

  return response;
}
