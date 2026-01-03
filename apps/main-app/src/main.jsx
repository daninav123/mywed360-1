import React from 'react';
import ReactDOM from 'react-dom/client';

// ✅ CRÍTICO: Cargar antes de renderizar
import './i18n';
import App from './App';
import ErrorBoundary from './components/debug/ErrorBoundary';
import './index.css';
// Auto-fix: Limpiar tokens expirados automáticamente
// import { setupAutoFix } from './services/autoFixAuth'; // DESHABILITADO - Causaba lentitud
import './utils/compatMigration';

// DESHABILITADO: autoFixAuth causaba lentitud del sistema
// Si necesitas activarlo manualmente, usa en consola: window.setupAutoFix()
// if (import.meta.env.DEV) {
//   setupAutoFix();
// }

// ⚡ OPTIMIZACIÓN: Lazy load de inicializaciones no críticas
// Estas se cargan DESPUÉS del primer render para no bloquear la UI
setTimeout(() => {
  import('./sentry');
  import('./debug/setupDebug');
  import('./utils/consoleCommands');
  import('./debug/devServiceWorkerCleanup');
  import('./pwa/setupPwaToasts');
  import('./utils/webVitals');

  // 🚨 DIAGNÓSTICO DE RENDIMIENTO (solo en desarrollo)
  if (import.meta.env.DEV) {
    import('./utils/performanceDiagnostic').then((module) => {
      // console.log('%c🔍 Diagnóstico de rendimiento activado', 'color: #00ff00; font-weight: bold');
      // console.log('Usa en consola: window.__performanceDiagnostic__.report()');
      // Auto-start después de 5 segundos
      setTimeout(() => module.startDiagnostic(), 5000);
    });
  }

  // Registrar SW solo si PWA está habilitado
  if (import.meta.env?.VITE_ENABLE_PWA === '1') {
    import('./pwa/registerServiceWorker');
  }
}, 0);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
