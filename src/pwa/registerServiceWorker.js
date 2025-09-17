// Registro del Service Worker generado por vite-plugin-pwa
// Usa virtual:pwa-register con autoUpdate y eventos para UI de actualización
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onRegistered(swReg) {
    try {
      const sendCleanup = () => {
        const msg = { type: 'CLEANUP_SHARES' };
        if (swReg?.active) swReg.active.postMessage(msg);
      };
      // Intento inicial y a los 5s para asegurar que el SW está activo
      sendCleanup();
      setTimeout(sendCleanup, 5000);
    } catch {}
  },
  onNeedRefresh() {
    // Notificar a la app que hay actualización disponible
    try {
      window.dispatchEvent(new CustomEvent('pwa:need-refresh', { detail: { update: () => updateSW(true) } }));
    } catch {}
  },
  onOfflineReady() {
    try {
      window.dispatchEvent(new CustomEvent('pwa:offline-ready'));
    } catch {}
  }
});
