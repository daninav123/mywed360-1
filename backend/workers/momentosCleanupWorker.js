import { cleanupMomentosAlbums, MOMENTOS_RETENTION_DAYS } from '../services/momentosCleanupService.js';

const DEFAULT_INTERVAL_MS = Number(process.env.MOMENTOS_CLEANUP_INTERVAL_MS || 6 * 60 * 60 * 1000); // cada 6 horas
const DEFAULT_INITIAL_DELAY_MS = Number(
  process.env.MOMENTOS_CLEANUP_INITIAL_DELAY_MS || 30 * 1000
); // esperar 30s al arranque
const DEFAULT_BATCH_LIMIT = Math.max(
  1,
  Number(process.env.MOMENTOS_CLEANUP_BATCH_LIMIT || 3)
);

export function startMomentosCleanupWorker() {
  if (process.env.MOMENTOS_CLEANUP_DISABLED === '1') {
    console.log('[momentos-cleanup] Worker deshabilitado mediante variable de entorno.');
    return () => {};
  }

  if (process.env.NODE_ENV === 'test') {
    return () => {};
  }

  if (!Number.isFinite(DEFAULT_INTERVAL_MS) || DEFAULT_INTERVAL_MS <= 0) {
    console.warn('[momentos-cleanup] Intervalo inválido; worker no iniciado.');
    return () => {};
  }

  const dryRun = process.env.MOMENTOS_CLEANUP_DRY_RUN === '1';
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await cleanupMomentosAlbums({
        limit: DEFAULT_BATCH_LIMIT,
        dryRun,
        now: new Date(),
      });

      if (result.processed > 0) {
        console.log(
          `[momentos-cleanup] ${
            dryRun ? '[dry-run] ' : ''
          }Limpieza procesada para ${result.processed} álbumes (retención ${MOMENTOS_RETENTION_DAYS} días).`
        );
      }
    } catch (error) {
      console.error('[momentos-cleanup] Error en el worker', error);
    } finally {
      running = false;
    }
  };

  const intervalHandle = setInterval(tick, DEFAULT_INTERVAL_MS);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  const initialHandle = setTimeout(tick, Math.max(0, DEFAULT_INITIAL_DELAY_MS));
  if (typeof initialHandle.unref === 'function') {
    initialHandle.unref();
  }

  return () => {
    clearInterval(intervalHandle);
    clearTimeout(initialHandle);
  };
}
