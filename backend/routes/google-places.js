// routes/google-places.js
// Proxy para Google Places API (evitar CORS)

import express from 'express';
import axios from 'axios';

const router = express.Router();

const GOOGLE_PLACES_API_KEY = process.env.VITE_GOOGLE_PLACES_API_KEY || '';

/**
 * POST /api/google-places/search
 * Buscar lugares en Google Places
 */
router.post('/search', async (req, res) => {
  try {
    const { query, location, category, isSpecificName } = req.body;

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Google Places API key not configured');
      return res.json({ results: [], source: 'google_places' });
    }

    console.log(`🌐 [Google Places Proxy] Query: "${query}", Location: "${location}"`);

    // Construir query
    let searchQuery = query;
    
    if (isSpecificName) {
      console.log(`🔍 [Google Places Proxy] Búsqueda específica: "${searchQuery}"`);
      if (location && !query.toLowerCase().includes(location.toLowerCase())) {
        searchQuery += ` ${location}`;
      }
    } else {
      console.log(`🔍 [Google Places Proxy] Búsqueda genérica: "${searchQuery}"`);
      if (!searchQuery.toLowerCase().includes('boda') && !searchQuery.toLowerCase().includes('wedding')) {
        searchQuery += ' bodas';
      }
    }

    const params = {
      query: searchQuery,
      key: GOOGLE_PLACES_API_KEY,
      language: 'es',
      region: 'ES',
    };

    console.log(`🌐 [Google Places Proxy] Llamando a API...`);
    
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      { params, timeout: 25000 } // ✨ Aumentado de 10s a 25s
    );

    console.log(`📊 [Google Places Proxy] Status: ${response.data.status}`);

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('❌ [Google Places Proxy] Error:', response.data.status, response.data.error_message);
      return res.json({ results: [], source: 'google_places', error: response.data.status });
    }

    if (response.data.status === 'ZERO_RESULTS') {
      console.log('⚠️ [Google Places Proxy] No results');
      return res.json({ results: [], source: 'google_places' });
    }

    const results = (response.data.results || []).slice(0, 10).map(place => ({
      id: place.place_id,
      name: place.name,
      category: category || 'Proveedor',
      address: place.formatted_address,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      priceLevel: place.price_level ? '€'.repeat(place.price_level) : null,
      location: place.geometry?.location || null,
      photo: place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
        : null,
      isOpen: place.opening_hours?.open_now,
      types: place.types || [],
    }));

    console.log(`✅ [Google Places Proxy] Devolviendo ${results.length} resultados`);

    res.json({
      results,
      source: 'google_places',
      count: results.length,
    });

  } catch (error) {
    console.error('💥 [Google Places Proxy] Error:', error.message);
    res.status(500).json({
      results: [],
      source: 'google_places',
      error: error.message,
    });
  }
});

/**
 * GET /api/google-places/details/:placeId
 * Obtener detalles de un lugar específico
 */
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: GOOGLE_PLACES_API_KEY,
          language: 'es',
          fields: 'name,formatted_address,formatted_phone_number,website,rating,reviews,photos,opening_hours,price_level,url',
        },
        timeout: 10000,
      }
    );

    if (response.data.status !== 'OK') {
      return res.status(404).json({ error: response.data.status });
    }

    const place = response.data.result;
    res.json({
      id: placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviews: place.reviews || [],
      photos: (place.photos || []).map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      ),
      openingHours: place.opening_hours,
      priceLevel: place.price_level,
      googleMapsUrl: place.url,
    });

  } catch (error) {
    console.error('Error fetching place details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
