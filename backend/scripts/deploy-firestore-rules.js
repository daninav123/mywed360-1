/**
 * Script para desplegar reglas de Firestore
 * Usa Firebase Admin SDK para actualizar las reglas
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar credenciales
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../serviceAccount.json'), 'utf8')
);

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

async function deployRules() {
  try {
    console.log('🔧 Cargando reglas de firestore.rules...');
    
    const rulesPath = join(__dirname, '../../firestore.rules');
    const rulesContent = readFileSync(rulesPath, 'utf8');
    
    console.log('📄 Reglas cargadas:', rulesContent.substring(0, 200) + '...');
    
    // Nota: Firebase Admin SDK no tiene API directa para actualizar reglas
    // Necesitamos usar la REST API de Firebase
    console.log('\n⚠️  Firebase Admin SDK no soporta actualización de reglas directamente.');
    console.log('📋 Opciones:');
    console.log('   1. Usar Firebase Console: https://console.firebase.google.com/project/lovenda-98c77/firestore/rules');
    console.log('   2. Usar Firebase CLI: firebase deploy --only firestore:rules');
    console.log('   3. Copiar manualmente las reglas desde firestore.rules a la consola');
    console.log('\n✨ Las reglas actualizadas están en: firestore.rules');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deployRules();
