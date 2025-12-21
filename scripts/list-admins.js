/**
 * Script para listar todos los admins en Firestore
 * 
 * Uso:
 *   node scripts/list-admins.js
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

async function listAdmins() {
  try {
    console.log('📋 Listando admins en Firestore...\n');

    const adminsSnapshot = await db.collection('admins').get();

    if (adminsSnapshot.empty) {
      console.log('⚠️  No hay admins configurados todavía');
      console.log('');
      console.log('💡 Para añadir un admin, ejecuta:');
      console.log('   node scripts/add-admin.js <email> <uid>');
      process.exit(0);
    }

    console.log(`✅ Total de admins: ${adminsSnapshot.size}\n`);

    adminsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('👤 Admin:');
      console.log('   UID:', doc.id);
      console.log('   Email:', data.email || 'N/A');
      console.log('   Role:', data.role || 'N/A');
      console.log('   Creado:', data.createdAt || 'N/A');
      console.log('   Permisos:', JSON.stringify(data.permissions || {}, null, 2));
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listando admins:', error.message);
    process.exit(1);
  }
}

listAdmins();
