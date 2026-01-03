/**
 * Script para listar proveedores en Firebase
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

async function listSuppliers() {
  try {
    console.log('🔍 Listando proveedores en Firebase...\n');

    const suppliersSnapshot = await db.collection('suppliers').limit(10).get();

    if (suppliersSnapshot.empty) {
      console.log('❌ No hay proveedores en Firebase\n');
      return;
    }

    console.log(`✅ Encontrados ${suppliersSnapshot.size} proveedores:\n`);

    suppliersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📌 ID: ${doc.id}`);
      console.log(`   Email (contact.email): ${data.contact?.email || 'N/A'}`);
      console.log(`   Nombre: ${data.profile?.name || data.name || 'N/A'}`);
      console.log(`   Password Hash: ${data.auth?.passwordHash ? '✅ Existe' : '❌ No existe'}`);
      console.log(`   Status: ${data.profile?.status || 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listando proveedores:', error.message);
    console.error(error);
    process.exit(1);
  }
}

listSuppliers();
