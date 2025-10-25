import i18n from '../i18n';

// Utilidad centralizada para obtener la URL base del backend
// Permite unificar la lógica entre distintos servicios y componentes.
// Prioridad de resolución:
// 1. Variables de entorno VITE_BACKEND_BASE o VITE_BACKEND_BASE_URL
// 2. Entorno local de desarrollo (Vite en :5173 → backend :4004)
// 3. Dominio de producción conocido (Netlify) → backend en Render
// 4. Origen actual como fallback

export function getBackendBase() {
  // 1. Variables de entorno definidas en tiempo de build
  const envBase = import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_BASE;
  if (envBase) {
    return envBase.replace(/\/$/, ''); // quitar barra final
  }

  // 2. Desarrollo local con Vite (frontend :5173)
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location;

    if (origin.includes(':5173')) {
      return origin.replace(':5173', ':4004i18n.t('common.produccion_netlify_backend_render_dominio_conocido')maloveapp.netlify.app') || hostname.endsWith('maloveapp.web.app')) {
      return 'https://maloveapp-backend.onrender.comi18n.t('common.fallback_mismo_origen_return_origin_estamos')';
}
