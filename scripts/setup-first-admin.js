/**
 * Script para configurar el primer admin automáticamente
 * Lista usuarios de Firebase Auth y añade el primero como admin
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
const serviceAccountPath = join(__dirname, '../backend/serviceAccount.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error leyendo serviceAccount.json:', error.message);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

async function setupFirstAdmin() {
  try {
    console.log('🔍 Buscando usuarios en Firebase Auth...\n');

    // Listar primeros 10 usuarios
    const listUsersResult = await auth.listUsers(10);
    
    if (listUsersResult.users.length === 0) {
      console.log('⚠️  No hay usuarios en Firebase Auth');
      console.log('💡 Crea un usuario primero desde el panel de login');
      process.exit(0);
    }

    console.log(`✅ Encontrados ${listUsersResult.users.length} usuarios:\n`);

    listUsersResult.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email || 'Sin email'}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Creado: ${user.metadata.creationTime}`);
      console.log('');
    });

    // Añadir el primer usuario como admin
    const firstUser = listUsersResult.users[0];
    
    console.log('📝 Añadiendo primer usuario como admin...');
    console.log('   Email:', firstUser.email);
    console.log('   UID:', firstUser.uid);

    await db.collection('admins').doc(firstUser.uid).set({
      email: firstUser.email,
      role: 'admin',
      createdAt: new Date().toISOString(),
      permissions: {
        manageSpecs: true,
        manageUsers: true,
        viewAnalytics: true,
        manageContent: true,
      },
    });

    console.log('\n✅ Admin configurado correctamente en Firestore');
    console.log('');
    console.log('🔐 Ahora el usuario puede:');
    console.log('   - Editar especificaciones en /admin/specs');
    console.log('   - Acceder a systemConfig en Firestore');
    console.log('');
    console.log('⚠️  SIGUIENTE PASO: Despliega las reglas de Firestore');
    console.log('   Firebase Console → Firestore → Reglas → Publicar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupFirstAdmin();
