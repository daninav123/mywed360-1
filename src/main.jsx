import React from 'react';
import ReactDOM from 'react-dom/client';

// Asegurar inicialización de i18n antes de cualquier uso de useTranslation
import './i18n';
import './sentry';
import App from './App';
import ErrorBoundary from './components/debug/ErrorBoundary';
import './debug/setupDebug';
// Registrar comandos de diagnóstico globales antes de montar la aplicación
import './utils/consoleCommands';
// Compat: migración de claves/eventos lovenda_* -> mywed360_*
import './utils/compatMigration';
import './index.css';
// Registrar SW solo si PWA está habilitado
if (import.meta.env?.VITE_ENABLE_PWA === '1') {
  import('./pwa/registerServiceWorker');
}
import './pwa/setupPwaToasts';
import './utils/webVitals';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
