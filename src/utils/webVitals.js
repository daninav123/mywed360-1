import { onCLS, onFID, onLCP, onFCP, onINP, onTTFB } from 'web-vitals';

import { post } from '@/services/apiClient';

const ENABLED = (() => {
  const flag = import.meta.env?.VITE_ENABLE_WEB_VITALS;
  if (typeof flag === 'string') {
    const normalized = flag.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return Boolean(import.meta.env?.PROD);
})();

let endpointDisabled = false;
let hasWarned = false;

const debugLog = (...args) => {
  if (import.meta.env?.DEV) {
    // console.info('[webVitals]', ...args);
  }
};

const report = async (metric) => {
  if (!ENABLED || endpointDisabled || typeof window === 'undefined') {
    return;
  }

  try {
    const response = await post('/api/web-vitals', {
      metrics: metric,
      context: {
        path: window.location?.pathname || '',
      },
    });

    if (!response?.ok) {
      if (response?.status === 404) {
        endpointDisabled = true;
        if (!hasWarned) {
          hasWarned = true;
          debugLog('Endpoint /api/web-vitals no disponible (404). Reportes deshabilitados.');
        }
      } else if (import.meta.env?.DEV && !hasWarned) {
        hasWarned = true;
        debugLog(`Fallo al reportar metricas (status ${response.status}).`);
      }
    }
  } catch (error) {
    endpointDisabled = true;
    if (!hasWarned) {
      hasWarned = true;
      debugLog('Reporte de Web Vitals deshabilitado por error de red.', error);
    }
  }
};

export function initWebVitals() {
  if (!ENABLED) {
    debugLog('Reportes de Web Vitals deshabilitados por configuracion.');
    return;
  }

  try {
    onCLS(report);
    onFID(report);
    onLCP(report);
    onFCP(report);
    onINP?.(report);
    onTTFB(report);
  } catch (error) {
    endpointDisabled = true;
    debugLog('No se pudo inicializar web-vitals.', error);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => initWebVitals(), 0);
}
