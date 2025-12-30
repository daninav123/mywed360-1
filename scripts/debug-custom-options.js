/**
 * Script de diagnóstico para verificar la persistencia de customOptions
 * en supplierRequirements
 * 
 * Uso: node scripts/debug-custom-options.js <weddingId>
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

async function debugCustomOptions(weddingId) {
  console.log('\n🔍 DIAGNÓSTICO DE CUSTOM OPTIONS');
  console.log('=====================================\n');

  if (!weddingId) {
    console.error('❌ Uso: node scripts/debug-custom-options.js <weddingId>');
    console.log('\n💡 Para obtener tu weddingId:');
    console.log('   1. Abre la app en el navegador');
    console.log('   2. F12 > Console');
    console.log('   3. Ejecuta: localStorage.getItem("weddingId")');
    process.exit(1);
  }

  try {
    console.log(`📋 Wedding ID: ${weddingId}\n`);

    // 1. Verificar que existe el documento
    const weddingDoc = await db.collection('weddings').doc(weddingId).get();
    
    if (!weddingDoc.exists) {
      console.error('❌ No se encontró el documento de boda');
      process.exit(1);
    }

    console.log('✅ Documento de boda encontrado\n');

    const data = weddingDoc.data();

    // 2. Verificar estructura de supplierRequirements
    console.log('📊 ESTRUCTURA DE DATOS:');
    console.log('------------------------\n');

    if (!data.supplierRequirements) {
      console.log('⚠️  supplierRequirements NO EXISTE en el documento');
      console.log('    El campo probablemente nunca se ha guardado\n');
    } else {
      console.log('✅ supplierRequirements existe\n');
      
      // Listar todas las categorías
      const categories = Object.keys(data.supplierRequirements);
      console.log(`📂 Categorías guardadas (${categories.length}):`);
      categories.forEach(cat => console.log(`   - ${cat}`));
      console.log('');

      // Verificar customOptions en cada categoría
      console.log('🔍 CUSTOM OPTIONS POR CATEGORÍA:');
      console.log('--------------------------------\n');

      let totalCustomOptions = 0;
      
      categories.forEach(category => {
        const categoryData = data.supplierRequirements[category];
        const customOptions = categoryData?.customOptions || [];
        
        if (customOptions.length > 0) {
          console.log(`✨ ${category}:`);
          customOptions.forEach((opt, idx) => {
            console.log(`   ${idx + 1}. "${opt}"`);
            totalCustomOptions++;
          });
          console.log('');
        }
      });

      if (totalCustomOptions === 0) {
        console.log('⚠️  No se encontraron customOptions en ninguna categoría');
        console.log('    Prueba a añadir una opción en la app y ejecuta este script de nuevo\n');
      } else {
        console.log(`✅ Total de custom options encontradas: ${totalCustomOptions}\n`);
      }
    }

    // 3. Verificar timestamps
    console.log('🕐 TIMESTAMPS:');
    console.log('--------------\n');
    
    if (data.updatedAt) {
      const updatedDate = data.updatedAt.toDate();
      const now = new Date();
      const diffMinutes = Math.floor((now - updatedDate) / 1000 / 60);
      
      console.log(`📅 Última actualización: ${updatedDate.toLocaleString()}`);
      console.log(`⏱️  Hace ${diffMinutes} minutos\n`);
    } else {
      console.log('⚠️  No hay timestamp de actualización\n');
    }

    // 4. Mostrar estructura completa de una categoría como ejemplo
    console.log('📄 EJEMPLO DE ESTRUCTURA (fotografia):');
    console.log('---------------------------------------\n');
    
    if (data.supplierRequirements?.fotografia) {
      console.log(JSON.stringify(data.supplierRequirements.fotografia, null, 2));
    } else {
      console.log('⚠️  Categoría "fotografia" no encontrada');
    }

    console.log('\n✅ Diagnóstico completado\n');

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Obtener weddingId de argumentos
const [,, weddingId] = process.argv;

debugCustomOptions(weddingId);
