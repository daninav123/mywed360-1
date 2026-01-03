/**
 * Script para añadir un usuario como admin en Firestore
 * 
 * Uso:
 *   node scripts/add-admin.js <email> <uid>
 * 
 * Ejemplo:
 *   node scripts/add-admin.js admin@malove.app xyz123abc456
 */

import { initializeApp, cert } from 'firebase-admin/app';
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

const db = getFirestore();

async function addAdmin(email, uid) {
  if (!email || !uid) {
    console.error('❌ Uso: node scripts/add-admin.js <email> <uid>');
    process.exit(1);
  }

  try {
    console.log('📝 Añadiendo admin a Firestore...');
    console.log('   Email:', email);
    console.log('   UID:', uid);

    await db.collection('admins').doc(uid).set({
      email,
      role: 'admin',
      createdAt: new Date().toISOString(),
      permissions: {
        manageSpecs: true,
        manageUsers: true,
        viewAnalytics: true,
        manageContent: true,
      },
    });

    console.log('✅ Admin añadido correctamente a Firestore');
    console.log('');
    console.log('🔐 Ahora el usuario puede:');
    console.log('   - Editar especificaciones en /admin/specs');
    console.log('   - Acceder a systemConfig en Firestore');
    console.log('');
    console.log('⚠️  Recuerda desplegar las reglas de Firestore para que esto tenga efecto');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error añadiendo admin:', error.message);
    process.exit(1);
  }
}

// Obtener argumentos de línea de comandos
const [,, email, uid] = process.argv;

addAdmin(email, uid);
