/**
 * 🚨 HERRAMIENTA DE DIAGNÓSTICO DE RENDIMIENTO
 *
 * Detecta:
 * - Intervals no limpiados
 * - Listeners de Firebase acumulados
 * - Funciones bloqueantes
 * - Memoria consumida
 *
 * USO EN CONSOLA:
 * import('/src/utils/performanceDiagnostic.js').then(m => m.startDiagnostic())
 */

let intervalCount = 0;
let timeoutCount = 0;
const activeIntervals = new Map();
const activeTimeouts = new Map();
const firestoreListeners = new Set();

// Interceptar setInterval
const originalSetInterval = window.setInterval;
window.setInterval = function (...args) {
  const id = originalSetInterval(...args);
  intervalCount++;

  // Capturar stack trace para saber de dónde viene
  const stack = new Error().stack;
  activeIntervals.set(id, {
    created: Date.now(),
    stack: stack,
    args: args[1], // delay
  });


  return id;
};

// Interceptar clearInterval
const originalClearInterval = window.clearInterval;
window.clearInterval = function (id) {
  if (activeIntervals.has(id)) {
    intervalCount--;
    activeIntervals.delete(id);
    // console.log(`✅ [Diagnostic] Interval limpiado. Total activos: ${intervalCount}`);
  }
  return originalClearInterval(id);
};

// Interceptar setTimeout
const originalSetTimeout = window.setTimeout;
window.setTimeout = function (...args) {
  const id = originalSetTimeout(...args);
  timeoutCount++;

  const stack = new Error().stack;
  activeTimeouts.set(id, {
    created: Date.now(),
    stack: stack,
    delay: args[1],
  });

  return id;
};

// Interceptar clearTimeout
const originalClearTimeout = window.clearTimeout;
window.clearTimeout = function (id) {
  if (activeTimeouts.has(id)) {
    timeoutCount--;
    activeTimeouts.delete(id);
  }
  return originalClearTimeout(id);
};

// Monitor de re-renders (React DevTools API)
let renderCount = 0;
let lastRenderTime = Date.now();

export function trackRender(componentName) {
  renderCount++;
  const now = Date.now();
  const timeSinceLast = now - lastRenderTime;

  if (timeSinceLast < 100) {
  }

  lastRenderTime = now;
}

// Monitor de memoria
function getMemoryInfo() {
  if (performance.memory) {
    return {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
    };
  }
  return 'No disponible';
}

// Detectar listeners de Firebase
export function monitorFirestore() {
  if (window.__firestoreListeners__) {
    return window.__firestoreListeners__.size;
  }

  // Intentar detectar listeners activos
  try {
    // Firebase guarda listeners en objetos internos
    return 'No detectable directamente';
  } catch {
    return 'Error';
  }
}

// Reporte completo
export function generateReport() {
  console.group('📊 REPORTE DE RENDIMIENTO');




  // console.log('💾 MEMORIA:', getMemoryInfo());

  // console.log('🔥 FIRESTORE LISTENERS:', monitorFirestore());

  // Advertencias
  if (intervalCount > 5) {
    // console.error('🚨 CRÍTICO: Demasiados intervals activos!', intervalCount);
  }

  if (renderCount > 100) {
    // console.warn('⚠️ ADVERTENCIA: Muchos re-renders detectados:', renderCount);
  }

  console.groupEnd();

  return {
    intervals: intervalCount,
    timeouts: timeoutCount,
    renders: renderCount,
    memory: getMemoryInfo(),
  };
}

// Auto-reporte cada 10 segundos
let diagnosticInterval = null;

export function startDiagnostic() {
  // console.log('🔍 Diagnóstico iniciado. Generando reporte cada 10 segundos...');

  if (diagnosticInterval) {
    clearInterval(diagnosticInterval);
  }

  // Reporte inicial
  generateReport();

  // Reportes periódicos
  diagnosticInterval = setInterval(() => {
    // console.log('⏱️ Reporte automático:');
    generateReport();
  }, 10000);

  // console.log('Para detener: stopDiagnostic()');
  // console.log('Para reporte manual: generateReport()');
}

export function stopDiagnostic() {
  if (diagnosticInterval) {
    clearInterval(diagnosticInterval);
    diagnosticInterval = null;
    // console.log('✋ Diagnóstico detenido');
  }
}

// Función de emergencia: Limpiar TODOS los intervals
export function emergencyCleanup() {
  // console.warn('🚨 LIMPIEZA DE EMERGENCIA - Deteniendo todos los intervals');

  const allIntervalIds = Array.from(activeIntervals.keys());
  allIntervalIds.forEach((id) => {
    try {
      clearInterval(id);
      // console.log(`🧹 Limpiado interval ${id}`);
    } catch (e) {
      // console.error(`Error limpiando interval ${id}:`, e);
    }
  });

  activeIntervals.clear();
  intervalCount = 0;

  // console.log('✅ Limpieza completa. Intervals activos:', intervalCount);
}

// Exponer funciones en window para fácil acceso desde consola
if (typeof window !== 'undefined') {
  window.__performanceDiagnostic__ = {
    start: startDiagnostic,
    stop: stopDiagnostic,
    report: generateReport,
    emergency: emergencyCleanup,
    getActiveIntervals: () => Array.from(activeIntervals.entries()),
    getActiveTimeouts: () => Array.from(activeTimeouts.entries()),
  };

  // console.log('✅ Diagnostic tools disponibles en: window.__performanceDiagnostic__');
}

export default {
  startDiagnostic,
  stopDiagnostic,
  generateReport,
  emergencyCleanup,
  trackRender,
};
