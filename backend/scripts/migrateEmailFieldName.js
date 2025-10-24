/**
 * Script de Migración: myWed360Email → maLoveEmail
 * 
 * Renombra el campo en todos los usuarios existentes en Firestore
 * 
 * Uso:
 * node backend/scripts/migrateEmailFieldName.js
 */

import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';

async function migrateEmailFieldName() {
  console.log('\n🔄 MIGRACIÓN: myWed360Email → maLoveEmail\n');
  console.log('='.repeat(60));
  
  let migratedCount = 0;
  let alreadyMigratedCount = 0;
  let errorCount = 0;
  
  try {
    // 1. Buscar todos los usuarios
    console.log('\n1️⃣ Buscando usuarios...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   Total usuarios: ${usersSnapshot.size}`);
    
    // 2. Migrar cada usuario
    console.log('\n2️⃣ Iniciando migración...\n');
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      
      try {
        // Si ya tiene maLoveEmail, saltar
        if (userData.maLoveEmail) {
          alreadyMigratedCount++;
          console.log(`   ✓ ${uid} - Ya migrado (maLoveEmail existe)`);
          continue;
        }
        
        // Si tiene myWed360Email, migrar
        if (userData.myWed360Email) {
          await db.collection('users').doc(uid).update({
            maLoveEmail: userData.myWed360Email,
            // Opcional: eliminar el campo antiguo
            // myWed360Email: FieldValue.delete(),
          });
          
          migratedCount++;
          console.log(`   ✅ ${uid} - Migrado: ${userData.myWed360Email} → maLoveEmail`);
        } else {
          console.log(`   ⊘ ${uid} - Sin email personalizado`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ ${uid} - Error:`, error.message);
      }
    }
    
    // 3. También migrar en emailUsernames
    console.log('\n3️⃣ Migrando colección emailUsernames...\n');
    const usernamesSnapshot = await db.collection('emailUsernames').get();
    
    for (const doc of usernamesSnapshot.docs) {
      const data = doc.data();
      
      try {
        // Actualizar el dominio de @maloveapp.com a @malove.app
        if (data.email && data.email.includes('@maloveapp.com')) {
          const newEmail = data.email.replace('@maloveapp.com', '@malove.app');
          await doc.ref.update({
            email: newEmail,
          });
          console.log(`   ✅ ${doc.id} - ${data.email} → ${newEmail}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ ${doc.id} - Error:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMEN:\n');
    console.log(`   ✅ Migrados: ${migratedCount}`);
    console.log(`   ✓ Ya migrados: ${alreadyMigratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total procesados: ${usersSnapshot.size}`);
    console.log('\n✅ Migración completada!\n');
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateEmailFieldName()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
