/**
 * Job de Retención Automática de Papelera
 * 
 * Elimina emails en papelera con más de 30 días.
 * Debe ejecutarse diariamente (recomendado: 2am).
 * 
 * Configuración en cron:
 * - Frecuencia: 0 2 * * * (diario a las 2am)
 * - URL: POST https://tu-backend.com/api/email-automation/trash/cleanup
 * - Header: x-cron-key: ${EMAIL_AUTOMATION_CRON_KEY}
 */

import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../db.js';

const RETENTION_DAYS = 30; // Días antes de eliminar permanentemente
const BATCH_SIZE = 500; // Máximo de Firestore batch
const AUDIT_COLLECTION = 'emailRetentionAudit';

/**
 * Limpia emails en papelera con más de 30 días
 * 
 * @param {Object} options
 * @param {number} options.retentionDays - Días de retención (default: 30)
 * @param {boolean} options.dryRun - Si es true, no elimina (solo cuenta)
 * @returns {Promise<Object>} Resultado de la limpieza
 */
export async function cleanupOldTrashEmails({
  retentionDays = RETENTION_DAYS,
  dryRun = false,
} = {}) {
  const startTime = Date.now();
  
  console.log('[emailTrashRetention] Iniciando limpieza de papelera...', {
    retentionDays,
    dryRun,
    timestamp: new Date().toISOString(),
  });

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - retentionDays);
  const thresholdIso = thresholdDate.toISOString();
  
  console.log('[emailTrashRetention] Eliminando emails anteriores a:', thresholdIso);

  let totalDeleted = 0;
  let totalScanned = 0;
  let errors = 0;
  const userStats = {}; // { uid: count }

  try {
    // Paso 1: Buscar emails en trash antigups en colección global
    console.log('[emailTrashRetention] Buscando en colección global mails/...');
    
    const globalQuery = db.collection('mails')
      .where('folder', '==', 'trash')
      .where('updatedAt', '<', thresholdIso);
    
    const globalSnapshot = await globalQuery.limit(BATCH_SIZE * 2).get();
    
    console.log(`[emailTrashRetention] Encontrados ${globalSnapshot.size} emails en colección global`);
    totalScanned += globalSnapshot.size;

    if (globalSnapshot.size > 0 && !dryRun) {
      // Eliminar en batches
      const batches = [];
      let currentBatch = db.batch();
      let batchCount = 0;

      for (const doc of globalSnapshot.docs) {
        currentBatch.delete(doc.ref);
        batchCount++;
        totalDeleted++;

        if (batchCount >= BATCH_SIZE) {
          batches.push(currentBatch.commit());
          currentBatch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        batches.push(currentBatch.commit());
      }

      await Promise.all(batches);
      console.log(`[emailTrashRetention] Eliminados ${totalDeleted} emails de colección global`);
    }

    // Paso 2: Buscar en subcolecciones de usuarios
    console.log('[emailTrashRetention] Buscando en subcolecciones users/{uid}/mails/...');
    
    const usersSnapshot = await db.collection('users').limit(200).get();
    console.log(`[emailTrashRetention] Revisando ${usersSnapshot.size} usuarios`);

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      
      try {
        const userMailsQuery = db.collection('users')
          .doc(uid)
          .collection('mails')
          .where('folder', '==', 'trash')
          .where('updatedAt', '<', thresholdIso);
        
        const userMailsSnapshot = await userMailsQuery.limit(BATCH_SIZE).get();
        
        if (userMailsSnapshot.size > 0) {
          console.log(`[emailTrashRetention] Usuario ${uid}: ${userMailsSnapshot.size} emails antiguos`);
          totalScanned += userMailsSnapshot.size;
          userStats[uid] = userMailsSnapshot.size;

          if (!dryRun) {
            const batches = [];
            let currentBatch = db.batch();
            let batchCount = 0;

            for (const doc of userMailsSnapshot.docs) {
              currentBatch.delete(doc.ref);
              batchCount++;
              totalDeleted++;

              if (batchCount >= BATCH_SIZE) {
                batches.push(currentBatch.commit());
                currentBatch = db.batch();
                batchCount = 0;
              }
            }

            if (batchCount > 0) {
              batches.push(currentBatch.commit());
            }

            await Promise.all(batches);
          }
        }
      } catch (userError) {
        console.error(`[emailTrashRetention] Error procesando usuario ${uid}:`, userError);
        errors++;
      }
    }

    // Paso 3: Limpiar emailFolderAssignments huérfanos
    if (!dryRun && totalDeleted > 0) {
      console.log('[emailTrashRetention] Limpiando emailFolderAssignments huérfanos...');
      
      // Esto es más complejo, por ahora solo log
      // TODO: Implementar limpieza de assignments sin email correspondiente
    }

    const duration = Date.now() - startTime;
    const result = {
      success: true,
      retentionDays,
      thresholdDate: thresholdIso,
      totalScanned,
      totalDeleted: dryRun ? 0 : totalDeleted,
      errors,
      durationMs: duration,
      userStats,
      dryRun,
      timestamp: new Date().toISOString(),
    };

    // Registrar en auditoría
    if (!dryRun) {
      try {
        await db.collection(AUDIT_COLLECTION).add({
          ...result,
          createdAt: FieldValue.serverTimestamp(),
        });
        
        console.log('[emailTrashRetention] Auditoría guardada');
      } catch (auditError) {
        console.error('[emailTrashRetention] Error guardando auditoría:', auditError);
      }
    }

    console.log('[emailTrashRetention] Limpieza completada', result);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[emailTrashRetention] Error en limpieza:', error);

    const result = {
      success: false,
      error: error.message,
      stack: error.stack,
      totalScanned,
      totalDeleted,
      errors,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    };

    // Intentar guardar error en auditoría
    try {
      await db.collection(AUDIT_COLLECTION).add({
        ...result,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (auditError) {
      console.error('[emailTrashRetention] Error guardando auditoría de error:', auditError);
    }

    return result;
  }
}

/**
 * Obtiene estadísticas de retención
 */
export async function getRetentionStats(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshot = await db.collection(AUDIT_COLLECTION)
      .where('createdAt', '>=', startDate)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    const runs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp || data.createdAt?.toDate?.()?.toISOString?.() || null,
        totalDeleted: data.totalDeleted || 0,
        totalScanned: data.totalScanned || 0,
        errors: data.errors || 0,
        durationMs: data.durationMs || null,
        success: data.success !== false,
      };
    });
    
    const totalDeleted = runs.reduce((sum, run) => sum + run.totalDeleted, 0);
    const totalScanned = runs.reduce((sum, run) => sum + run.totalScanned, 0);
    const totalErrors = runs.reduce((sum, run) => sum + run.errors, 0);
    const successfulRuns = runs.filter(run => run.success).length;
    
    return {
      period: `${days} days`,
      totalRuns: runs.length,
      successfulRuns,
      failedRuns: runs.length - successfulRuns,
      totalDeleted,
      totalScanned,
      totalErrors,
      avgDeletedPerRun: runs.length > 0 ? totalDeleted / runs.length : 0,
      lastRun: runs.length > 0 ? runs[0] : null,
      runs: runs.slice(0, 10), // Últimas 10 ejecuciones
    };
  } catch (error) {
    console.error('[emailTrashRetention] Error obteniendo stats:', error);
    throw error;
  }
}

/**
 * Handler para ejecución manual o desde cron
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[emailTrashRetention] Ejecutando manualmente...');
  
  const dryRun = process.argv.includes('--dry-run');
  const retentionDays = process.argv.includes('--days')
    ? parseInt(process.argv[process.argv.indexOf('--days') + 1], 10)
    : RETENTION_DAYS;
  
  cleanupOldTrashEmails({ retentionDays, dryRun })
    .then((result) => {
      console.log('[emailTrashRetention] Resultado:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('[emailTrashRetention] Error fatal:', error);
      process.exit(1);
    });
}

export default cleanupOldTrashEmails;
