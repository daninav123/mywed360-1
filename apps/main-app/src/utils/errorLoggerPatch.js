// Patch runtime para mejorar el chequeo de OpenAI desde el frontend
// Prefiere usar el endpoint p?blico del backend /api/diagnostic/openai
// para evitar CORS y no exponer la API key del cliente.

function installPatch() {
  const logger = window.errorLogger;
  if (!logger) return false;

  logger.checkOpenAIConnection = async function patchedOpenAICheck() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (backendUrl) {
        try {
          const res = await fetch(`${backendUrl}/api/diagnostic/openai`, {
            headers: { 'X-ErrorLogger-Skip': '1' }
          });
          if (res.ok) {
            const data = await res.json();
            if (!data.configured) {
              this.diagnostics.openai = {
                status: 'warning',
                details: { message: 'OPENAI_API_KEY no configurada en el servidor' }
              };
              return;
            }
            if (data.apiReachable) {
              this.diagnostics.openai = {
                status: 'success',
                details: { source: 'backend', status: data.status }
              };
            } else {
              this.diagnostics.openai = {
                status: 'warning',
                details: { source: 'backend', message: data.error || 'OpenAI no alcanzable', status: data.status }
              };
            }
            return;
          }
        } catch {
          // si falla backend, continuar con fallback cliente
        }
      }

      // Fallback: prueba directa con VITE_OPENAI_API_KEY si existe
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const allowDirect = import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true';
      if (apiKey && allowDirect) {
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'X-ErrorLogger-Skip': '1'
            }
          });
          if (response.ok) {
            this.diagnostics.openai = {
              status: 'success',
              details: { apiKeyPrefix: apiKey.substring(0, 10) + '...', status: response.status }
            };
          } else {
            this.diagnostics.openai = {
              status: 'warning',
              details: { message: `OpenAI API ${response.status}`, status: response.status }
            };
          }
        } catch (err) {
          this.diagnostics.openai = {
            status: 'error',
            details: { error: err.message }
          };
        }
      } else if (apiKey && !allowDirect) {
        this.diagnostics.openai = {
          status: 'warning',
          details: { message: 'OpenAI directo deshabilitado', apiKeyPrefix: apiKey.substring(0, 6) + '...' }
        };
      } else {
        this.diagnostics.openai = {
          status: 'warning',
          details: { message: 'OpenAI no configurado (VITE_OPENAI_API_KEY ausente)' }
        };
      }
    } catch (error) {
      this.diagnostics.openai = {
        status: 'error',
        details: { error: error.message }
      };
    }
  };

  // Ejecutar inmediatamente para actualizar el panel sin esperar a un nuevo ciclo
  logger.checkOpenAIConnection().then(() => {
    try { logger.printDiagnosticsReport(); } catch {}
  });

  return true;
}

// Intentar instalar el patch cuando errorLogger est?disponible
(function bootstrapPatch() {
  if (typeof window === 'undefined') return;
  if (!installPatch()) {
    const id = setInterval(() => {
      if (installPatch()) clearInterval(id);
    }, 200);
    // como m?ximo 5s
    setTimeout(() => clearInterval(id), 5000);
  }
})();


