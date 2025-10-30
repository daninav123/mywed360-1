/**
 * Google Places API Service
 * Para buscar proveedores de bodas con datos verificados
 */

import fetch from 'node-fetch';
import {
  getHighCoverageCategories,
  getMediumCoverageCategories,
  getLowCoverageCategories,
  getGooglePlacesType,
  findCategoryByKeyword,
} from '../../shared/supplierCategories.js';

// Configuración de API
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Categorías desde archivo centralizado
const HIGH_COVERAGE_CATEGORIES = getHighCoverageCategories().flatMap((cat) => cat.keywords);
const MEDIUM_COVERAGE_CATEGORIES = getMediumCoverageCategories().flatMap((cat) => cat.keywords);
const LOW_COVERAGE_CATEGORIES = getLowCoverageCategories().flatMap((cat) => cat.keywords);

/**
 * Determina si debemos usar Google Places para esta categoría
 */
function shouldUseGooglePlaces(service) {
  const serviceLower = (service || '').toLowerCase().trim();

  return (
    HIGH_COVERAGE_CATEGORIES.includes(serviceLower) ||
    MEDIUM_COVERAGE_CATEGORIES.includes(serviceLower)
  );
}

/**
 * Mapea nuestras categorías a tipos de Google Places
 */
function mapServiceToPlaceType(service) {
  const serviceLower = (service || '').toLowerCase().trim();

  // Intentar encontrar categoría por keyword
  const category = findCategoryByKeyword(service);
  if (category && category.googlePlacesType) {
    return category.googlePlacesType;
  }

  // Fallback: mapeo manual legacy (por si acaso)
  const legacyMapping = {
    fotografos: 'photographer',
    videografos: 'videographer',
    musicos: null,
    dj: null,
  };

  return legacyMapping[serviceLower] || null;
}

/**
 * Busca proveedores en Google Places API
 */
async function searchGooglePlaces(service, location, maxResults = 20) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('⚠️ [GOOGLE PLACES] API Key no configurada');
    return [];
  }

  if (!shouldUseGooglePlaces(service)) {
    console.log(`⏭️ [GOOGLE PLACES] Categoría "${service}" no usa Google Places`);
    return [];
  }

  const placeType = mapServiceToPlaceType(service);

  try {
    console.log(`\n🌍 [GOOGLE PLACES] Buscando: ${service} en ${location}`);

    // 1. Text Search para encontrar lugares
    // Mejorar query con palabras clave adicionales
    let query;
    if (placeType) {
      query = `${placeType} wedding ${location} Spain`;
    } else {
      // Para servicios sin tipo específico, usar múltiples palabras clave
      query = `${service} eventos bodas ${location} España`;
    }

    console.log(`📝 [GOOGLE PLACES] Query: "${query}"`);

    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('language', 'es');
    searchUrl.searchParams.append('region', 'es');
    searchUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error(
        `❌ [GOOGLE PLACES] Error: ${searchData.status} - ${searchData.error_message || ''}`
      );
      return [];
    }

    if (!searchData.results || searchData.results.length === 0) {
      console.log(`📊 [GOOGLE PLACES] 0 resultados para "${query}"`);
      return [];
    }

    console.log(`📊 [GOOGLE PLACES] ${searchData.results.length} lugares encontrados`);

    // 2. Obtener detalles de cada lugar (con teléfono, website, etc.)
    const suppliers = [];
    const maxToFetch = Math.min(searchData.results.length, maxResults);

    for (let i = 0; i < maxToFetch; i++) {
      const place = searchData.results[i];

      try {
        const details = await getPlaceDetails(place.place_id);

        if (details) {
          suppliers.push({
            ...details,
            source: 'google-places',
            googlePlaceId: place.place_id,
          });
        }
      } catch (error) {
        console.error(
          `❌ [GOOGLE PLACES] Error obteniendo detalles de ${place.name}:`,
          error.message
        );
      }
    }

    console.log(`✅ [GOOGLE PLACES] ${suppliers.length} proveedores procesados`);
    return suppliers;
  } catch (error) {
    console.error(`❌ [GOOGLE PLACES] Error en búsqueda:`, error.message);
    return [];
  }
}

/**
 * Obtiene detalles completos de un lugar
 */
async function getPlaceDetails(placeId) {
  const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  detailsUrl.searchParams.append('place_id', placeId);
  detailsUrl.searchParams.append(
    'fields',
    [
      'name',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'formatted_address',
      'address_components',
      'geometry',
      'photos',
      'opening_hours',
      'types',
      'price_level',
    ].join(',')
  );
  detailsUrl.searchParams.append('language', 'es');
  detailsUrl.searchParams.append('key', GOOGLE_PLACES_API_KEY);

  const response = await fetch(detailsUrl.toString());
  const data = await response.json();

  if (data.status !== 'OK') {
    console.warn(`⚠️ [GOOGLE PLACES] No se pudieron obtener detalles: ${data.status}`);
    return null;
  }

  const place = data.result;

  // Extraer ciudad y provincia de address_components
  let city = '';
  let province = '';

  if (place.address_components) {
    for (const component of place.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_2')) {
        province = component.long_name;
      }
    }
  }

  // Formatear teléfono
  const phone = place.formatted_phone_number || place.international_phone_number || null;

  return {
    name: place.name,
    contact: {
      phone: phone,
      email: null, // Google Places no proporciona email
      website: place.website || null,
      address: place.formatted_address || null,
    },
    location: {
      city: city,
      province: province,
      address: place.formatted_address || null,
      coordinates: place.geometry?.location || null,
    },
    rating: place.rating || null,
    reviewCount: place.user_ratings_total || 0,
    priceLevel: place.price_level || null,
    openingHours: place.opening_hours?.weekday_text || null,
    photos:
      place.photos?.slice(0, 3).map((photo) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })) || [],
    verified: true, // Google Places son negocios verificados
    registered: false,
    status: 'google-verified',
    badge: 'Google verificado ✓',
    badgeType: 'success',
  };
}

/**
 * Genera URL de foto de Google Places
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference || !GOOGLE_PLACES_API_KEY) return null;

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

export {
  searchGooglePlaces,
  shouldUseGooglePlaces,
  getPhotoUrl,
  mapServiceToPlaceType,
  HIGH_COVERAGE_CATEGORIES,
  MEDIUM_COVERAGE_CATEGORIES,
  LOW_COVERAGE_CATEGORIES,
};
