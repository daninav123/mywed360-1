// routes/migrate-suppliers.js
// Script temporal para migrar proveedores existentes y añadir campos necesarios

import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

const router = express.Router();

// POST /api/migrate-suppliers/fix-registered
// Actualiza proveedores existentes para marcarlos como registered
router.post('/fix-registered', async (req, res) => {
  try {
    const db = admin.firestore();

    console.log('🔄 [MIGRATION] Iniciando migración de proveedores...');

    // 1. Obtener TODOS los proveedores de la colección suppliers
    const suppliersSnapshot = await db.collection('suppliers').get();

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const batch = db.batch();
    let batchCount = 0;
    const MAX_BATCH = 500; // Firestore límite

    for (const doc of suppliersSnapshot.docs) {
      const data = doc.data();

      // Verificar si ya tiene los campos necesarios
      const needsUpdate =
        data.registered === undefined ||
        data.name === undefined ||
        data.category === undefined ||
        data.tags === undefined;

      if (!needsUpdate) {
        skipped++;
        continue;
      }

      // Preparar actualización
      const updates = {};

      // Marcar como registrado SI tiene email y perfil completo
      if (data.registered === undefined) {
        updates.registered = !!(data.contact?.email && data.profile?.name);
      }

      // Añadir name en nivel superior
      if (data.name === undefined && data.profile?.name) {
        updates.name = data.profile.name;
      }

      // Añadir category en nivel superior
      if (data.category === undefined && data.profile?.category) {
        updates.category = data.profile.category;
      }

      // Añadir tags
      if (data.tags === undefined) {
        updates.tags = data.business?.services || [];
      }

      // Añadir matchScore si no existe
      if (!data.metrics?.matchScore) {
        updates['metrics.matchScore'] = 50;
      }

      batch.update(doc.ref, updates);
      batchCount++;
      updated++;

      // Commit batch si alcanza el límite
      if (batchCount >= MAX_BATCH) {
        await batch.commit();
        console.log(`✅ [MIGRATION] Batch de ${batchCount} proveedores actualizado`);
        batchCount = 0;
      }
    }

    // Commit final
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ [MIGRATION] Batch final de ${batchCount} proveedores actualizado`);
    }

    console.log(`\n✅ [MIGRATION] Migración completada:`);
    console.log(`   - Actualizados: ${updated}`);
    console.log(`   - Sin cambios: ${skipped}`);
    console.log(`   - Errores: ${errors}\n`);

    logger.info('[MIGRATION] Proveedores migrados', {
      updated,
      skipped,
      errors,
    });

    res.json({
      success: true,
      message: 'Migración completada',
      stats: {
        updated,
        skipped,
        errors,
        total: suppliersSnapshot.size,
      },
    });
  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    logger.error('[MIGRATION] Error en migración', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/migrate-suppliers/check
// Verificar cuántos proveedores necesitan migración
router.get('/check', async (req, res) => {
  try {
    const db = admin.firestore();
    const suppliersSnapshot = await db.collection('suppliers').get();

    let needsMigration = 0;
    let alreadyMigrated = 0;
    let total = suppliersSnapshot.size;

    suppliersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const hasAllFields =
        data.registered !== undefined &&
        data.name !== undefined &&
        data.category !== undefined &&
        data.tags !== undefined;

      if (hasAllFields) {
        alreadyMigrated++;
      } else {
        needsMigration++;
      }
    });

    res.json({
      success: true,
      stats: {
        total,
        needsMigration,
        alreadyMigrated,
        percentage: total > 0 ? Math.round((alreadyMigrated / total) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
