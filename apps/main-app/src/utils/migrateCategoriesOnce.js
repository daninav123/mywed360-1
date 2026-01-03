/**
 * Migración automática de categorías una sola vez
 * Se ejecuta cuando el usuario inicia sesión
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SUPPLIER_CATEGORIES } from '../shared/supplierCategories';

let migrationExecuted = false;

export async function migrateCategoriesOnce(userId) {
  if (migrationExecuted) {
    console.log('[MigrationOnce] Ya ejecutada, omitiendo');
    return;
  }

  if (!userId || !db) {
    console.log('[MigrationOnce] Sin userId o db, omitiendo');
    return;
  }

  try {
    console.log('[MigrationOnce] 🔄 Iniciando migración automática...');

    // 1. Buscar la boda del usuario
    const weddingsRef = collection(db, 'users', userId, 'weddings');
    const weddingsSnap = await getDocs(weddingsRef);

    if (weddingsSnap.empty) {
      console.log('[MigrationOnce] No hay bodas, omitiendo');
      migrationExecuted = true;
      return;
    }

    // 2. Migrar cada boda
    for (const weddingDoc of weddingsSnap.docs) {
      const weddingId = weddingDoc.id;
      const weddingData = weddingDoc.data();
      const activeCategories = weddingData.activeCategories || [];

      if (activeCategories.length === 0) {
        console.log(`[MigrationOnce] Boda ${weddingId}: sin categorías`);
        continue;
      }

      // 3. Verificar si ya está migrada
      const mainWeddingRef = doc(db, 'weddings', weddingId);
      const mainWeddingSnap = await getDoc(mainWeddingRef);

      if (mainWeddingSnap.exists() && mainWeddingSnap.data()?.wantedServices?.length > 0) {
        console.log(`[MigrationOnce] Boda ${weddingId}: ya migrada`);
        continue;
      }

      // 4. Convertir IDs a nombres
      const categoryNames = activeCategories
        .map((catId) => SUPPLIER_CATEGORIES.find((c) => c.id === catId)?.name)
        .filter(Boolean);

      console.log(`[MigrationOnce] Boda ${weddingId}: migrando ${categoryNames.length} categorías`);

      // 5. Escribir en weddings/{id}
      await setDoc(
        mainWeddingRef,
        {
          activeCategories: activeCategories,
          wantedServices: categoryNames,
          updatedAt: new Date().toISOString(),
          _migratedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log(`[MigrationOnce] ✅ Boda ${weddingId} migrada:`, categoryNames);
    }

    migrationExecuted = true;
    console.log('[MigrationOnce] ✅ Migración completada');
  } catch (error) {
    console.error('[MigrationOnce] ❌ Error:', error);
  }
}

// Resetear flag (solo para desarrollo)
export function resetMigrationFlag() {
  migrationExecuted = false;
}
