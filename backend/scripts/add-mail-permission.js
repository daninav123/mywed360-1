/**
 * Añadir permiso access_mail_api al usuario
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

async function addMailPermission() {
  console.log('🔓 Añadiendo permiso access_mail_api al usuario\n');
  console.log('═'.repeat(60));
  
  const userRef = db.collection('users').doc(USER_ID);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  
  console.log('Email:', userData.email);
  
  // Añadir permiso
  const currentPermissions = userData.permissions || [];
  if (!currentPermissions.includes('access_mail_api')) {
    const newPermissions = [...currentPermissions, 'access_mail_api'];
    
    await userRef.update({
      permissions: newPermissions
    });
    
    console.log('✅ Permiso añadido correctamente');
    console.log('\nPermisos actuales:', newPermissions);
  } else {
    console.log('ℹ️  El usuario ya tiene el permiso');
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🔄 Recarga el buzón (F5) para ver los emails');
}

addMailPermission();
