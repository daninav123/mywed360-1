import { DEFAULT_PROCESS_LIMIT, processScheduledEmailQueue } from '../services/emailScheduler.js';

const DEFAULT_INTERVAL_MS = 60 * 1000;
const DEFAULT_INITIAL_DELAY_MS = 5 * 1000;

/**
 * Arranca un worker ligero que procesa la cola de correos programados.
 * Devuelve una función para detenerlo.
 *
 * Control por variables de entorno:
 *  - EMAIL_SCHEDULER_DISABLED=1 -> no arranca el worker.
 *  - EMAIL_SCHEDULER_INTERVAL_MS -> intervalo entre ejecuciones (ms).
 *  - EMAIL_SCHEDULER_INITIAL_DELAY_MS -> retraso inicial antes del primer run (ms).
 *  - EMAIL_SCHEDULER_BATCH_LIMIT -> número máximo de correos por ciclo.
 *  - EMAIL_SCHEDULER_DRY_RUN=1 -> ejecuta en modo lectura (no envía correos).
 */
export function startEmailSchedulerWorker() {
  if (process.env.EMAIL_SCHEDULER_DISABLED === '1') {
    console.log('[email-scheduler] Worker deshabilitado por variable de entorno.');
    return () => {};
  }

  if (process.env.NODE_ENV === 'test') {
    return () => {};
  }

  const intervalMs = Number(process.env.EMAIL_SCHEDULER_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    console.warn('[email-scheduler] Intervalo inválido; worker no iniciado.');
    return () => {};
  }

  const initialDelayMs = Number(process.env.EMAIL_SCHEDULER_INITIAL_DELAY_MS || DEFAULT_INITIAL_DELAY_MS);
  const limitCfg = Number(process.env.EMAIL_SCHEDULER_BATCH_LIMIT);
  const limit = Number.isFinite(limitCfg) && limitCfg > 0 ? limitCfg : DEFAULT_PROCESS_LIMIT;
  const dryRun = process.env.EMAIL_SCHEDULER_DRY_RUN === '1';

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await processScheduledEmailQueue({ limit, dryRun });
      if (result.processed > 0) {
        console.log(
          `[email-scheduler] Procesados ${result.processed} correos programados${dryRun ? ' (dry-run)' : ''}.`
        );
      }
    } catch (error) {
      console.error('[email-scheduler] Error procesando la cola de correos programados', error);
    } finally {
      running = false;
    }
  };

  const intervalHandle = setInterval(tick, intervalMs);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  const initialTimeout = setTimeout(tick, Math.max(0, initialDelayMs));
  if (typeof initialTimeout.unref === 'function') {
    initialTimeout.unref();
  }

  return () => {
    clearInterval(intervalHandle);
    clearTimeout(initialTimeout);
  };
}
