// scripts/deleteDiscoveredNow.js
// ⚠️ SCRIPT URGENTE: Eliminar TODOS los proveedores "discovered" AHORA

import admin from 'firebase-admin';

// Inicializar usando las mismas credenciales que el backend
if (!admin.apps.length) {
  try {
    // Intentar con credenciales del entorno primero
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Inicializado con FIREBASE_SERVICE_ACCOUNT');
    } else {
      // Fallback a credenciales por defecto
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Inicializado con applicationDefault');
    }
  } catch (error) {
    console.error('❌ Error inicializando:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function deleteAllDiscovered() {
  console.log('\n🗑️  ELIMINACIÓN MASIVA DE PROVEEDORES "DISCOVERED"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let totalDeleted = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Obtener lote de 100 documentos (límite de Firestore)
      const snapshot = await db
        .collection('suppliers')
        .where('status', '==', 'discovered')
        .limit(100)
        .get();

      if (snapshot.empty) {
        hasMore = false;
        console.log('\n✅ No se encontraron más proveedores "discovered"');
        break;
      }

      console.log(`📦 Procesando lote de ${snapshot.size} proveedores...`);

      // Eliminar en batch
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`   🗑️  ${doc.id.substring(0, 20)}... - ${data.name || 'Sin nombre'}`);
        batch.delete(doc.ref);
        totalDeleted++;
      });

      await batch.commit();
      console.log(`   ✅ Lote eliminado (Total: ${totalDeleted})\n`);

      // Pequeña pausa entre lotes para no saturar Firestore
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('❌ Error procesando lote:', error.message);
      hasMore = false;
    }
  }

  // Verificación final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 COMPLETADO: ${totalDeleted} proveedores eliminados`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Doble verificación
  const verifySnapshot = await db
    .collection('suppliers')
    .where('status', '==', 'discovered')
    .limit(1)
    .get();

  if (verifySnapshot.empty) {
    console.log('✅ VERIFICADO: 0 proveedores "discovered" en la base de datos');
  } else {
    console.log('⚠️  ADVERTENCIA: Aún quedan proveedores. Ejecuta el script de nuevo.');
  }

  process.exit(0);
}

// Ejecutar
deleteAllDiscovered().catch((error) => {
  console.error('💥 ERROR FATAL:', error);
  process.exit(1);
});
