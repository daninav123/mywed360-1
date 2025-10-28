// scripts/migrations/delete-test-mails.mjs
// Elimina colección mails/ (emails de prueba)

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

async function deleteTestMails() {
  console.log('🗑️  ELIMINAR: mails/ (emails de prueba)\n');
  console.log('═'.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (simulación)\n');
  } else {
    console.log('🔥 MODO REAL - Eliminando permanentemente\n');
  }
  
  try {
    // Obtener todos los emails
    const snapshot = await db.collection('mails').get();
    
    console.log(`📊 Encontrados ${snapshot.size} emails de prueba\n`);
    
    if (snapshot.empty) {
      console.log('ℹ️  No hay emails para eliminar.');
      return;
    }
    
    // Mostrar muestra
    console.log('📋 MUESTRA DE EMAILS A ELIMINAR:\n');
    snapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}`);
      console.log(`     From: ${data.from || 'N/A'}`);
      console.log(`     To: ${data.to || 'N/A'}`);
      console.log(`     Subject: ${data.subject || 'N/A'}`);
    });
    
    if (snapshot.size > 5) {
      console.log(`   ... y ${snapshot.size - 5} más\n`);
    } else {
      console.log('');
    }
    
    if (!DRY_RUN) {
      console.log('🔄 Eliminando emails...\n');
      
      let batch = db.batch();
      let batchCount = 0;
      let totalDeleted = 0;
      
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        batchCount++;
        
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          totalDeleted += batchCount;
          console.log(`   ✅ ${batchCount} emails eliminados (total: ${totalDeleted})`);
          batch = db.batch();
          batchCount = 0;
        }
      }
      
      // Commit final
      if (batchCount > 0) {
        await batch.commit();
        totalDeleted += batchCount;
        console.log(`   ✅ ${batchCount} emails eliminados (total: ${totalDeleted})`);
      }
      
      console.log('\n✅ ELIMINACIÓN COMPLETADA');
      console.log(`   Total eliminados: ${totalDeleted}\n`);
      
      // Verificar
      const verifySnapshot = await db.collection('mails').get();
      if (verifySnapshot.empty) {
        console.log('✅ VERIFICADO: Colección mails/ está vacía\n');
      } else {
        console.log(`⚠️  ADVERTENCIA: Aún quedan ${verifySnapshot.size} documentos\n`);
      }
      
    } else {
      console.log('🔍 SIMULACIÓN:\n');
      console.log(`   Se eliminarían ${snapshot.size} emails de prueba\n`);
      console.log('💡 Para ejecutar la eliminación real:');
      console.log('   node scripts/migrations/delete-test-mails.mjs --force\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

deleteTestMails()
  .then(() => {
    console.log('✅ Completado.\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal:', error);
    process.exit(1);
  });
