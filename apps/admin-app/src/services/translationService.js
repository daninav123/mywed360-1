// Servicio de traducción
// Usa el proxy del backend para seguridad (API key no expuesta en frontend)
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:4004';

/**
 * Traduce un texto al idioma destino usando el proxy del backend.
 * @param {string} text
 * @param {string} targetLang ej. 'es'
 * @param {string} sourceLang opcional (detectará si se omite)
 */
export async function translateText(text, targetLang = 'es', sourceLang = '') {
  if (!text) return text;
  
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/proxy/translate`,
      {
        text,
        targetLang,
        sourceLang
      },
      {
        timeout: 10000,
        // Incluir credenciales para autenticación si es necesario
        withCredentials: true
      }
    );
    
    return response.data.translated || text;
  } catch (error) {
    // console.warn('[TranslationService] Error en traducción:', error.message);
    // Fallback: devolver texto original
    return text;
  }
}
