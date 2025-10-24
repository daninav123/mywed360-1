/**
 * Script para verificar configuración de Firebase Admin
 * 
 * Uso:
 * node backend/scripts/checkFirebaseAdmin.js
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 VERIFICACIÓN DE FIREBASE ADMIN\n');
console.log('='.repeat(60));

// 1. Verificar archivos de credenciales
console.log('\n1️⃣ Verificando archivos de credenciales:\n');

const rootDir = path.resolve(__dirname, '..');
const possibleFiles = [
  'serviceAccount.json',
  'serviceAccountKey.json',
  '../serviceAccount.json',
  '../serviceAccountKey.json'
];

let foundFile = null;
for (const file of possibleFiles) {
  const fullPath = path.resolve(rootDir, file);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ Encontrado: ${file}`);
    console.log(`      Ruta completa: ${fullPath}`);
    console.log(`      Tamaño: ${(fs.statSync(fullPath).size / 1024).toFixed(2)} KB`);
    
    try {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      console.log(`      Project ID: ${content.project_id || 'NO ENCONTRADO'}`);
      console.log(`      Client Email: ${content.client_email || 'NO ENCONTRADO'}`);
      
      if (!foundFile) {
        foundFile = fullPath;
      }
    } catch (err) {
      console.log(`      ⚠️ Error leyendo JSON: ${err.message}`);
    }
  } else {
    console.log(`   ❌ No encontrado: ${file}`);
  }
}

if (!foundFile) {
  console.log('\n❌ ERROR: No se encontró ningún archivo de credenciales!');
  console.log('\n📝 SOLUCIÓN:');
  console.log('   1. Descarga el archivo serviceAccountKey.json desde Firebase Console');
  console.log('   2. Cópialo a la carpeta backend/');
  console.log('   3. Renómbralo a serviceAccount.json');
  process.exit(1);
}

// 2. Verificar variables de entorno
console.log('\n2️⃣ Variables de entorno:\n');
console.log(`   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID || '❌ No configurada'}`);
console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ No configurada'}`);
console.log(`   FIREBASE_SERVICE_ACCOUNT_KEY: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Configurada (Base64)' : '❌ No configurada'}`);

// 3. Intentar inicializar Firebase Admin
console.log('\n3️⃣ Inicializando Firebase Admin:\n');

try {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(fs.readFileSync(foundFile, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('   ✅ Firebase Admin inicializado correctamente');
  } else {
    console.log('   ℹ️ Firebase Admin ya estaba inicializado');
  }
  
  // 4. Verificar conexión con Firestore
  console.log('\n4️⃣ Probando conexión con Firestore:\n');
  
  const db = admin.firestore();
  const testRef = db.collection('_test').doc('_ping');
  
  await testRef.set({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    test: true
  });
  
  console.log('   ✅ Escritura a Firestore: OK');
  
  const testDoc = await testRef.get();
  if (testDoc.exists) {
    console.log('   ✅ Lectura desde Firestore: OK');
  }
  
  await testRef.delete();
  console.log('   ✅ Eliminación desde Firestore: OK');
  
  // 5. Generar un token de prueba
  console.log('\n5️⃣ Generando token de prueba:\n');
  
  const testToken = await admin.auth().createCustomToken('test-user-verification');
  console.log('   ✅ Token generado correctamente');
  console.log(`   Longitud del token: ${testToken.length} caracteres`);
  
  // 6. Verificar usuarios existentes
  console.log('\n6️⃣ Verificando usuarios en Auth:\n');
  
  const listUsersResult = await admin.auth().listUsers(5);
  console.log(`   Total de usuarios (primeros 5): ${listUsersResult.users.length}`);
  
  if (listUsersResult.users.length > 0) {
    console.log('\n   Usuarios encontrados:');
    listUsersResult.users.forEach((user, idx) => {
      console.log(`   ${idx + 1}. UID: ${user.uid}`);
      console.log(`      Email: ${user.email || 'Sin email'}`);
      console.log(`      Creado: ${new Date(user.metadata.creationTime).toLocaleDateString()}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICACIÓN COMPLETADA - TODO OK\n');
  console.log('💡 Si sigues viendo errores 401, verifica que:');
  console.log('   1. El backend se reinició después de copiar el archivo');
  console.log('   2. El frontend está enviando el token en el header Authorization');
  console.log('   3. El token del frontend no está expirado\n');
  
} catch (error) {
  console.log('\n❌ ERROR durante la verificación:\n');
  console.error('   ', error.message);
  
  if (error.code === 'ENOENT') {
    console.log('\n📝 El archivo de credenciales no se encuentra.');
  } else if (error.message.includes('credential')) {
    console.log('\n📝 Problema con las credenciales. Verifica que el archivo JSON sea válido.');
  }
  
  console.log('\n' + '='.repeat(60));
  process.exit(1);
}
