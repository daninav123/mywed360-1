import i18n from '../i18n';

/**
 * Sistema de Logging y Diagnóstico de Errores Centralizado
 * Captura todos los errores del frontend y backend para diagnóstico
 */

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.diagnostics = {
      firebase: { status: 'unknown', details: null },
      backend: { status: 'unknown', details: null },
      openai: { status: 'unknown', details: null },
      mailgun: { status: 'unknown', details: null },
      environment: { status: 'unknown', details: null },
      auth: { status: 'unknown', details: null },
      wedding: { status: 'unknowni18n.t('common.details_null_thisisinitialized_false_thisopenaithrottleuntil_thisisloggingerror')error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error,
      });
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack || 'No stack trace available',
      });
    });

    // Interceptar console.error para capturar errores manuales
    this.originalConsoleError = console.error;
    console.error = (...args) => {
      this.logError('Console Errori18n.t('common.args_llamar_implementacion_original_para_perder')object') ? args[1] : null;
          const headers = init?.headers;
          if (headers) {
            if (headers.get && typeof headers.get === 'function') {
              const v = headers.get('X-Suppress-Error-Logging') || headers.get('x-suppress-error-logging');
              if (String(v || '').trim() === '1') suppressLogging = true;
            } else if (typeof headers === 'object') {
              const k = Object.keys(headers).find((h) => h.toLowerCase() === 'x-suppress-error-logging');
              if (k && String(headers[k] || '').trim() === '1') suppressLogging = true;
            }
          }
        } catch {}
        try {
          const reqUrlStr = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
          const u = new URL(reqUrlStr, window.location.origin);
          if (u.searchParams.get('x-suppress-error-logging') === '1') suppressLogging = true;
        } catch {}

        const response = await originalFetch(...args);
        if (!response.ok) {
          try {
            const reqUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            const method = args[1]?.method || 'GET';
            const isPublicWeddingCheck = method === 'GET' && reqUrl.includes('/api/public/weddings/');
            const isBenignAsset404 = response.status === 404 && /\/logo\.png(\?|$)/.test(reqUrl || '');
            const isMailRead404 = /\/api\/mail\/[^/]+\/(read|unread)$/i.test(reqUrl || '') && response.status === 404;
            if (suppressLogging || isPublicWeddingCheck || isBenignAsset404 || isMailRead404) {
              return response;
            }
          } catch {}
          this.logError('HTTP Error', {
            url: typeof args[0] === 'string' ? args[0] : (args[0]?.url || String(args[0] || '')),
            status: response.status,
            statusText: response.statusText,
            method: args[1]?.method || 'GET',
          });
        }
        return response;
      } catch (error) {
        if (!suppressLogging) {
          this.logError('Network Error', {
            url: typeof args[0] === 'string' ? args[0] : (args[0]?.url || String(args[0] || 'i18n.t('common.error_errormessage_stack_errorstack_throw_error')Details:', details);
        this.originalConsoleError.call(console, 'Full Error Entry:', errorEntry);
      } else {
        console.group(`🚨 ${type} - ${new Date().toLocaleTimeString()}`);
        console.log('Details:', details);
        console.log('Full Error Entry:', errorEntry);
        console.groupEnd();
      }

      // Actualizar diagnósticos si es necesario
      this.updateDiagnosticsFromError(type, details);
    } finally {
      this.isLoggingError = false;
    }
  }

  /**
   * Actualiza el estado de diagnósticos basado en errores
   */
  updateDiagnosticsFromError(type, details) {
    if (type === 'Network Error' || type === 'HTTP Error') {
      let urlStr = '';
      try {
        const raw = details?.url;
        if (typeof raw === 'string') {
          urlStr = raw;
        } else if (raw && typeof raw === 'object') {
          // Puede ser un objeto Request
          urlStr = raw.url || String(raw);
        }
      } catch {}
      urlStr = String(urlStr || '');

      try {
        if (urlStr.includes('firestore') || urlStr.includes('firebase')) {
          this.diagnostics.firebase.status = 'error';
          this.diagnostics.firebase.details = details;
        } else if (
          urlStr.includes('render.com') ||
          urlStr.includes('localhost:4004')
        ) {
          this.diagnostics.backend.status = 'error';
          this.diagnostics.backend.details = details;
        } else if (urlStr.includes('openai') || urlStr.includes('api.openai.com')) {
          this.diagnostics.openai.status = 'error';
          this.diagnostics.openai.details = details;
        } else if (urlStr.includes('mailgun')) {
          this.diagnostics.mailgun.status = 'errori18n.t('common.thisdiagnosticsmailgundetails_details_catch_actualiza_informacion_autenticacion')success', details: info };
    } else {
      this.diagnostics.auth = { status: 'error', details: { message: 'Sin usuario autenticadoi18n.t('common.actualiza_informacion_boda_activa_param_objectnull')success', details: info };
    } else {
      this.diagnostics.wedding = {
        status: 'warning',
        details: info || { message: 'Sin boda activai18n.t('common.inicia_diagnosticos_automaticos_del_sistema_async')🔍 Iniciando diagnósticos del sistema...');

    await Promise.all([
      this.checkEnvironmentVariables(),
      this.checkFirebaseConnection(),
      this.checkBackendConnection(),
      this.checkOpenAIConnection(),
      this.checkMailgunConnection(),
    ]);

    this.isInitialized = true;
    this.printDiagnosticsReport();
  }

  /**
   * Verifica las variables de entorno críticas
   */
  async checkEnvironmentVariables() {
    try {
      const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_OPENAI_API_KEY',
        'VITE_MAILGUN_API_KEY',
        'VITE_BACKEND_BASE_URL',
      ];

      const missing = [];
      const present = [];

      requiredVars.forEach((varName) => {
        const value = import.meta.env[varName];
        if (!value || value === 'undefined' || value === '') {
          missing.push(varName);
        } else {
          present.push({ name: varName, value: value.substring(0, 10) + '...' });
        }
      });

      this.diagnostics.environment = {
        status: missing.length === 0 ? 'success' : 'error',
        details: {
          missing,
          present,
          total: requiredVars.length,
          mode: import.meta.env.MODE,
          dev: import.meta.env.DEV,
        },
      };
    } catch (error) {
      this.diagnostics.environment = {
        status: 'errori18n.t('common.details_error_errormessage_verifica_conexion_con')firebase/firestore');
      const { getAuth } = await import('firebase/auth');

      const db = getFirestore();
      const auth = getAuth();

      // Verificar solo con auth, sin intentar escrituras que pueden fallar
      if (auth.currentUser) {
        // Intentar leer documento de usuario (lectura simple, menos propensa a errores)
        try {
          const userDoc = doc(db, 'users', auth.currentUser.uid);
          await getDoc(userDoc);

          this.diagnostics.firebase = {
            status: 'success',
            details: {
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
              currentUser: auth.currentUser.uid,
              connection: 'OK - Authenticated accessi18n.t('common.return_catch_readerror_falla_lectura_pero')success',
            details: {
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
              currentUser: auth.currentUser.uid,
              connection: 'OK - Auth verified',
            },
          };
          return;
        }
      }
      
      // Sin usuario autenticado
      this.diagnostics.firebase = {
        status: 'warning',
        details: {
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          currentUser: 'No authenticated user',
          connection: 'Firebase initialized but no user logged in',
        },
      };
    } catch (error) {
      this.diagnostics.firebase = {
        status: 'error',
        details: {
          error: error.message || String(error),
          code: error.code || 'unknowni18n.t('common.verifica_conexion_con_backend_async_checkbackendconnection')VITE_BACKEND_BASE_URL no está configurada');
      }

      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.diagnostics.backend = {
          status: 'successi18n.t('common.details_url_backendurl_response_data_status')errori18n.t('common.details_error_errormessage_url_importmetaenvvitebackendbaseurl_verifica')warning',
          details: {
            reason: 'throttled',
            nextRetryInMs: this.openAIThrottleUntil - Date.now(),
            retryAt: new Date(this.openAIThrottleUntil).toISOString(),
          },
        };
        return;
      }

      const allowDirect = import.meta.env.VITE_ENABLE_DIRECT_OPENAI === 'true';
      if (!allowDirect) {
        this.diagnostics.openai = {
          status: 'warning',
          details: { reason: 'direct-openai-disabled' },
        };
        return;
      }
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(i18n.t('common.viteopenaiapikey_esta_configurada'));
      }

      // Test simple de la API de OpenAI
      const projectId = import.meta.env.VITE_OPENAI_PROJECT_ID;
      const headers = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      if (projectId) {
        headers['OpenAI-Project'] = projectId;
      }

      const response = await fetch('https://api.openai.com/v1/models', { headers });

      if (response.ok) {
        this.openAIThrottleUntil = 0;
        this.diagnostics.openai = {
          status: 'success',
          details: {
            apiKeyPrefix: apiKey.substring(0, 10) + '...',
            status: response.status,
          },
        };
        return;
      }

      if (response.status === 401 || response.status === 403) {
        this.openAIThrottleUntil = Date.now() + 10 * 60 * 1000;
        this.diagnostics.openai = {
          status: 'warningi18n.t('common.details_error_openai_api_respondio_con')string' &&
        /status (401|403)/.test(error.message)
      ) {
        this.openAIThrottleUntil = Date.now() + 10 * 60 * 1000;
      }
      this.diagnostics.openai = {
        status: 'errori18n.t('common.details_error_errormessage_hasapikey_importmetaenvviteopenaiapikey_thisopenaithrottleuntil')Variables de Mailgun no configuradasi18n.t('common.verificar_traves_del_backend_esta_disponible')GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.diagnostics.mailgun = {
            status: 'successi18n.t('common.details_data_else_throw_new_errormailgun')warning',
          details: {
            message: 'Variables configuradas pero backend no disponible para test',
            domain,
            hasApiKey: !!apiKey,
          },
        };
      }
    } catch (error) {
      this.diagnostics.mailgun = {
        status: 'errori18n.t('common.details_error_errormessage_hasapikey_importmetaenvvitemailgunapikey_hasdomain')—— (console.clear() omitido en DEV) ——');
    }
    console.log('🔍 REPORTE DE DIAGNÓSTICOS MALOVEAPP');
    console.log('=====================================');
    console.log('Timestamp:', new Date().toLocaleString());
    console.log('');

    // Resumen general
    const services = Object.keys(this.diagnostics);
    const successful = services.filter((s) => this.diagnostics[s].status === 'success').length;
    const errors = services.filter((s) => this.diagnostics[s].status === 'error').length;
    const warnings = services.filter((s) => this.diagnostics[s].status === 'warning').length;

    console.log(`📊 RESUMEN: ${successful} ✅ | ${warnings} ⚠️ | ${errors} ❌`);
    console.log('');

    // Detalles por servicio
    Object.entries(this.diagnostics).forEach(([service, data]) => {
      const icon = data.status === 'success' ? '✅' : data.status === 'warning' ? '⚠️' : '❌';

      console.group(`${icon} ${service.toUpperCase()}`);
      console.log('Status:', data.status);
      console.log('Details:', data.details);
      console.groupEnd();
    });

    // Errores recientes
    if (this.errors.length > 0) {
      console.log('');
      console.group('🚨 ERRORES RECIENTES');
      this.errors.slice(-5).forEach((error) => {
        console.log(`[${error.timestamp}] ${error.type}:`, error.details);
      });
      console.groupEnd();
    }

    console.log('');
    console.log('💡 Para ver más detalles, usa: window.errorLogger.getFullReport()');
    console.log('💡 Para copiar errores: window.errorLogger.copyErrorsToClipboard()');
  }

  /**
   * Obtiene un reporte completo para copiar y pegar
   */
  getFullReport() {
    return {
      timestamp: new Date().toISOString(),
      diagnostics: this.diagnostics,
      errors: this.errors,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
      },
    };
  }

  /**
   * Copia los errores al portapapeles para facilitar el debugging
   */
  async copyErrorsToClipboard() {
    try {
      const report = JSON.stringify(this.getFullReport(), null, 2);
      await navigator.clipboard.writeText(report);
      console.log('✅ Reporte copiado al portapapeles');
      return true;
    } catch (error) {
      console.error('❌ Error al copiar al portapapeles:', error);
      console.log('📋 Copia manualmente este reporte:');
      console.log(JSON.stringify(this.getFullReport(), null, 2));
      return false;
    }
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.filter(
        (e) => new Date(e.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
      ).length,
    };

    this.errors.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }
}

// Crear instancia global
const errorLogger = new ErrorLogger();

// Hacer disponible globalmente para debugging
window.errorLogger = errorLogger;

export default errorLogger;


