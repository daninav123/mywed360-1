// Integración opcional de Sentry (no rompe si no hay DSN o paquete)
const DSN = import.meta?.env?.VITE_SENTRY_DSN || '';

if (DSN) {
  (async () => {
    try {
      const mod1 = '@sentry/react';
      const mod2 = '@sentry/tracing';
      const Sentry = await import(/* @vite-ignore */ mod1);
      const { BrowserTracing } = await import(/* @vite-ignore */ mod2);
      Sentry.init({
        dsn: DSN,
        integrations: [new BrowserTracing()],
        tracesSampleRate: Number(import.meta?.env?.VITE_SENTRY_TRACES) || 0.1,
        release: import.meta?.env?.VITE_APP_VERSION || undefined,
        environment: import.meta?.env?.MODE || undefined,
      });
      // Exponer atajo de captura manual
      if (typeof window !== 'undefined') window.__sentry = Sentry;
    } catch (e) {
      // Paquete no instalado o error de init; continuar sin Sentry
      // console.warn('[Sentry] init opcional no disponible:', e?.message || e);
    }
  })();
}
