/**
 * Hook para detectar ubicación geográfica del usuario
 * Devuelve país y ciudad sugerida
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4004';

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        setLoading(true);
        
        // Primero intentar desde localStorage (caché)
        const cached = localStorage.getItem('user_location');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Caché válido por 24 horas
            const cacheTime = new Date(parsed.timestamp);
            const now = new Date();
            const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
              console.log('[useGeolocation] Usando ubicación cacheada:', parsed.data);
              setLocation(parsed.data);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('[useGeolocation] Error parsing cached location:', e);
          }
        }

        // Llamar al backend para detectar ubicación
        const response = await axios.get(`${API_BASE_URL}/api/geolocation`);
        
        if (response.data.success && response.data.data) {
          const locationData = response.data.data;
          console.log('[useGeolocation] Ubicación detectada:', locationData);
          
          setLocation(locationData);
          
          // Guardar en localStorage
          localStorage.setItem('user_location', JSON.stringify({
            data: locationData,
            timestamp: new Date().toISOString()
          }));
        } else {
          throw new Error('Invalid response from geolocation API');
        }
      } catch (err) {
        console.error('[useGeolocation] Error:', err);
        setError(err.message);
        
        // Fallback a Madrid, España
        const fallback = {
          country: 'es',
          city: 'madrid',
          cityName: 'Madrid',
          slug: 'madrid',
          detected: false,
          source: 'fallback'
        };
        setLocation(fallback);
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  return {
    location,
    loading,
    error,
    isDetected: location?.detected === true
  };
}
