import { moderatePendingMomentosPhotos } from '../services/momentosModerationService.js';

const DEFAULT_INTERVAL_MS = Math.max(
  60 * 1000,
  Number(process.env.MOMENTOS_MODERATION_INTERVAL_MS || 2 * 60 * 1000)
);
const DEFAULT_INITIAL_DELAY_MS = Number(
  process.env.MOMENTOS_MODERATION_INITIAL_DELAY_MS || 20 * 1000
);
const DEFAULT_BATCH_LIMIT = Math.max(
  1,
  Number(process.env.MOMENTOS_MODERATION_BATCH_LIMIT || 10)
);

export function startMomentosModerationWorker() {
  if (process.env.MOMENTOS_AUTO_MODERATION_DISABLED === '1') {
    console.log('[momentos-moderation] Worker deshabilitado por variable de entorno.');
    return () => {};
  }

  if (process.env.NODE_ENV === 'test') {
    return () => {};
  }

  if (!Number.isFinite(DEFAULT_INTERVAL_MS) || DEFAULT_INTERVAL_MS <= 0) {
    console.warn('[momentos-moderation] Intervalo inválido; worker no iniciado.');
    return () => {};
  }

  let running = false;
  const dryRun = process.env.MOMENTOS_MODERATION_DRY_RUN === '1';

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await moderatePendingMomentosPhotos({
        limit: DEFAULT_BATCH_LIMIT,
        dryRun,
      });
      if (result.processed > 0) {
        console.log(
          `[momentos-moderation] ${dryRun ? '[dry-run] ' : ''}Procesadas ${result.processed} fotos para moderación automática.`
        );
      }
    } catch (error) {
      console.error('[momentos-moderation] Error ejecutando moderación automática', error);
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
