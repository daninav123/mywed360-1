/**
 * Verificar permisos del usuario
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

async function checkPermissions() {
  console.log('🔒 Verificando permisos del usuario\n');
  
  const userDoc = await db.collection('users').doc(USER_ID).get();
  const userData = userDoc.data();
  
  console.log('Email:', userData.email);
  console.log('myWed360Email:', userData.myWed360Email);
  console.log('Permisos:', userData.permissions || 'NO TIENE');
  console.log('Rol:', userData.role || 'NO TIENE');
  
  const hasMailPermission = Array.isArray(userData.permissions) && 
    userData.permissions.includes('access_mail_api');
  
  console.log('\n' + '═'.repeat(60));
  console.log(`Permiso "access_mail_api": ${hasMailPermission ? '✅ SÍ' : '❌ NO'}`);
  
  if (!hasMailPermission) {
    console.log('\n⚠️  El usuario NO tiene permiso para acceder a /api/mail');
    console.log('   El middleware requireMailAccess bloqueará las consultas');
    console.log('\n💡 Solución: Añadir permiso "access_mail_api" al usuario');
  }
}

checkPermissions();
