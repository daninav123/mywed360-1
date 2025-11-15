/**
 * Migración única: Sincronizar activeCategories con wantedServices
 * Ejecutar esta función una vez para migrar datos existentes
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SUPPLIER_CATEGORIES } from '../shared/supplierCategories';

export async function migrateCategoriesSync(userId, weddingId) {
  try {
    console.log('🔄 [Migration] Iniciando sincronización de categorías...');

    // 1. Leer activeCategories del documento del usuario
    const userWeddingRef = doc(db, 'users', userId, 'weddings', weddingId);
    const userWeddingSnap = await getDoc(userWeddingRef);

    if (!userWeddingSnap.exists()) {
      console.log('⚠️ [Migration] Documento de usuario no existe');
      return { success: false, reason: 'no_user_wedding' };
    }

    const activeCategories = userWeddingSnap.data()?.activeCategories || [];

    if (!activeCategories.length) {
      console.log('⚠️ [Migration] No hay categorías activas');
      return { success: false, reason: 'no_active_categories' };
    }

    console.log('📋 [Migration] Categorías activas encontradas:', activeCategories);

    // 2. Convertir IDs a nombres completos
    const categoryNames = activeCategories
      .map((catId) => SUPPLIER_CATEGORIES.find((c) => c.id === catId)?.name)
      .filter(Boolean);

    console.log('📝 [Migration] Nombres de categorías:', categoryNames);

    // 3. Actualizar en weddings/{id}
    const mainWeddingRef = doc(db, 'weddings', weddingId);
    await updateDoc(mainWeddingRef, {
      wantedServices: categoryNames,
      activeCategories: activeCategories,
      updatedAt: new Date().toISOString(),
      _migrated: true,
      _migratedAt: new Date().toISOString(),
    });

    console.log('✅ [Migration] Sincronización completada');
    console.log('   activeCategories:', activeCategories);
    console.log('   wantedServices:', categoryNames);

    return {
      success: true,
      activeCategories,
      wantedServices: categoryNames,
    };
  } catch (error) {
    console.error('❌ [Migration] Error:', error);
    return { success: false, error: error.message };
  }
}

// Función para llamar desde la consola del navegador
window.migrateCategoriesSync = async function () {
  const userId = window.localStorage.getItem('MaLoveApp_user_profile');
  const weddingId = window.localStorage.getItem('MaLoveApp_active_wedding');

  if (!userId || !weddingId) {
    console.error('❌ No se encontró userId o weddingId');
    return;
  }

  const userProfile = JSON.parse(userId);
  const result = await migrateCategoriesSync(userProfile.uid, weddingId);
  console.log('📊 Resultado:', result);

  if (result.success) {
    console.log('✅ Migración completada. Recarga la página para ver los cambios.');
  }

  return result;
};
