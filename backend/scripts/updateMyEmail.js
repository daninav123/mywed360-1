/**
 * Script para actualizar el email del usuario a MaLove.app
 * 
 * Uso:
 * node backend/scripts/updateMyEmail.js [nuevo-alias]
 * 
 * Ejemplo:
 * node backend/scripts/updateMyEmail.js dani
 */

import { db } from '../db.js';

const newUsername = process.argv[2] || 'dani';
const newEmail = `${newUsername}@malove.app`;
const userId = '9EstYa0T8WRBm9j0XwnE8zU1iFo1'; // Tu UID

console.log('\n🔄 ACTUALIZANDO EMAIL A MALOVE.APP\n');
console.log('='.repeat(60));
console.log(`\nUsuario: ${userId}`);
console.log(`Nuevo email: ${newEmail}\n`);

try {
  await db.collection('users').doc(userId).update({
    maLoveEmail: newEmail,
    emailUsername: newUsername,
    updatedAt: new Date().toISOString()
  });
  
  console.log('✅ Email actualizado correctamente!');
  
  // Verificar
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  console.log('\n📋 Datos actuales del usuario:');
  console.log(`   Email de login: ${userData.email}`);
  console.log(`   MaLove Email: ${userData.maLoveEmail}`);
  console.log(`   Username: ${userData.emailUsername}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ COMPLETADO\n');
  console.log('💡 Ahora recarga la página web y los emails deberían filtrarse correctamente.\n');
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}
