#!/usr/bin/env node
/**
 * Script: cleanupTestData.js
 * Limpia todos los datos de test del sistema
 * 
 * Uso:
 *   node scripts/cleanupTestData.js [--force]
 */

import admin from 'firebase-admin';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse argumentos
function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value || true;
    }
  }
  return args;
}

// Confirmar acción
function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Inicializar Firebase
function initializeFirebase() {
  if (admin.apps.length) return;
  
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    } else {
      const fs = require('fs');
      const rootDir = join(__dirname, '..');
      const files = fs.readdirSync(rootDir);
      const serviceAccountFile = files.find(f => /firebase.*adminsdk.*\.json$/i.test(f));
      
      if (!serviceAccountFile) {
        throw new Error('No se encontró archivo de service account');
      }
      
      const serviceAccount = require(join(rootDir, serviceAccountFile));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('✅ Firebase inicializado\n');
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    process.exit(1);
  }
}

// Limpiar datos
async function cleanup() {
  const db = admin.firestore();
  const auth = admin.auth();
  
  let totalDeleted = 0;
  
  console.log('🧹 Iniciando limpieza de datos de test...\n');
  
  // Limpiar usuarios de Auth
  console.log('👤 Limpiando usuarios de Auth...');
  try {
    const listUsersResult = await auth.listUsers();
    const testUsers = listUsersResult.users.filter(u => 
      u.email && u.email.includes('@test.maloveapp.com')
    );
    
    for (const user of testUsers) {
      await auth.deleteUser(user.uid);
      console.log(`  🗑️  ${user.email}`);
      totalDeleted++;
    }
    console.log(`✅ ${testUsers.length} usuarios eliminados\n`);
  } catch (error) {
    console.error('❌ Error limpiando Auth:', error.message);
  }
  
  // Limpiar colección users
  console.log('👤 Limpiando colección users...');
  try {
    const usersSnapshot = await db.collection('users').get();
    const testUserDocs = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.email && data.email.includes('@test.maloveapp.com');
    });
    
    const batch = db.batch();
    testUserDocs.forEach(doc => batch.delete(doc.ref));
    
    if (testUserDocs.length > 0) {
      await batch.commit();
      console.log(`✅ ${testUserDocs.length} documentos de users eliminados\n`);
      totalDeleted += testUserDocs.length;
    } else {
      console.log('ℹ️  No hay documentos de test en users\n');
    }
  } catch (error) {
    console.error('❌ Error limpiando users:', error.message);
  }
  
  // Limpiar bodas de test
  console.log('💍 Limpiando bodas de test...');
  try {
    const weddingsSnapshot = await db.collection('weddings').get();
    const testWeddings = weddingsSnapshot.docs.filter(doc => 
      doc.id.startsWith('test-wedding')
    );
    
    for (const weddingDoc of testWeddings) {
      // Limpiar subcolecciones
      const subCollections = [
        'guests', 'tasks', 'suppliers', 'seatingPlan', 
        'finance', 'payments', 'quoteRequests', 'documents'
      ];
      
      for (const subCol of subCollections) {
        const subDocs = await weddingDoc.ref.collection(subCol).get();
        if (!subDocs.empty) {
          const subBatch = db.batch();
          subDocs.forEach(subDoc => subBatch.delete(subDoc.ref));
          await subBatch.commit();
          console.log(`  🗑️  ${subDocs.size} docs de ${subCol} en ${weddingDoc.id}`);
          totalDeleted += subDocs.size;
        }
      }
      
      // Eliminar el documento de boda
      await weddingDoc.ref.delete();
      console.log(`  🗑️  Boda: ${weddingDoc.id}`);
      totalDeleted++;
    }
    
    console.log(`✅ ${testWeddings.length} bodas de test eliminadas\n`);
  } catch (error) {
    console.error('❌ Error limpiando weddings:', error.message);
  }
  
  // Limpiar proveedores de test
  console.log('🏢 Limpiando proveedores de test...');
  try {
    const suppliersSnapshot = await db.collection('suppliers').get();
    const testSuppliers = suppliersSnapshot.docs.filter(doc =>
      doc.id.startsWith('test-supplier')
    );
    
    const batch = db.batch();
    testSuppliers.forEach(doc => batch.delete(doc.ref));
    
    if (testSuppliers.length > 0) {
      await batch.commit();
      console.log(`✅ ${testSuppliers.length} proveedores eliminados\n`);
      totalDeleted += testSuppliers.length;
    } else {
      console.log('ℹ️  No hay proveedores de test\n');
    }
  } catch (error) {
    console.error('❌ Error limpiando suppliers:', error.message);
  }
  
  console.log('='.repeat(50));
  console.log(`🎉 Limpieza completada: ${totalDeleted} elementos eliminados`);
  console.log('='.repeat(50));
}

// Main
async function main() {
  console.log('🗑️  Limpieza de Datos de Test\n');
  console.log('='.repeat(50));
  
  const args = parseArgs();
  
  initializeFirebase();
  
  // Confirmar si no hay --force
  if (!args.force) {
    const confirmed = await confirm(
      '\n⚠️  ¿Estás seguro de eliminar TODOS los datos de test? (y/n): '
    );
    
    if (!confirmed) {
      console.log('\n❌ Operación cancelada');
      process.exit(0);
    }
  }
  
  await cleanup();
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
