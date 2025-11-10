// Limpia service workers y caches residuales que puedan interferir con HMR en desarrollo.
// En especial, un service worker antiguo puede devolver una versión cacheada de `/@vite/client`
// con un token WebSocket obsoleto, provocando errores 400 al conectar con el HMR de Vite.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          // Evita tocar SW que no controlen el origen actual.
          const scope = registration.scope || '';
          if (!scope || scope.includes(window.location.origin)) {
            registration.unregister().catch(() => {});
          }
        });
      })
      .catch(() => {});
  }

  if (typeof caches !== 'undefined' && caches?.keys) {
    caches
      .keys()
      .then((keys) =>
        keys.filter((key) => /(?:workbox|pwa|vite|sw)/i.test(key)).forEach((key) => caches.delete(key).catch(() => {}))
      )
      .catch(() => {});
  }
}

