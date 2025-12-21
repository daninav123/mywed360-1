/**
 * Cron Job para Procesar Emails Programados
 * 
 * Este job debe ejecutarse cada 1-5 minutos para procesar
 * la cola de emails programados (emailAutomationQueue).
 * 
 * Configuración en Cloud Scheduler / Render Cron / etc:
 * - Frecuencia: cada 1 minuto o cada 5 minutos (ver render.yaml)
 * - URL: POST https://tu-backend.com/api/email-automation/schedule/process
 * - Header: x-cron-key: ${EMAIL_AUTOMATION_CRON_KEY}
 */

import { processScheduledEmailQueue } from '../services/emailScheduler.js';

/**
 * Ejecuta el procesamiento de emails programados.
 * 
 * @param {Object} options
 * @param {number} options.limit - Máximo de emails a procesar por ejecución
 * @param {boolean} options.dryRun - Si es true, no envía emails (solo simula)
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function runEmailSchedulerJob({ limit = 25, dryRun = false } = {}) {
  const startTime = Date.now();
  
  console.log('[emailSchedulerCron] Iniciando job de emails programados...', {
    limit,
    dryRun,
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await processScheduledEmailQueue({ limit, dryRun });
    
    const duration = Date.now() - startTime;
    
    console.log('[emailSchedulerCron] Job completado exitosamente', {
      processed: result.processed,
      successCount: result.successCount,
      failedCount: result.failedCount,
      skippedCount: result.skippedCount,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      ...result,
      durationMs: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[emailSchedulerCron] Error en job de emails programados', {
      error: error.message,
      stack: error.stack,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message,
      durationMs: duration,
    };
  }
}

/**
 * Handler para ejecución manual o desde cron externo.
 * Uso: node backend/jobs/emailSchedulerCron.js
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[emailSchedulerCron] Ejecutando manualmente...');
  
  runEmailSchedulerJob({ limit: 25, dryRun: false })
    .then((result) => {
      console.log('[emailSchedulerCron] Resultado:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('[emailSchedulerCron] Error fatal:', error);
      process.exit(1);
    });
}

export default runEmailSchedulerJob;
