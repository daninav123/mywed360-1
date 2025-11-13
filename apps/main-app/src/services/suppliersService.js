// services/suppliersService.js
// Servicio para búsqueda híbrida de proveedores (Fase 2)

import { db, auth } from '../firebaseConfig';
import { classifySuppliers } from './supplierCategoryClassifier';
import { searchGooglePlaces } from './webSearchService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

/**
 * Buscar proveedores con el nuevo sistema híbrido
 * Primero busca en BD (registrados + cache), luego complementa con Tavily
 */
export async function searchSuppliersHybrid(
  service,
  location,
  query = '',
  budget = null,
  filters = {}
) {
  const normalizeInput = (value, fallback = '') => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || fallback;
    }

    if (value && typeof value === 'object') {
      const candidates = [
        value.city,
        value.location, // Añadido
        value.name,
        value.label,
        value.value,
        value.address, // Añadido
        value.provincia, // Añadido para España
        value.comunidad, // Añadido para España
      ];
      for (const candidate of candidates) {
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed) return trimmed;
        }
      }
      // Si no encontramos nada, devolver fallback en lugar de [object Object]
      return fallback;
    }

    if (value == null) return fallback;

    // Última opción: solo si es primitivo convertir a string
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value).trim() || fallback;
    }

    return fallback;
  };

  try {
    // Obtener token de Firebase Auth
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      service: normalizeInput(service),
      location: normalizeInput(location),
      query: typeof query === 'string' ? query.trim() : '',
      budget,
      filters: filters && typeof filters === 'object' ? filters : {},
    };

    // console.log('🔍 [searchSuppliersHybrid] Iniciando búsqueda:', payload);
    const startTime = Date.now();

    // ⭐ NUEVO: Timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      // console.log('⏱️ [searchSuppliersHybrid] Búsqueda abortada por timeout (30s)');
    }, 30000);

    try {
      // 1. Llamar al backend (Firestore + Tavily)
      const backendPromise = fetch('/api/suppliers/search', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // 2. Llamar a Google Places en paralelo (si hay query)
      let googlePlacesPromise = Promise.resolve({ results: [] });
      const searchQuery = payload.query;
      const searchLocation = payload.location;
      const searchService = payload.service;
      
      // console.log(`🔎 [searchSuppliersHybrid] Query: "${searchQuery}", Location: "${searchLocation}", Service: "${searchService}"`);
      
      if (searchQuery && searchQuery.length > 2) {
        // console.log('🌐 [searchSuppliersHybrid] Buscando también en Google Places...');
        // Detectar si es nombre específico (una palabra sin espacios o empieza con mayúscula)
        const isSpecificName = !searchQuery.includes(' ') || /^[A-Z]/.test(searchQuery);
        // console.log(`🎯 [searchSuppliersHybrid] Es nombre específico: ${isSpecificName}`);
        googlePlacesPromise = searchGooglePlaces(searchQuery, searchLocation, searchService, isSpecificName);
      } else {
        // console.log(`⚠️ [searchSuppliersHybrid] Query muy corto o vacío: "${searchQuery}"`);
      }

      // 3. Esperar ambas búsquedas
      const [response, googleResults] = await Promise.all([backendPromise, googlePlacesPromise]);

      const elapsed = Date.now() - startTime;
      // console.log(`✅ [searchSuppliersHybrid] Respuesta recibida en ${elapsed}ms`);

      // Validar response
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // console.error('❌ [searchSuppliersHybrid] Error del servidor:', error);
        throw new Error(error.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // console.log('📊 [searchSuppliersHybrid] Datos recibidos:', {
        count: data.count,
        breakdown: data.breakdown,
        suppliersLength: data.suppliers?.length || 0,
        googlePlacesCount: googleResults.results?.length || 0,
      });

      // 4. Combinar resultados de backend + Google Places
      let allSuppliers = data.suppliers || [];

      if (googleResults.results && googleResults.results.length > 0) {
        // console.log(`✅ [searchSuppliersHybrid] Añadiendo ${googleResults.results.length} resultados de Google Places`);

        // Transformar resultados de Google Places al formato esperado
        const googleSuppliersFormatted = googleResults.results.map(place => ({
          id: place.id,
          name: place.name,
          companyName: place.name,
          category: place.category || service || 'Proveedor',
          service: place.category || service,
          address: place.address,
          location: place.location,
          phone: place.phone,
          website: place.website,
          rating: place.rating || 0,
          reviewCount: place.reviewCount || 0,
          photos: place.photo ? [place.photo] : [],
          priceLevel: place.priceLevel,
          source: 'google_places',
          isExternal: true,
          externalId: place.id,
        }));

        allSuppliers = [...allSuppliers, ...googleSuppliersFormatted];
      }

      // 5. Clasificar automáticamente si hay proveedores
      if (allSuppliers.length > 0) {
        // console.log('🤖 [searchSuppliersHybrid] Clasificando proveedores automáticamente...');
        allSuppliers = classifySuppliers(allSuppliers);
      }

      // 6. Actualizar breakdown con Google Places
      const updatedBreakdown = {
        ...data.breakdown,
        googlePlaces: googleResults.results?.length || 0,
        total: allSuppliers.length,
      };

      return {
        success: true,
        count: allSuppliers.length,
        breakdown: updatedBreakdown,
        suppliers: allSuppliers,
        hasGoogleResults: googleResults.results?.length > 0,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        // console.error('⏱️ [searchSuppliersHybrid] Request abortado por timeout');
        throw new Error(
          'La búsqueda está tardando demasiado. Por favor, intenta con términos más específicos.'
        );
      }
      throw fetchError;
    }
  } catch (error) {
    // console.error('💥 [searchSuppliersHybrid] Error en búsqueda híbrida:', error);
    throw error;
  }
}

/**
 * Registrar acción de usuario (view, click, contact, confirm)
 * @param {string} supplierId - ID del proveedor
 * @param {string} action - Acción realizada (view, click, contact, confirm)
 * @param {string|object} userIdOrMetadata - userId o metadata adicional { userId, method, ... }
 */
export async function trackSupplierAction(supplierId, action, userIdOrMetadata = null) {
  try {
    // Soporte para metadata como objeto o solo userId
    const metadata =
      typeof userIdOrMetadata === 'object' ? userIdOrMetadata : { userId: userIdOrMetadata };

    await fetch(`/api/suppliers/${supplierId}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        action,
        ...metadata,
      }),
    });
  } catch (error) {
    // No propagar error, es tracking
    // console.warn('Error tracking action:', error);
  }
}

/**
 * Obtener detalles de un proveedor
 */
export async function getSupplierDetails(supplierId) {
  try {
    const response = await fetch(`/api/suppliers/${supplierId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Proveedor no encontrado');
    }

    const data = await response.json();
    return data.supplier;
  } catch (error) {
    // console.error('Error obteniendo detalles:', error);
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
        service,
      }),
    });

    if (!response.ok) {
      throw new Error('Error en búsqueda Tavily');
    }

    return await response.json();
  } catch (error) {
    // console.error('Error en Tavily:', error);
    throw error;
  }
}
