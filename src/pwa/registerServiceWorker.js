// Registro del Service Worker generado por vite-plugin-pwa
// Se usa el helper virtual para un registro sencillo con actualización automática
import { registerSW } from 'virtual:pwa-register';

// Registrar y ejecutar limpieza de adjuntos compartidos
registerSW({
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
  }
});
