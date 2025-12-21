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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          let res;
          try {
            res = await fetch(`${backendUrl}/api/diagnostic/status?x-suppress-error-logging=1`, {
              headers: {
                'X-ErrorLogger-Skip': '1',
                'X-Suppress-Error-Logging': '1',
              },
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeoutId);
          }

          if (res.ok) {
            const data = await res.json();
            const configured = Boolean(data?.data?.environment_variables?.openai?.api_key);
            this.diagnostics.openai = configured
              ? {
                  status: 'success',
                  details: { source: 'backend', configured: true },
                }
              : {
                  status: 'warning',
                  details: {
                    source: 'backend',
                    configured: false,
                    message: 'OPENAI_API_KEY no configurada en el servidor',
                  },
                };
            return;
          }
        } catch {
          // si falla backend, continuar con fallback cliente
        }
      }

      this.diagnostics.openai = {
        status: 'warning',
        details: { source: 'backend', message: 'No se pudo verificar OpenAI (backend no disponible)' },
      };
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


