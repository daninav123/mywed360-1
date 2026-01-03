/**
 * Script para resetear contraseña de proveedor
 * 
 * Uso: node scripts/reset-supplier-password.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Credenciales a configurar
const SUPPLIER_EMAIL = 'resona@icloud.com';
const NEW_PASSWORD = 'test123';

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

async function resetPassword() {
  try {
    console.log('🔍 Buscando proveedor...');
    console.log(`   Email: ${SUPPLIER_EMAIL}\n`);

    // Buscar proveedor
    const suppliersQuery = await db
      .collection('suppliers')
      .where('contact.email', '==', SUPPLIER_EMAIL.toLowerCase())
      .limit(1)
      .get();

    if (suppliersQuery.empty) {
      console.log('❌ Proveedor no encontrado\n');
      process.exit(1);
    }

    const supplierDoc = suppliersQuery.docs[0];
    const supplierData = supplierDoc.data();

    console.log(`✅ Proveedor encontrado:`);
    console.log(`   ID: ${supplierDoc.id}`);
    console.log(`   Nombre: ${supplierData.profile?.name || 'N/A'}`);
    console.log(`   Email: ${supplierData.contact?.email || 'N/A'}`);
    console.log('');

    // Hashear nueva contraseña
    console.log('🔐 Generando hash de contraseña...');
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log(`   Hash: ${passwordHash.substring(0, 20)}...`);
    console.log('');

    // Actualizar en Firebase
    console.log('💾 Actualizando contraseña en Firebase...');
    await supplierDoc.ref.update({
      'auth.passwordHash': passwordHash,
      'auth.updatedAt': new Date().toISOString(),
    });

    console.log('✅ Contraseña actualizada exitosamente\n');
    console.log('🔐 Nuevas credenciales:');
    console.log(`   Email: ${SUPPLIER_EMAIL}`);
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error reseteando contraseña:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetPassword();
