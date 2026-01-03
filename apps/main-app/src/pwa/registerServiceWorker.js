// Registro del Service Worker generado por vite-plugin-pwa
// Se carga de forma segura solo cuando VITE_ENABLE_PWA === '1'
if (import.meta.env?.VITE_ENABLE_PWA === '1') {
  // importación dinámica para evitar errores cuando el plugin PWA está deshabilitado
  const pwaModuleId = 'virtual:pwa-' + 'register';
  import(pwaModuleId)
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onRegistered(swReg) {
          try {
            const sendCleanup = () => {
              const msg = { type: 'CLEANUP_SHARES' };
              if (swReg?.active) swReg.active.postMessage(msg);
            };
            // Intento inicial y a los 5s para asegurar que el SW esté activo
            sendCleanup();
            setTimeout(sendCleanup, 5000);
          } catch {}
        },
        onNeedRefresh() {
          // Notificar a la app que hay actualización disponible
          try {
            window.dispatchEvent(
              new CustomEvent('pwa:need-refresh', { detail: { update: () => updateSW(true) } })
            );
          } catch {}
        },
        onOfflineReady() {
          try {
            window.dispatchEvent(new CustomEvent('pwa:offline-ready'));
          } catch {}
        },
      });
    })
    .catch(() => {
      // silencioso si el módulo virtual no existe (plugin deshabilitado)
    });
}
