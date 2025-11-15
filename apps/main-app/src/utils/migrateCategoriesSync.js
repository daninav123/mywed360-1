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

// 🔄 AUTO-EJECUTAR: Migrar automáticamente si es necesario
async function autoMigrate() {
  try {
    // Esperar a que Firebase esté listo
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const userProfileStr = window.localStorage.getItem('MaLoveApp_user_profile');
    const weddingId = window.localStorage.getItem('MaLoveApp_active_wedding');

    if (!userProfileStr || !weddingId) {
      console.log('⏭️ [AutoMigration] No hay sesión activa, omitiendo migración');
      return;
    }

    const userProfile = JSON.parse(userProfileStr);
    const userId = userProfile.uid;

    if (!userId || !db) {
      console.log('⏭️ [AutoMigration] Firebase no disponible, omitiendo migración');
      return;
    }

    // Verificar si ya se migró
    const mainWeddingRef = doc(db, 'weddings', weddingId);
    const mainWeddingSnap = await getDoc(mainWeddingRef);

    if (mainWeddingSnap.exists() && mainWeddingSnap.data()?._migrated) {
      console.log('✅ [AutoMigration] Ya migrado previamente');
      return;
    }

    // Verificar si necesita migración
    const userWeddingRef = doc(db, 'users', userId, 'weddings', weddingId);
    const userWeddingSnap = await getDoc(userWeddingRef);

    if (!userWeddingSnap.exists()) {
      console.log('⏭️ [AutoMigration] No hay documento de usuario');
      return;
    }

    const activeCategories = userWeddingSnap.data()?.activeCategories || [];
    const wantedServices = mainWeddingSnap.exists()
      ? mainWeddingSnap.data()?.wantedServices || []
      : [];

    // Si hay activeCategories pero no wantedServices, migrar
    if (activeCategories.length > 0 && wantedServices.length === 0) {
      console.log('🔄 [AutoMigration] Detectada necesidad de migración, ejecutando...');
      const result = await migrateCategoriesSync(userId, weddingId);

      if (result.success) {
        console.log('✅ [AutoMigration] Migración completada automáticamente');
        console.log('   📋 Categorías sincronizadas:', result.wantedServices);

        // Recargar la página para aplicar cambios
        setTimeout(() => {
          console.log('🔄 Recargando página...');
          window.location.reload();
        }, 2000);
      }
    } else {
      console.log('✅ [AutoMigration] Categorías ya sincronizadas');
    }
  } catch (error) {
    console.error('❌ [AutoMigration] Error:', error);
  }
}

// Ejecutar auto-migración cuando cargue la página
if (typeof window !== 'undefined') {
  autoMigrate();
}
