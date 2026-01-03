/**
 * Script para crear usuario admin en Firebase Auth y Firestore
 * 
 * Email: admin@planivia.com
 * Password: Admin123!
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración del admin a crear
const ADMIN_EMAIL = 'admin@planivia.com';
const ADMIN_PASSWORD = 'Admin123!';

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

async function createAdmin() {
  try {
    console.log('🔧 Creando usuario admin...');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', '***********');
    console.log('');

    // 1. Verificar si el usuario ya existe
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log('ℹ️  Usuario ya existe en Firebase Auth');
      console.log('   UID:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // 2. Crear usuario en Firebase Auth
        console.log('📝 Creando usuario en Firebase Auth...');
        userRecord = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true,
          displayName: 'Admin Planivia',
        });
        console.log('✅ Usuario creado en Firebase Auth');
        console.log('   UID:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // 3. Añadir a la colección admins en Firestore
    console.log('');
    console.log('📝 Añadiendo admin a Firestore...');
    
    await db.collection('admins').doc(userRecord.uid).set({
      email: ADMIN_EMAIL,
      role: 'admin',
      createdAt: new Date().toISOString(),
      permissions: {
        manageSpecs: true,
        manageUsers: true,
        viewAnalytics: true,
        manageContent: true,
        manageBlog: true,
        manageSuppliers: true,
      },
    });

    console.log('✅ Admin añadido correctamente a Firestore');
    console.log('');
    console.log('🎉 ¡Admin creado exitosamente!');
    console.log('');
    console.log('🔐 Credenciales de acceso:');
    console.log('   URL: http://localhost:5174/admin/login');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('');
    console.log('👤 UID:', userRecord.uid);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando admin:', error.message);
    console.error('');
    console.error('Detalles:', error);
    process.exit(1);
  }
}

createAdmin();
