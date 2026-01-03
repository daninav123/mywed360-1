/**
 * Script para crear índice de Firestore necesario para quote-requests-internet
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../../variables entorno/backend/serviceAccount.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id
});

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  📊 ÍNDICE NECESARIO PARA FIRESTORE                       ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('La query requiere un índice compuesto en Firestore:\n');
console.log('📋 Configuración del índice:\n');
console.log('   Colección: quote-requests-internet');
console.log('   Campos:');
console.log('     • userId (Ascending)');
console.log('     • createdAt (Descending)\n');

console.log('🔗 Para crear el índice, sigue estos pasos:\n');
console.log('1. Abre la consola de Firebase:');
console.log('   https://console.firebase.google.com/project/lovenda-98c77/firestore/indexes\n');

console.log('2. Click en "Crear índice"\n');

console.log('3. Configura:');
console.log('   • Colección: quote-requests-internet');
console.log('   • Campo 1: userId - Ascending');
console.log('   • Campo 2: createdAt - Descending\n');

console.log('4. Click en "Crear"\n');

console.log('5. Espera 2-3 minutos a que se complete\n');

console.log('━'.repeat(60));
console.log('\n💡 ALTERNATIVA RÁPIDA:\n');
console.log('Si ves un error en la consola del navegador, tendrá un link directo');
console.log('para crear el índice automáticamente. Haz click en ese link.\n');

console.log('Ejemplo de error:');
console.log('  "The query requires an index. You can create it here: [LINK]"\n');
