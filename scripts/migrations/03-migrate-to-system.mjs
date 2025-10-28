// scripts/migrations/03-migrate-to-system.mjs
// Migra payments/ y discountLinks/ → system/

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('C:\\Users\\Administrator\\Downloads\\serviceAccount.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const DRY_RUN = !process.argv.includes('--force');
const BATCH_SIZE = 500;

// Colecciones a migrar
const MIGRATIONS = [
  { from: 'payments', to: 'system/payments', subCollection: false },
  { from: 'discountLinks', to: 'system/discounts', subCollection: false },
];

async function migrateToSystem() {
  console.log('⚙️  MIGRACIÓN A SYSTEM/\n');
  console.log('═'.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (simulación)\n');
  } else {
    console.log('🔥 MODO REAL\n');
  }
  
  const results = [];
  
  for (const migration of MIGRATIONS) {
    console.log(`\n📦 Migrando: ${migration.from} → ${migration.to}\n`);
    console.log('-'.repeat(80));
    
    try {
      // 1. Obtener documentos
      const snapshot = await db.collection(migration.from).get();
      
      console.log(`✅ Encontrados ${snapshot.size} documentos\n`);
      
      if (snapshot.empty) {
        console.log(`ℹ️  No hay documentos en ${migration.from}\n`);
        results.push({ collection: migration.from, count: 0, success: true });
        continue;
      }
      
      // 2. Migrar
      if (!DRY_RUN) {
        console.log('🔄 Migrando documentos...\n');
        
        // Para system/ necesitamos crear un documento padre
        const [systemPath, collectionName] = migration.to.split('/');
        
        let batch = db.batch();
        let batchCount = 0;
        let totalMigrated = 0;
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          // Crear en nueva ubicación
          // system/payments → system/{doc}/payments/{id}
          const newRef = db.collection(migration.to).doc(doc.id);
          
          batch.set(newRef, {
            ...data,
            migratedFrom: migration.from,
            migratedAt: FieldValue.serverTimestamp()
          });
          
          batchCount++;
          
          // Commit cada BATCH_SIZE
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            totalMigrated += batchCount;
            console.log(`   ✅ ${batchCount} docs migrados (total: ${totalMigrated})`);
            batch = db.batch();
            batchCount = 0;
          }
        }
        
        // Commit final
        if (batchCount > 0) {
          await batch.commit();
          totalMigrated += batchCount;
          console.log(`   ✅ ${batchCount} docs migrados (total: ${totalMigrated})`);
        }
        
        console.log(`\n✅ ${migration.from} migrado: ${totalMigrated} docs\n`);
        
        // Verificar
        const verifySnapshot = await db.collection(migration.to).get();
        console.log(`🔍 Verificación: ${verifySnapshot.size} docs en destino`);
        
        if (verifySnapshot.size === totalMigrated) {
          console.log('✅ VERIFICADO\n');
          results.push({ collection: migration.from, count: totalMigrated, success: true });
        } else {
          console.log('⚠️  ADVERTENCIA: Conteo no coincide\n');
          results.push({ collection: migration.from, count: totalMigrated, success: false });
        }
        
      } else {
        // DRY RUN
        console.log(`🔍 Se migrarían ${snapshot.size} docs a ${migration.to}\n`);
        results.push({ collection: migration.from, count: snapshot.size, success: true });
      }
      
    } catch (error) {
      console.error(`❌ Error migrando ${migration.from}:`, error.message);
      results.push({ collection: migration.from, count: 0, success: false, error: error.message });
    }
  }
  
  // Resumen
  console.log('\n═'.repeat(80));
  console.log('\n📊 RESUMEN DE MIGRACIÓN:\n');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.collection}: ${result.count} docs`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  const totalSuccess = results.filter(r => r.success).length;
  const totalDocs = results.reduce((sum, r) => sum + r.count, 0);
  
  console.log(`\n   Total: ${totalDocs} documentos migrados`);
  console.log(`   Éxito: ${totalSuccess}/${results.length} colecciones\n`);
  
  if (!DRY_RUN && totalSuccess === results.length) {
    console.log('⚠️  PRÓXIMO PASO: Eliminar colecciones antiguas\n');
    console.log('   node scripts/migrations/cleanup-system.mjs --force\n');
  } else if (DRY_RUN) {
    console.log('💡 Para ejecutar la migración real:\n');
    console.log('   node scripts/migrations/03-migrate-to-system.mjs --force\n');
  }
}

migrateToSystem()
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
