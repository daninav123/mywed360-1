// Configura manejadores globales de errores para registrar fallos inesperados
import { performanceMonitor } from '../services/PerformanceMonitor';
const HARD_RELOADS = !!(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ENABLE_HARD_RELOADS === 'true');

function isViteOutdatedOptimizeError(event) {
  const message = String(event?.message || event?.error?.message || '');
  if (/Outdated Optimize Dep/i.test(message)) return true;
  const reason = String(event?.reason?.message || event?.reason || '');
  if (/Outdated Optimize Dep/i.test(reason)) return true;
  const targetSrc = typeof event?.target?.src === 'string' ? event.target.src : '';
  if (typeof window !== 'undefined' && targetSrc.includes('/@vite/client')) return true;
  if (/Failed to fetch dynamically imported module/i.test(message) && /@vite|vite/i.test(message)) return true;
  if (/Failed to fetch dynamically imported module/i.test(reason) && /@vite|vite/i.test(reason)) return true;
  return false;
}

function triggerViteHardReload() {
  if (typeof window === 'undefined') return;
  if (!HARD_RELOADS) return;
  if (window.__viteForceReloadLock) return;
  const last = Number(window.__viteReloadAt || 0);
  if (Date.now() - last < 4000) return;
  window.__viteForceReloadLock = true;
  setTimeout(() => {
    try {
      console.warn('[debug] Vite detectó dependencias optimizadas obsoletas. Recargando la página…');
    } catch {}
    window.location.reload();
  }, 60);
  setTimeout(() => {
    window.__viteForceReloadLock = false;
    window.__viteReloadAt = Date.now();
  }, 500);
}

// Maneja errores de ventana (JS runtime)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      try {
        performanceMonitor.logError('window_error', event.error || event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      } catch (e) {
        console.error('Error al registrar window_error', e);
      }
      if (isViteOutdatedOptimizeError(event)) {
        triggerViteHardReload();
      }
    },
    true,
  );

  // Maneja rechazos de promesas no capturados
  window.addEventListener('unhandledrejection', (event) => {
    try {
      performanceMonitor.logError('unhandled_promise_rejection', event.reason);
    } catch (e) {
      console.error('Error al registrar unhandledrejection', e);
    }
    if (isViteOutdatedOptimizeError(event)) {
      triggerViteHardReload();
    }
  });
}
