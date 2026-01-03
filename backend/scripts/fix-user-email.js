/**
 * Corregir email del usuario y migrar emails guardados
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../variables entorno/backend/serviceAccount.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = getFirestore();
const USER_ID = '9EstYa0T8WRBm9j0XwnE8zU1iFo1';

async function fixUserEmail() {
  console.log('🔧 Corrigiendo configuración de email\n');
  console.log('═'.repeat(60));
  
  // 1. Actualizar email del usuario a danielnavarrocampos@malove.app
  console.log('\n1️⃣ Actualizando perfil de usuario...');
  await db.collection('users').doc(USER_ID).update({
    myWed360Email: 'danielnavarrocampos@malove.app'
  });
  console.log('   ✅ Email actualizado a: danielnavarrocampos@malove.app');
  
  // 2. Actualizar emails de solicitudes para que sean del usuario
  console.log('\n2️⃣ Actualizando email de solicitud de presupuesto...');
  const quoteEmail = await db.collection('mails')
    .where('from', '==', 'solicitudes@mg.malove.app')
    .where('subject', '==', '💼 Nueva solicitud de presupuesto de danielnavarrocampos')
    .limit(1)
    .get();
  
  if (!quoteEmail.empty) {
    const doc = quoteEmail.docs[0];
    await doc.ref.update({
      from: 'danielnavarrocampos@malove.app',
      fromDisplay: 'danielnavarrocampos@malove.app'
    });
    console.log('   ✅ Email de solicitud actualizado');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ CORRECCIÓN COMPLETADA');
  console.log('═'.repeat(60));
  console.log('\n📋 Ahora deberías ver:');
  console.log('   • Email de presupuesto en ENVIADOS');
  console.log('   • Emails anteriores de prueba');
  console.log('\n🔄 Recarga el buzón en la app');
}

fixUserEmail();
