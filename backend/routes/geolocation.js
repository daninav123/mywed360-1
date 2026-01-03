/**
 * API de Geolocalización
 * Detecta país y ciudad del usuario basado en IP
 */
import express from 'express';

const router = express.Router();

// Mapa simple de países a ciudades destacadas
const FEATURED_CITIES = {
  ES: { country: 'es', city: 'madrid', cityName: 'Madrid', slug: 'madrid' },
  MX: { country: 'mx', city: 'ciudad-de-mexico', cityName: 'Ciudad de México', slug: 'ciudad-de-mexico' },
  AR: { country: 'ar', city: 'buenos-aires', cityName: 'Buenos Aires', slug: 'buenos-aires' },
  CO: { country: 'co', city: 'bogota', cityName: 'Bogotá', slug: 'bogota' },
  CL: { country: 'cl', city: 'santiago', cityName: 'Santiago', slug: 'santiago' },
  PE: { country: 'pe', city: 'lima', cityName: 'Lima', slug: 'lima' },
  US: { country: 'us', city: 'miami', cityName: 'Miami', slug: 'miami' },
  default: { country: 'es', city: 'madrid', cityName: 'Madrid', slug: 'madrid' }
};

/**
 * GET /api/geolocation
 * Detecta ubicación del usuario basado en IP
 */
router.get('/', async (req, res) => {
  try {
    // Obtener IP del usuario
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] 
      || req.connection.remoteAddress 
      || req.socket.remoteAddress
      || '127.0.0.1';

    console.log('[Geolocation] IP detectada:', ip);

    // Si es localhost o IP privada, devolver default (España)
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log('[Geolocation] IP local detectada - usando default (Madrid)');
      return res.json({
        success: true,
        data: {
          ...FEATURED_CITIES.default,
          detected: false,
          source: 'default'
        }
      });
    }

    // Usar servicio gratuito de geolocalización (ip-api.com)
    // Límite: 45 req/min (suficiente para desarrollo)
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`);
    
    if (!geoResponse.ok) {
      throw new Error('Geolocation API error');
    }

    const geoData = await geoResponse.json();
    console.log('[Geolocation] Respuesta de ip-api:', geoData);

    // Si la API falló, devolver default
    if (geoData.status !== 'success') {
      return res.json({
        success: true,
        data: {
          ...FEATURED_CITIES.default,
          detected: false,
          source: 'default'
        }
      });
    }

    // Mapear código de país a ciudad destacada
    const countryCode = geoData.countryCode;
    const location = FEATURED_CITIES[countryCode] || FEATURED_CITIES.default;

    res.json({
      success: true,
      data: {
        ...location,
        detected: true,
        source: 'ip-api',
        detectedCity: geoData.city,
        detectedCountry: geoData.country,
        coordinates: {
          lat: geoData.lat,
          lon: geoData.lon
        }
      }
    });

  } catch (error) {
    console.error('[Geolocation] Error:', error);
    
    // En caso de error, devolver default
    res.json({
      success: true,
      data: {
        ...FEATURED_CITIES.default,
        detected: false,
        source: 'error',
        error: error.message
      }
    });
  }
});

/**
 * GET /api/geolocation/nearby/:city
 * Obtiene ciudades cercanas a una ciudad dada
 */
router.get('/nearby/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    // TODO: Implementar búsqueda de ciudades cercanas
    // Por ahora devolver array vacío
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('[Geolocation] Error getting nearby cities:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
