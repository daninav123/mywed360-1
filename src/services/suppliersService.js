// services/suppliersService.js
// Servicio para búsqueda híbrida de proveedores (Fase 2)

/**
 * Buscar proveedores con el nuevo sistema híbrido
 * Primero busca en BD (registrados + cache), luego complementa con Tavily
 */
export async function searchSuppliersHybrid(service, location, query = '', budget = null, filters = {}) {
  try {
    const response = await fetch('/api/suppliers/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        service,
        location,
        query,
        budget,
        filters
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en búsqueda');
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error en búsqueda híbrida:', error);
    throw error;
  }
}

/**
 * Registrar acción de usuario (view, click, contact)
 */
export async function trackSupplierAction(supplierId, action, userId = null) {
  try {
    await fetch(`/api/suppliers/${supplierId}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action,
        userId
      })
    });
  } catch (error) {
    // No propagar error, es tracking
    console.warn('Error tracking action:', error);
  }
}

/**
 * Obtener detalles de un proveedor
 */
export async function getSupplierDetails(supplierId) {
  try {
    const response = await fetch(`/api/suppliers/${supplierId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Proveedor no encontrado');
    }

    const data = await response.json();
    return data.supplier;
    
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    throw error;
  }
}

/**
 * [LEGACY] Búsqueda con Tavily (mantener para compatibilidad)
 */
export async function searchSuppliersTavily(query, location, budget, service) {
  try {
    const response = await fetch('/api/ai-suppliers-tavily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query,
        location,
        budget,
        service
      })
    });

    if (!response.ok) {
      throw new Error('Error en búsqueda Tavily');
    }

    return await response.json();
    
  } catch (error) {
    console.error('Error en Tavily:', error);
    throw error;
  }
}
