/**
 * Script para configurar admin automáticamente (CommonJS)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, 'backend/serviceAccount.json');
let serviceAccount;

try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (error) {
  console.error('❌ Error leyendo serviceAccount.json:', error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function setupFirstAdmin() {
  try {
    console.log('🔍 Buscando usuarios en Firebase Auth...\n');

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
    console.log('🔐 Usuario con acceso admin:');
    console.log('   Email:', firstUser.email);
    console.log('   UID:', firstUser.uid);
    console.log('');
    console.log('⚠️  SIGUIENTE PASO: Despliega las reglas de Firestore');
    console.log('   Firebase Console → Firestore → Reglas → Publicar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupFirstAdmin();
