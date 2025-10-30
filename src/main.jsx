import React from 'react';
import ReactDOM from 'react-dom/client';

// ✅ CRÍTICO: Cargar antes de renderizar
import './i18n';
import App from './App';
import ErrorBoundary from './components/debug/ErrorBoundary';
import './index.css';
// Auto-fix: Limpiar tokens expirados automáticamente
import { setupAutoFix } from './services/autoFixAuth';
import './utils/compatMigration';

// Ejecutar auto-fix de autenticación
setupAutoFix();

// ⚡ OPTIMIZACIÓN: Lazy load de inicializaciones no críticas
// Estas se cargan DESPUÉS del primer render para no bloquear la UI
setTimeout(() => {
  import('./sentry');
  import('./debug/setupDebug');
  import('./utils/consoleCommands');
  import('./debug/devServiceWorkerCleanup');
  import('./pwa/setupPwaToasts');
  import('./utils/webVitals');

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
