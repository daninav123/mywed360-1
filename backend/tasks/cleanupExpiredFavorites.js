/**
 * Tarea de limpieza automática de favoritos expirados
 *
 * Los favoritos tienen un TTL de 30 días para evitar:
 * - Datos obsoletos de proveedores
 * - Información desactualizada
 * - Acumulación innecesaria de datos
 *
 * Ejecución recomendada: Diaria (cron o Cloud Scheduler)
 */

import { db } from '../db.js';
import logger from '../logger.js';

/**
 * Limpia favoritos expirados de TODAS las bodas
 * @returns {Promise<{ deleted: number, errors: number }>}
 */
export async function cleanupExpiredFavorites() {
  const startTime = Date.now();
  const now = new Date();
  let deleted = 0;
  let errors = 0;

  logger.info('[cleanup] 🧹 Iniciando limpieza de favoritos expirados...');

  try {
    // 1. Obtener todas las bodas
    const weddingsSnapshot = await db.collection('weddings').get();

    logger.info(`[cleanup] Analizando ${weddingsSnapshot.size} bodas...`);

    // 2. Para cada boda, limpiar sus favoritos expirados
    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingId = weddingDoc.id;

      try {
        // Obtener favoritos de esta boda
        const favoritesSnapshot = await db
          .collection('weddings')
          .doc(weddingId)
          .collection('suppliers')
          .doc('favorites')
          .collection('items')
          .get();

        // Filtrar expirados
        const expiredDocs = favoritesSnapshot.docs.filter((doc) => {
          const expiresAt = doc.data().expiresAt;
          return expiresAt && new Date(expiresAt) < now;
        });

        if (expiredDocs.length > 0) {
          logger.info(
            `[cleanup] Boda ${weddingId}: Eliminando ${expiredDocs.length} favoritos expirados`
          );

          // Eliminar en batch (máximo 500 por batch)
          const batch = db.batch();
          expiredDocs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          await batch.commit();
          deleted += expiredDocs.length;
        }
      } catch (error) {
        logger.error(`[cleanup] Error procesando boda ${weddingId}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      `[cleanup] ✅ Limpieza completada en ${duration}ms: ${deleted} eliminados, ${errors} errores`
    );

    return { deleted, errors };
  } catch (error) {
    logger.error('[cleanup] Error fatal en limpieza de favoritos:', error);
    throw error;
  }
}

/**
 * Endpoint HTTP para ejecutar la limpieza manualmente o desde Cloud Scheduler
 */
export function setupCleanupRoute(app) {
  app.post('/api/admin/tasks/cleanup-favorites', async (req, res) => {
    try {
      // TODO: Añadir autenticación de admin o API key
      const result = await cleanupExpiredFavorites();
      res.json({
        success: true,
        message: 'Limpieza completada',
        ...result,
      });
    } catch (error) {
      logger.error('[cleanup] Error en endpoint:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

// Para ejecutar manualmente desde CLI:
// node backend/tasks/cleanupExpiredFavorites.js
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredFavorites()
    .then((result) => {
      console.log('✅ Limpieza completada:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en limpieza:', error);
      process.exit(1);
    });
}
