/**
 * DIAGNÓSTICO COMPLETO DE FIREBASE - BODAS
 * Ejecutar en la consola del navegador (F12)
 */

console.log('🔥 DIAGNÓSTICO FIREBASE - BODAS');
console.log('================================\n');

// Función principal de diagnóstico
async function diagnosticarFirebase() {
  const uid = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';

  // 1. Verificar que Firebase está disponible
  console.log('1️⃣ VERIFICANDO FIREBASE...');
  console.log('===========================');

  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase NO está cargado en window.firebase');
    console.log('💡 Intentando acceder desde imports...');
  }

  // Verificar db
  const { db } = await import('/src/firebaseConfig.jsx');
  console.log('✅ Firestore DB:', db ? 'CONECTADO' : 'NO DISPONIBLE');

  if (!db) {
    console.error('❌ PROBLEMA CRÍTICO: Firestore no está disponible');
    return;
  }

  // 2. Verificar autenticación
  console.log('\n2️⃣ VERIFICANDO AUTENTICACIÓN...');
  console.log('================================');

  const { getFirebaseAuth } = await import('/src/firebaseConfig.jsx');
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    console.error('❌ NO hay usuario autenticado en Firebase Auth');
    console.log('   Usuario esperado:', uid);
    console.log('   Usuario actual:', 'NINGUNO');
    console.log('\n💡 SOLUCIÓN: Necesitas autenticarte en Firebase primero');
    return;
  }

  console.log('✅ Usuario autenticado en Firebase:');
  console.log('   - UID:', currentUser.uid);
  console.log('   - Email:', currentUser.email);
  console.log('   - ¿Coincide?', currentUser.uid === uid ? '✅ SÍ' : '❌ NO');

  // 3. Intentar leer bodas de Firestore
  console.log('\n3️⃣ INTENTANDO LEER BODAS DE FIRESTORE...');
  console.log('==========================================');

  try {
    const { collection, getDocs } = await import('firebase/firestore');

    // Ruta: users/{uid}/weddings
    const path = `users/${currentUser.uid}/weddings`;
    console.log('📍 Ruta:', path);

    const subcolRef = collection(db, 'users', currentUser.uid, 'weddings');
    console.log('📦 Referencia creada:', subcolRef.path);

    console.log('⏳ Consultando Firestore...');
    const snapshot = await getDocs(subcolRef);

    console.log('\n📊 RESULTADOS:');
    console.log('==============');
    console.log('- Documentos encontrados:', snapshot.size);
    console.log('- ¿Está vacío?', snapshot.empty ? '❌ SÍ (NO HAY BODAS)' : '✅ NO');

    if (snapshot.empty) {
      console.warn('\n⚠️ PROBLEMA: No hay documentos en users/' + currentUser.uid + '/weddings');
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   1. Las bodas están en otra ruta');
      console.log('   2. No se han creado bodas para este usuario');
      console.log('   3. Las reglas de Firestore bloquean el acceso');

      // Intentar leer de la colección principal weddings
      console.log('\n🔍 Intentando leer de colección principal "weddings"...');
      const weddingsRef = collection(db, 'weddings');
      const weddingsSnapshot = await getDocs(weddingsRef);
      console.log('   - Bodas en colección principal:', weddingsSnapshot.size);

      if (weddingsSnapshot.size > 0) {
        console.log('\n✅ HAY BODAS EN LA COLECCIÓN PRINCIPAL');
        console.log('   Pero no están vinculadas a users/' + currentUser.uid + '/weddings');

        // Mostrar primeras 3 bodas
        const weddings = [];
        weddingsSnapshot.forEach((doc, idx) => {
          if (idx < 3) {
            weddings.push({ id: doc.id, ...doc.data() });
          }
        });
        console.log('\n   Primeras bodas encontradas:', weddings);
      }
    } else {
      console.log('\n✅ BODAS ENCONTRADAS:');
      const bodas = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        bodas.push({
          id: doc.id,
          ...data,
        });
        console.log(`\n   📋 Boda: ${doc.id}`);
        console.log('      -', JSON.stringify(data, null, 2));
      });

      console.log('\n✅ TOTAL:', bodas.length, 'bodas encontradas');

      // Verificar localStorage
      console.log('\n4️⃣ VERIFICANDO LOCALSTORAGE...');
      console.log('===============================');
      const localKey = `mywed_weddings_${currentUser.uid}`;
      const localData = localStorage.getItem(localKey);
      console.log('   - Clave:', localKey);
      console.log('   - Datos:', localData ? JSON.parse(localData) : 'VACÍO');

      if (!localData) {
        console.log('\n💡 Guardando en localStorage...');
        const weddingsData = {
          weddings: bodas,
          activeWeddingId: bodas[0]?.id || '',
          lastUpdated: Date.now(),
        };
        localStorage.setItem(localKey, JSON.stringify(weddingsData));
        if (bodas[0]?.id) {
          localStorage.setItem(`activeWeddingId_${currentUser.uid}`, bodas[0].id);
        }
        console.log('✅ Datos guardados en localStorage');
        console.log('🔄 REFRESCA LA PÁGINA para aplicar cambios');
      }
    }
  } catch (error) {
    console.error('\n❌ ERROR AL LEER FIRESTORE:');
    console.error('   Tipo:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);

    if (error.code === 'permission-denied') {
      console.error('\n🚫 PROBLEMA: PERMISOS DENEGADOS');
      console.log('\n💡 SOLUCIONES:');
      console.log('   1. Verifica las reglas de Firestore en Firebase Console');
      console.log('   2. Asegúrate de que el usuario tiene permisos');
      console.log('   3. Revisa que estés autenticado correctamente');
    }

    if (error.code === 'unavailable') {
      console.error('\n🌐 PROBLEMA: FIRESTORE NO DISPONIBLE');
      console.log('\n💡 SOLUCIONES:');
      console.log('   1. Verifica tu conexión a internet');
      console.log('   2. Verifica que Firebase esté configurado correctamente');
      console.log('   3. Revisa la consola de Firebase para errores');
    }

    console.error('\n📋 Error completo:', error);
  }
}

// Ejecutar diagnóstico
console.log('⏳ Iniciando diagnóstico...\n');
diagnosticarFirebase().catch((err) => {
  console.error('❌ Error en diagnóstico:', err);
});

// Exportar función
window.diagnosticarFirebase = diagnosticarFirebase;

console.log('\n💡 Puedes volver a ejecutar con: diagnosticarFirebase()');
