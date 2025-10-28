// scripts/migrations/01-migrate-mails.mjs
// Migra mails/ → users/{uid}/emails/

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

// Configuración
const DRY_RUN = !process.argv.includes('--force');
const BATCH_SIZE = 500;

async function migrateMails() {
  console.log('📧 MIGRACIÓN: mails/ → users/{uid}/emails/\n');
  console.log('═'.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (simulación sin cambios reales)');
    console.log('   Para ejecutar la migración real: --force\n');
  } else {
    console.log('🔥 MODO REAL - Los cambios son permanentes\n');
  }
  
  try {
    // 1. Obtener todos los emails de mails/
    console.log('📊 Analizando colección mails/...\n');
    const mailsSnapshot = await db.collection('mails').get();
    
    console.log(`✅ Encontrados ${mailsSnapshot.size} emails en mails/\n`);
    
    if (mailsSnapshot.empty) {
      console.log('ℹ️  No hay emails para migrar.');
      return;
    }
    
    // 2. Agrupar por usuario
    const emailsByUser = new Map();
    const orphanEmails = [];
    
    mailsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Intentar identificar el usuario propietario
      let userId = null;
      
      // Buscar en diferentes campos posibles
      if (data.userId) {
        userId = data.userId;
      } else if (data.from && typeof data.from === 'string') {
        // Si es del formato email@domain.com, no es un uid
        // Buscar en recipients, to, etc.
        userId = data.ownerId || data.owner || data.uid;
      }
      
      if (!userId) {
        orphanEmails.push({ id: doc.id, data });
        return;
      }
      
      if (!emailsByUser.has(userId)) {
        emailsByUser.set(userId, []);
      }
      
      emailsByUser.get(userId).push({
        id: doc.id,
        data: {
          ...data,
          // Agregar metadata de migración
          migratedFrom: 'mails',
          migratedAt: FieldValue.serverTimestamp()
        }
      });
    });
    
    console.log('📊 Agrupación por usuario:\n');
    console.log(`   Usuarios: ${emailsByUser.size}`);
    console.log(`   Emails huérfanos (sin usuario): ${orphanEmails.length}\n`);
    
    if (orphanEmails.length > 0) {
      console.log('⚠️  EMAILS HUÉRFANOS (sin userId identificable):\n');
      orphanEmails.forEach(email => {
        console.log(`   - ${email.id}`);
        console.log(`     From: ${email.data.from || 'N/A'}`);
        console.log(`     To: ${email.data.to || 'N/A'}`);
        console.log(`     Subject: ${email.data.subject || 'N/A'}`);
      });
      console.log('\n   ⚠️  Estos emails NO se migrarán.\n');
    }
    
    // 3. Migrar por lotes
    if (!DRY_RUN) {
      console.log('🔄 Iniciando migración...\n');
      
      let totalMigrated = 0;
      let totalErrors = 0;
      
      for (const [userId, emails] of emailsByUser.entries()) {
        console.log(`📧 Migrando ${emails.length} emails para usuario ${userId.substring(0, 8)}...`);
        
        const batch = db.batch();
        let batchCount = 0;
        
        for (const email of emails) {
          try {
            // Crear en nueva ubicación
            const newRef = db.collection('users')
              .doc(userId)
              .collection('emails')
              .doc(email.id);
            
            batch.set(newRef, email.data);
            batchCount++;
            
            // Ejecutar batch cada BATCH_SIZE documentos
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              totalMigrated += batchCount;
              console.log(`   ✅ ${batchCount} emails migrados`);
              batchCount = 0;
            }
          } catch (error) {
            console.error(`   ❌ Error migrando email ${email.id}:`, error.message);
            totalErrors++;
          }
        }
        
        // Commit del último batch
        if (batchCount > 0) {
          await batch.commit();
          totalMigrated += batchCount;
          console.log(`   ✅ ${batchCount} emails migrados`);
        }
      }
      
      console.log('\n═'.repeat(80));
      console.log('\n📊 RESULTADO DE LA MIGRACIÓN:\n');
      console.log(`   ✅ Migrados: ${totalMigrated}`);
      console.log(`   ❌ Errores: ${totalErrors}`);
      console.log(`   ⚠️  Huérfanos (no migrados): ${orphanEmails.length}`);
      
      // 4. Verificar migración
      console.log('\n🔍 Verificando migración...\n');
      
      let verifiedCount = 0;
      for (const [userId, emails] of emailsByUser.entries()) {
        const newSnapshot = await db.collection('users')
          .doc(userId)
          .collection('emails')
          .get();
        
        verifiedCount += newSnapshot.size;
      }
      
      console.log(`✅ Verificados ${verifiedCount} emails en nueva ubicación`);
      
      if (verifiedCount === totalMigrated) {
        console.log('✅ MIGRACIÓN VERIFICADA CORRECTAMENTE\n');
        console.log('⚠️  PRÓXIMO PASO: Eliminar colección antigua mails/');
        console.log('   node scripts/migrations/cleanup-mails.mjs --force\n');
      } else {
        console.log('⚠️  ADVERTENCIA: El conteo no coincide');
        console.log('   NO elimines la colección antigua hasta verificar\n');
      }
      
    } else {
      // Modo DRY-RUN
      console.log('🔍 SIMULACIÓN DE MIGRACIÓN:\n');
      
      for (const [userId, emails] of emailsByUser.entries()) {
        console.log(`   Usuario ${userId.substring(0, 8)}: ${emails.length} emails`);
        console.log(`   → users/${userId}/emails/`);
      }
      
      console.log('\n📊 RESUMEN:\n');
      console.log(`   Total a migrar: ${mailsSnapshot.size - orphanEmails.length}`);
      console.log(`   Usuarios afectados: ${emailsByUser.size}`);
      console.log(`   Huérfanos (no migrados): ${orphanEmails.length}`);
      console.log('\n💡 Para ejecutar la migración real:');
      console.log('   node scripts/migrations/01-migrate-mails.mjs --force\n');
    }
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// Ejecutar
migrateMails()
  .then(() => {
    console.log('✅ Script completado.\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
