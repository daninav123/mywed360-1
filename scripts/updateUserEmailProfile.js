#!/usr/bin/env node

/**
 * Script para actualizar el perfil del usuario con maLoveEmail y emailUsername
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../backend/serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'lovenda-98c77'
});

const db = admin.firestore();

async function updateUserEmailProfile() {
  try {
    // UID del usuario actual
    const userId = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';
    
    console.log(`\n🔍 Buscando usuario: ${userId}...`);
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }
    
    const userData = userDoc.data();
    console.log('\n📋 Datos actuales del usuario:');
    console.log('  - email:', userData.email);
    console.log('  - name:', userData.name);
    console.log('  - maLoveEmail:', userData.maLoveEmail || '(no definido)');
    console.log('  - emailUsername:', userData.emailUsername || '(no definido)');
    console.log('  - myWed360Email:', userData.myWed360Email || '(no definido)');
    console.log('  - emailAlias:', userData.emailAlias || '(no definido)');
    
    // Determinar el emailUsername
    let emailUsername = userData.emailUsername || userData.name || 'dani';
    
    // Construir el maLoveEmail
    const maLoveEmail = `${emailUsername}@malove.app`;
    
    console.log('\n🔧 Actualizando perfil con:');
    console.log('  - maLoveEmail:', maLoveEmail);
    console.log('  - emailUsername:', emailUsername);
    
    // Actualizar el documento
    await userRef.update({
      maLoveEmail: maLoveEmail,
      emailUsername: emailUsername,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('\n✅ Perfil actualizado correctamente');
    
    // Verificar la actualización
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('\n📋 Datos después de la actualización:');
    console.log('  - maLoveEmail:', updatedData.maLoveEmail);
    console.log('  - emailUsername:', updatedData.emailUsername);
    
    console.log('\n✅ SCRIPT COMPLETADO');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar
updateUserEmailProfile();
