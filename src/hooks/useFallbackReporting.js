// src/hooks/useFallbackReporting.js
// Hook para reportar fallbacks al backend y mostrar en panel de admin

import { useCallback } from 'react';

import { useAuth } from './useAuth';
import { post as apiPost } from '../services/apiClient';

/**
 * Hook para reportar activaciones de fallback al sistema de monitoreo
 * 
 * @example
 * const { reportFallback } = useFallbackReporting();
 * 
 * try {
 *   const result = await fetchFromAPI();
 * } catch (error) {
 *   await reportFallback('service-name', error, { endpoint: '/api/...' });
 *   return fallbackData;
 * }
 */
export function useFallbackReporting() {
  const { user } = useAuth();

  /**
   * Reporta activación de fallback al backend
   * 
   * @param {string} service - Nombre del servicio que falló (ej: 'ai-suppliers', 'email-service')
   * @param {Error|string} error - Error que causó el fallback
   * @param {object} metadata - Metadata adicional (endpoint, query params, etc)
   * @returns {Promise<void>}
   */
  const reportFallback = useCallback(
    async (service, error, metadata = {}) => {
      // Log local inmediato para debugging
      // console.warn(`[Fallback] ${service}:`, error);

      // Extraer información del error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Error';
      const errorCode = error?.code || error?.status || 'unknown';

      // Preparar payload
      const payload = {
        service,
        error: errorCode,
        errorMessage,
        endpoint: metadata.endpoint || '',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          userEmail: user?.email || 'anonymous',
          errorName,
          // Incluir stack trace solo en desarrollo
          ...(import.meta.env.DEV && error?.stack && { stack: error.stack }),
        },
      };

      // Reportar al backend de forma no bloqueante
      try {
        const response = await apiPost('/api/fallback-monitor/log', payload, {
          auth: true,
          silent: true, // No mostrar errores de red en UI
        });

        if (response?.ok) {
          const result = await response.json();
          if (import.meta.env.DEV) {
            // console.debug(`[useFallbackReporting] Reported to backend:`, {
              service,
              count: result.count,
            });
          }
        } else {
          // Falló el reporte, pero no es crítico
          // console.debug(`[useFallbackReporting] Failed to report (non-critical):`, response?.status);
        }
      } catch (reportError) {
        // Fallar silenciosamente al reportar fallbacks
        // No queremos que un error al reportar cause más problemas
        // console.debug('[useFallbackReporting] Report error (non-critical):', reportError.message);
      }
    },
    [user]
  );

  return { reportFallback };
}

export default useFallbackReporting;
