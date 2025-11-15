/**
 * Script para sincronizar manualmente activeCategories → wantedServices
 * Ejecutar en consola del navegador
 */

async function syncCategories() {
  console.log('🔄 Iniciando sincronización manual...');

  // Obtener datos de localStorage
  const profile = JSON.parse(localStorage.getItem('MaLoveApp_user_profile') || '{}');
  const weddingId = localStorage.getItem('MaLoveApp_active_wedding');

  if (!profile.uid || !weddingId) {
    console.error('❌ No hay sesión activa');
    return;
  }

  console.log('📋 UserId:', profile.uid);
  console.log('📋 WeddingId:', weddingId);

  // Importar Firestore
  const { doc, getDoc, setDoc } = await import(
    'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'
  );
  const db = window.__FIREBASE_DB__;

  if (!db) {
    console.error('❌ Firebase no disponible');
    return;
  }

  try {
    // 1. Leer activeCategories de users/{uid}/weddings/{id}
    const userWeddingRef = doc(db, 'users', profile.uid, 'weddings', weddingId);
    const userWeddingSnap = await getDoc(userWeddingRef);

    if (!userWeddingSnap.exists()) {
      console.error('❌ Documento users/{uid}/weddings/{id} no existe');
      return;
    }

    const activeCategories = userWeddingSnap.data()?.activeCategories || [];
    console.log('✅ activeCategories encontradas:', activeCategories);

    if (activeCategories.length === 0) {
      console.warn('⚠️ No hay categorías activas');
      return;
    }

    // 2. Cargar SUPPLIER_CATEGORIES
    const SUPPLIER_CATEGORIES = [
      { id: 'fotografia', name: 'Fotografía' },
      { id: 'video', name: 'Vídeo' },
      { id: 'catering', name: 'Catering' },
      { id: 'venue', name: 'Venue' },
      { id: 'musica', name: 'Música' },
      { id: 'flores', name: 'Flores' },
      { id: 'decoracion', name: 'Decoración' },
      { id: 'tarta', name: 'Tarta' },
      { id: 'invitaciones', name: 'Invitaciones' },
      { id: 'vestidos-trajes', name: 'Vestidos y trajes' },
      { id: 'peluqueria-maquillaje', name: 'Peluquería y maquillaje' },
      { id: 'transporte', name: 'Transporte' },
      { id: 'dj', name: 'DJ' },
      { id: 'animacion', name: 'Animación' },
      { id: 'fotomatones', name: 'Fotomatones' },
    ];

    // 3. Convertir IDs a nombres
    const categoryNames = activeCategories
      .map((catId) => SUPPLIER_CATEGORIES.find((c) => c.id === catId)?.name)
      .filter(Boolean);

    console.log('📝 Nombres convertidos:', categoryNames);

    // 4. Escribir en weddings/{id}
    const weddingRef = doc(db, 'weddings', weddingId);
    await setDoc(
      weddingRef,
      {
        activeCategories: activeCategories,
        wantedServices: categoryNames,
        updatedAt: new Date().toISOString(),
        _manualSync: true,
      },
      { merge: true }
    );

    console.log('✅ SINCRONIZACIÓN COMPLETADA');
    console.log('   activeCategories:', activeCategories);
    console.log('   wantedServices:', categoryNames);

    // 5. Verificar
    const verifySnap = await getDoc(weddingRef);
    console.log('🔍 Verificación:');
    console.log('   activeCategories:', verifySnap.data()?.activeCategories);
    console.log('   wantedServices:', verifySnap.data()?.wantedServices);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar
syncCategories();
