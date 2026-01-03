// Script para diagnosticar por qué un proveedor no aparece en búsquedas
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
// Intentar múltiples ubicaciones posibles
const possiblePaths = [
  'C:\\Users\\Administrator\\Downloads\\serviceAccount.json',
  join(__dirname, '..', 'serviceAccount.json'),
  join(__dirname, 'serviceAccount.json'),
];

let serviceAccount;
let serviceAccountPath;

for (const path of possiblePaths) {
  try {
    serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
    serviceAccountPath = path;
    break;
  } catch (error) {
    continue;
  }
}

if (!serviceAccount) {
  console.error('❌ No se encontró serviceAccount.json en ninguna ubicación');
  console.error('   Ubicaciones intentadas:');
  possiblePaths.forEach((p) => console.error(`   - ${p}`));
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin inicializado correctamente');
  console.log(`   Usando: ${serviceAccountPath}\n`);
} catch (error) {
  console.error('❌ Error al inicializar Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw';

async function debugSupplier() {
  console.log(`\n🔍 DIAGNÓSTICO DEL PROVEEDOR: ${SUPPLIER_ID}\n`);
  console.log('='.repeat(60));

  try {
    // 1. Verificar si existe
    const supplierRef = db.collection('suppliers').doc(SUPPLIER_ID);
    const supplierDoc = await supplierRef.get();

    if (!supplierDoc.exists) {
      console.log('❌ ERROR: El proveedor NO existe en Firestore');
      console.log('   Colección: suppliers');
      console.log(`   ID: ${SUPPLIER_ID}`);
      return;
    }

    console.log('✅ Proveedor encontrado en Firestore\n');

    const data = supplierDoc.data();

    // 2. Mostrar información básica
    console.log('📋 INFORMACIÓN BÁSICA:');
    console.log(`   ID: ${supplierDoc.id}`);
    console.log(`   Nombre: ${data.name || data.profile?.name || '❌ NO TIENE NOMBRE'}`);
    console.log(`   Email: ${data.email || data.contact?.email || '❌ NO TIENE EMAIL'}`);
    console.log(`   Status: ${data.status || '❌ NO TIENE STATUS'}`);
    console.log('');

    // 3. Verificar campos críticos para búsqueda
    console.log('🔎 CAMPOS CRÍTICOS PARA BÚSQUEDA:');

    // Status
    const status = data.status || 'N/A';
    const statusOk = status === 'active' || status === 'cached';
    console.log(`   ├─ Status: ${status} ${statusOk ? '✅' : '❌ Debe ser "active" o "cached"'}`);

    // Categoría
    const category = data.category || data.profile?.category || 'N/A';
    console.log(`   ├─ Categoría: ${category} ${category !== 'N/A' ? '✅' : '⚠️ Sin categoría'}`);

    // Nombre
    const name = data.name || data.profile?.name || null;
    console.log(`   ├─ Nombre: ${name || '❌ NO TIENE NOMBRE'} ${name ? '✅' : '❌'}`);

    // Ubicación
    const city = data.location?.city || data.address?.city || 'N/A';
    const province = data.location?.province || data.address?.province || 'N/A';
    const serviceArea = data.location?.serviceArea || data.business?.serviceArea || 'N/A';
    console.log(`   ├─ Ciudad: ${city}`);
    console.log(`   ├─ Provincia: ${province}`);
    console.log(`   └─ Ámbito de servicio: ${serviceArea}`);
    console.log('');

    // 4. Mostrar datos completos para análisis
    console.log('📄 DATOS COMPLETOS (para análisis):');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    // 5. Análisis de por qué podría no aparecer
    console.log('🚨 POSIBLES PROBLEMAS:');
    const problems = [];

    if (!statusOk) {
      problems.push(`Status "${status}" no permite búsqueda (solo "active" o "cached")`);
    }
    if (!name) {
      problems.push('No tiene nombre configurado');
    }
    if (category === 'N/A') {
      problems.push('No tiene categoría configurada (recomendado)');
    }
    if (city === 'N/A' && province === 'N/A' && serviceArea === 'N/A') {
      problems.push('No tiene ubicación configurada');
    }

    if (problems.length === 0) {
      console.log('   ✅ No se detectaron problemas obvios');
      console.log('   💡 El proveedor debería aparecer en búsquedas si:');
      console.log('      - La categoría coincide con el servicio buscado');
      console.log('      - El nombre/descripción coincide con la query');
      console.log('      - La ubicación coincide con el lugar buscado');
    } else {
      problems.forEach((p, i) => {
        console.log(`   ${i + 1}. ❌ ${p}`);
      });
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('');

    // 6. Sugerencias de corrección
    if (problems.length > 0) {
      console.log('💡 SUGERENCIAS DE CORRECCIÓN:');

      if (!statusOk) {
        console.log(`   1. Actualizar status a "active":`);
        console.log(
          `      await db.collection('suppliers').doc('${SUPPLIER_ID}').update({ status: 'active' });`
        );
      }

      if (!name) {
        console.log(`   2. Añadir nombre:`);
        console.log(
          `      await db.collection('suppliers').doc('${SUPPLIER_ID}').update({ name: 'Nombre del Proveedor' });`
        );
      }

      if (category === 'N/A') {
        console.log(`   3. Añadir categoría:`);
        console.log(
          `      await db.collection('suppliers').doc('${SUPPLIER_ID}').update({ category: 'fotografia' });`
        );
        console.log(
          '      Categorías válidas: fotografia, video, catering, flores-decoracion, musica, etc.'
        );
      }

      console.log('');
    }
  } catch (error) {
    console.error('❌ ERROR AL DIAGNOSTICAR:', error);
    console.error(error.stack);
  }
}

debugSupplier()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
