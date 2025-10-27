#!/usr/bin/env node
/**
 * Script para verificar el estado de los índices Firestore requeridos
 * Uso: node backend/scripts/check-firestore-indexes.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const requiredIndexes = [
  {
    name: 'emailAutomationQueue',
    collection: 'emailAutomationQueue',
    fields: ['status', 'scheduledAt', '__name__'],
    url: 'https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Clpwcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9lbWFpbEF1dG9tYXRpb25RdWV1ZS9pbmRleGVzL18QARoKCgZzdGF0dXMQARoPCgtzY2hlZHVsZWRBdBABGgwKCF9fbmFtZV9fEAE'
  },
  {
    name: 'photos',
    collection: 'photos (collection group)',
    fields: ['status', 'createdAt', '__name__'],
    url: 'https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9waG90b3MvaW5kZXhlcy9fEAIaCgoGc3RhdHVzEAEaDQoJY3JlYXRlZEF0EAEaDAoIX19uYW1lX18QAQ'
  },
  {
    name: 'albums',
    collection: 'albums (collection group)',
    fields: ['slug', 'uploadWindow.cleanupStatus', 'uploadWindow.cleanupAt', '__name__'],
    url: 'https://console.firebase.google.com/v1/r/project/lovenda-98c77/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9sb3ZlbmRhLTk4Yzc3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hbGJ1bXMvaW5kZXhlcy9fEAIaCAoEc2x1ZxABGh4KGnVwbG9hZFdpbmRvdy5jbGVhbnVwU3RhdHVzEAEaGgoWdXBsb2FkV2luZG93LmNsZWFudXBBdBABGgwKCF9fbmFtZV9fEAE'
  }
];

console.log('\n🔍 Verificador de Índices Firestore\n');
console.log('=====================================\n');

// Verificar variables de entorno
const workersDisabled = {
  emailScheduler: process.env.EMAIL_SCHEDULER_DISABLED === '1',
  moderation: process.env.MOMENTOS_AUTO_MODERATION_DISABLED === '1',
  cleanup: process.env.MOMENTOS_CLEANUP_DISABLED === '1'
};

console.log('📊 Estado de Workers:\n');
console.log(`  Email Scheduler:     ${workersDisabled.emailScheduler ? '❌ DESHABILITADO' : '✅ ACTIVO'}`);
console.log(`  Momentos Moderation: ${workersDisabled.moderation ? '❌ DESHABILITADO' : '✅ ACTIVO'}`);
console.log(`  Momentos Cleanup:    ${workersDisabled.cleanup ? '❌ DESHABILITADO' : '✅ ACTIVO'}`);
console.log('');

const allDisabled = workersDisabled.emailScheduler && workersDisabled.moderation && workersDisabled.cleanup;

if (allDisabled) {
  console.log('✅ SOLUCIÓN INMEDIATA APLICADA: Todos los workers están deshabilitados.\n');
  console.log('   El sistema debería funcionar normalmente ahora.\n');
} else {
  console.log('⚠️  ADVERTENCIA: Algunos workers están activos sin índices.\n');
  console.log('   Esto causará errores y lentitud del sistema.\n');
}

console.log('📋 Índices Firestore Requeridos:\n');
console.log('=====================================\n');

requiredIndexes.forEach((index, i) => {
  console.log(`${i + 1}. ${index.name}`);
  console.log(`   Collection: ${index.collection}`);
  console.log(`   Campos: ${index.fields.join(' → ')}`);
  console.log(`   \n   🔗 Crear índice:`);
  console.log(`   ${index.url}\n`);
});

console.log('=====================================\n');
console.log('📖 Documentación completa:');
console.log('   docs/SOLUCION-WORKERS-FIRESTORE.md\n');

// Intentar conectar a Firestore para más información
try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
  const fullPath = path.resolve(process.cwd(), serviceAccountPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log('ℹ️  No se pudo conectar a Firestore para verificar datos.');
    console.log('   (serviceAccount no encontrado en:', fullPath, ')\n');
    process.exit(0);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  
  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();

  console.log('🔗 Conexión a Firestore establecida.\n');
  console.log('📊 Estadísticas de Colecciones:\n');

  // Verificar si las colecciones existen y tienen documentos
  for (const index of requiredIndexes) {
    const collectionName = index.collection.split(' ')[0]; // Obtener nombre sin " (collection group)"
    
    try {
      const snapshot = await db.collection(collectionName).limit(1).get();
      const count = snapshot.size;
      const exists = count > 0;
      
      console.log(`  ${collectionName}: ${exists ? `✅ ${count} documento(s)` : '⚠️  Vacía'}`);
    } catch (error) {
      console.log(`  ${collectionName}: ℹ️  No accesible (puede ser collection group)`);
    }
  }

  console.log('\n✅ Verificación completada.\n');

} catch (error) {
  console.log('\nℹ️  No se pudo realizar verificación avanzada de Firestore.');
  console.log('   Motivo:', error.message, '\n');
}

console.log('=====================================\n');
console.log('💡 Próximos Pasos:\n');

if (!allDisabled) {
  console.log('1. ⚠️  URGENTE: Añadir estas variables a backend/.env:');
  console.log('   EMAIL_SCHEDULER_DISABLED=1');
  console.log('   MOMENTOS_AUTO_MODERATION_DISABLED=1');
  console.log('   MOMENTOS_CLEANUP_DISABLED=1\n');
  console.log('2. Reiniciar el backend (Ctrl+C y npm run dev)\n');
} else {
  console.log('1. ✅ Workers ya están deshabilitados (sistema estable)\n');
}

console.log('2. Crear los 3 índices usando los enlaces de arriba');
console.log('3. Esperar 5-15 minutos a que Firebase los construya');
console.log('4. Verificar estado en Firebase Console → Firestore → Indexes');
console.log('5. Eliminar las variables *_DISABLED del .env');
console.log('6. Reiniciar backend nuevamente\n');

process.exit(0);
