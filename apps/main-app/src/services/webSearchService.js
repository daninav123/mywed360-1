import axios from 'axios';

/**
 * Servicio de Búsqueda Web
 * Integra búsquedas en Google Places, Yelp y otras fuentes externas
 */

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

/**
 * Categorías de proveedores mapeadas a types de Google Places
 */
const SUPPLIER_TYPE_MAPPING = {
  fotografo: ['photographer', 'photo_studio'],
  fotografia: ['photographer', 'photo_studio'],
  catering: ['caterer', 'restaurant'],
  floristeria: ['florist', 'flower_shop'],
  flores: ['florist', 'flower_shop'],
  musica: ['dj', 'musician', 'band'],
  dj: ['dj', 'night_club'],
  video: ['videographer', 'photographer'],
  pasteleria: ['bakery', 'cake_shop'],
  tarta: ['bakery', 'cake_shop'],
  decoracion: ['home_goods_store', 'furniture_store'],
  venue: ['wedding_venue', 'banquet_hall', 'event_venue'],
  salon: ['banquet_hall', 'event_venue'],
  hotel: ['hotel', 'lodging'],
  transporte: ['car_rental', 'limousine_service'],
  maquillaje: ['beauty_salon', 'makeup_artist'],
  peluqueria: ['hair_salon', 'beauty_salon'],
  invitaciones: ['print_shop', 'stationery_store'],
  joyeria: ['jewelry_store'],
  anillos: ['jewelry_store'],
  vestido: ['bridal_shop', 'clothing_store'],
  traje: ['men_clothing_store', 'tailor'],
};

/**
 * Buscar proveedores en Google Places
 */
export const searchGooglePlaces = async (query, location = null, category = null, isSpecificName = false) => {
  try {
    // console.log(`🌐 [Google Places Frontend] Llamando al proxy del backend...`);
    // console.log(`   Query: "${query}", Location: "${location}", Category: "${category}", IsSpecificName: ${isSpecificName}`);
    
    // Llamar al proxy del backend in lugar de directamente a Google
    const response = await axios.post(
      `${BACKEND_URL}/api/google-places/search`,
      {
        query,
        location,
        category,
        isSpecificName,
      },
      {
        timeout: 30000, // ✨ Aumentado de 10s a 30s
      }
    );

    // console.log(`✅ [Google Places Frontend] Respuesta del proxy:`, {
      count: response.data.count || 0,
      source: response.data.source,
    });

    return {
      results: response.data.results || [],
      source: response.data.source || 'google_places',
    };
  } catch (error) {
    // console.error('❌ [Google Places Frontend] Error llamando al proxy:', error.message);
    return { results: [], source: 'google_places' };
  }
};

/**
 * Obtener detalles completos de un lugar (requiere llamada adicional)
 */
export const getPlaceDetails = async (placeId) => {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const params = {
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      language: 'es',
      fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,opening_hours,price_level,reviews',
    };

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      { params }
    );

    if (response.data.status !== 'OK') {
      return null;
    }

    const place = response.data.result;
    
    return {
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: place.price_level,
      photos: place.photos?.slice(0, 5).map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      ),
      hours: place.opening_hours?.weekday_text,
      reviews: place.reviews?.slice(0, 3).map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
      })),
    };
  } catch (error) {
    // console.error('Error getting place details:', error);
    return null;
  }
};

/**
 * Buscar en Pinterest (usando backend como proxy)
 */
export const searchPinterest = async (query) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/search/pinterest`, {
      params: { q: query, limit: 20 },
    });

    return {
      results: response.data.results || [],
      source: 'pinterest',
    };
  } catch (error) {
    // console.error('Error searching Pinterest:', error);
    return { results: [], source: 'pinterest' };
  }
};

/**
 * Buscar en Unsplash (imágenes de inspiración)
 */
export const searchUnsplash = async (query) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/search/unsplash`, {
      params: { q: query, per_page: 20 },
    });

    return {
      results: response.data.results || [],
      source: 'unsplash',
    };
  } catch (error) {
    // console.error('Error searching Unsplash:', error);
    return { results: [], source: 'unsplash' };
  }
};

/**
 * Scraping de Bodas.net (a través del backend)
 */
export const searchBodasNet = async (query, category = null) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/search/bodas-net`, {
      params: { q: query, category },
    });

    return {
      results: response.data.results || [],
      source: 'bodas_net',
    };
  } catch (error) {
    // console.error('Error searching Bodas.net:', error);
    return { results: [], source: 'bodas_net' };
  }
};

/**
 * Detectar ubicación del usuario (opcional)
 */
export const getUserLocation = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
};

/**
 * Función principal de búsqueda web combinada
 */
export const searchWeb = async (query, options = {}) => {
  const {
    category = null,
    location = null,
    sources = ['google_places'], // ['google_places', 'pinterest', 'unsplash', 'bodas_net']
    limit = 10,
    isSpecificName = false,
  } = options;

  const searchPromises = [];

  // Google Places (proveedores locales)
  if (sources.includes('google_places')) {
    searchPromises.push(searchGooglePlaces(query, location, category, isSpecificName));
  }

  // Pinterest (inspiración)
  if (sources.includes('pinterest')) {
    searchPromises.push(searchPinterest(query + ' boda'));
  }

  // Unsplash (imágenes)
  if (sources.includes('unsplash')) {
    searchPromises.push(searchUnsplash(query + ' wedding'));
  }

  // Bodas.net (proveedores españoles)
  if (sources.includes('bodas_net')) {
    searchPromises.push(searchBodasNet(query, category));
  }

  try {
    const results = await Promise.all(searchPromises);
    
    return {
      combined: results.flatMap(r => r.results).slice(0, limit),
      bySource: results.reduce((acc, r) => {
        acc[r.source] = r.results;
        return acc;
      }, {}),
    };
  } catch (error) {
    // console.error('Error in combined web search:', error);
    return { combined: [], bySource: {} };
  }
};

export default {
  searchGooglePlaces,
  getPlaceDetails,
  searchPinterest,
  searchUnsplash,
  searchBodasNet,
  searchWeb,
  getUserLocation,
};
