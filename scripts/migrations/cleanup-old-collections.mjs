// scripts/migrations/cleanup-old-collections.mjs
// Elimina colecciones antiguas después de migración exitosa

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('C:\\Users\\Administrator\\Downloads\\serviceAccount.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const DRY_RUN = !process.argv.includes('--force');
const BATCH_SIZE = 500;

const OLD_COLLECTIONS = [
  'supplier_events',
  'payments',
  'discountLinks'
];

async function cleanupOldCollections() {
  console.log('🧹 LIMPIEZA: Eliminar colecciones antiguas\n');
  console.log('═'.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (simulación)\n');
  } else {
    console.log('🔥 MODO REAL - Eliminando permanentemente\n');
  }
  
  const results = [];
  
  for (const collectionName of OLD_COLLECTIONS) {
    console.log(`\n🗑️  Procesando: ${collectionName}\n`);
    console.log('-'.repeat(80));
    
    try {
      const snapshot = await db.collection(collectionName).get();
      
      console.log(`📊 Encontrados ${snapshot.size} documentos\n`);
      
      if (snapshot.empty) {
        console.log(`✅ ${collectionName} ya está vacía\n`);
        results.push({ collection: collectionName, deleted: 0, success: true });
        continue;
      }
      
      if (!DRY_RUN) {
        console.log('🔄 Eliminando...\n');
        
        let batch = db.batch();
        let batchCount = 0;
        let totalDeleted = 0;
        
        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          batchCount++;
          
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            totalDeleted += batchCount;
            console.log(`   ✅ ${batchCount} docs eliminados (total: ${totalDeleted})`);
            batch = db.batch();
            batchCount = 0;
          }
        }
        
        if (batchCount > 0) {
          await batch.commit();
          totalDeleted += batchCount;
          console.log(`   ✅ ${batchCount} docs eliminados (total: ${totalDeleted})`);
        }
        
        console.log(`\n✅ ${collectionName} eliminada: ${totalDeleted} docs\n`);
        results.push({ collection: collectionName, deleted: totalDeleted, success: true });
        
      } else {
        console.log(`🔍 Se eliminarían ${snapshot.size} docs\n`);
        results.push({ collection: collectionName, deleted: snapshot.size, success: true });
      }
      
    } catch (error) {
      console.error(`❌ Error eliminando ${collectionName}:`, error.message);
      results.push({ collection: collectionName, deleted: 0, success: false, error: error.message });
    }
  }
  
  // Resumen
  console.log('\n═'.repeat(80));
  console.log('\n📊 RESUMEN DE LIMPIEZA:\n');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.collection}: ${result.deleted} docs eliminados`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`\n   Total eliminados: ${totalDeleted} documentos`);
  console.log(`   Éxito: ${successCount}/${results.length} colecciones\n`);
  
  if (!DRY_RUN && successCount === results.length) {
    console.log('✅ LIMPIEZA COMPLETADA\n');
    console.log('🎉 Migración finalizada exitosamente!\n');
  } else if (DRY_RUN) {
    console.log('💡 Para ejecutar la limpieza real:\n');
    console.log('   node scripts/migrations/cleanup-old-collections.mjs --force\n');
  }
}

cleanupOldCollections()
  .then(() => {
    console.log('✅ Completado.\n');
    admin.app().delete();
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal:', error);
    admin.app().delete();
    process.exit(1);
  });
