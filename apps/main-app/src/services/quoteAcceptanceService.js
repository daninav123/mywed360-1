/**
 * 🤝 Servicio para gestionar aceptación de presupuestos
 */

import { getBackendUrl } from '../config';

/**
 * Acepta un presupuesto y lo añade a la boda
 */
export async function acceptQuote(quoteId, options = {}) {
  const {
    role = 'principal',
    notes = '',
    notifyProvider = true,
  } = options;

  const response = await fetch(`${getBackendUrl()}/api/quote-responses/${quoteId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role,
      notes,
      notifyProvider,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al aceptar el presupuesto');
  }

  return response.json();
}

/**
 * Cancela un proveedor previamente contratado
 */
export async function cancelProvider(quoteId, reason = '') {
  const response = await fetch(`${getBackendUrl()}/api/quote-responses/${quoteId}/cancel-provider`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cancelar el proveedor');
  }

  return response.json();
}

/**
 * Obtiene los proveedores contratados para una categoría específica
 */
export async function getCategorySuppliers(weddingId, categoryKey) {
  const response = await fetch(`${getBackendUrl()}/api/weddings/${weddingId}/services/${categoryKey}`);

  if (!response.ok) {
    throw new Error('Error al obtener proveedores de la categoría');
  }

  const data = await response.json();
  return data.suppliers || [];
}
