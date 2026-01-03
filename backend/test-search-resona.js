// Script para testear búsqueda de ReSona
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin
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
  console.error('❌ No se encontró serviceAccount.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testSearchResona() {
  console.log('\n🔍 SIMULANDO BÚSQUEDA: "resona" en "valencia"\n');
  console.log('='.repeat(70));

  try {
    // Parámetros de búsqueda
    const service = 'resona';
    const location = 'valencia';
    const query = 'resona valencia';

    console.log('\n📋 PARÁMETROS:');
    console.log(`   Service: "${service}"`);
    console.log(`   Location: "${location}"`);
    console.log(`   Query: "${query}"`);
    console.log('');

    // 1. Obtener TODOS los proveedores
    console.log('📊 [FIRESTORE] Buscando en colección suppliers...\n');
    const snapshot = await db.collection('suppliers').limit(100).get();

    console.log(`   Total documentos: ${snapshot.size}\n`);

    // 2. Filtrar por status
    console.log('🔍 PASO 1: Filtro por STATUS\n');
    let results = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'N/A';
      const name = data.name || data.profile?.name || 'Sin nombre';
      const category = data.category || data.profile?.category || 'Sin categoría';

      if (status === 'active' || status === 'cached') {
        results.push({
          id: doc.id,
          name,
          status,
          category,
          data,
        });
        console.log(`   ✅ ${name} (${category}) - status: ${status}`);
      } else {
        console.log(`   ❌ ${name} (${category}) - status: ${status} (RECHAZADO)`);
      }
    });

    console.log(`\n   📊 Después de filtro status: ${results.length} proveedores\n`);

    // 3. Filtrar por nombre/query
    console.log('🔍 PASO 2: Filtro por NOMBRE/QUERY\n');
    const searchTokens = [];

    if (service) {
      searchTokens.push(service.toLowerCase());
    }

    if (query) {
      searchTokens.push(query.toLowerCase());
      searchTokens.push(...query.toLowerCase().split(/\s+/).filter(Boolean));
    }

    const uniqueTokens = [...new Set(searchTokens)];
    console.log(`   Tokens de búsqueda: [${uniqueTokens.join(', ')}]\n`);

    const finalResults = results.filter((supplier) => {
      const supplierName = (supplier.name || '').toLowerCase();
      const supplierCategory = (supplier.category || '').toLowerCase();
      const supplierTags = ((supplier.data.tags || []).join(' ') || '').toLowerCase();
      const supplierDesc = (supplier.data.business?.description || '').toLowerCase();

      console.log(`   🔍 Evaluando: ${supplier.name}`);
      console.log(`      Name: "${supplierName}"`);
      console.log(`      Category: "${supplierCategory}"`);
      console.log(`      Tags: "${supplierTags}"`);

      // Si no hay tokens, aceptar todo
      if (uniqueTokens.length === 0) {
        console.log(`      ✅ Sin tokens - ACEPTADO\n`);
        return true;
      }

      // Buscar coincidencias
      const matches = uniqueTokens.some((token) => {
        // Match en nombre o categoría
        if (supplierName.includes(token) || supplierCategory.includes(token)) {
          console.log(`      ✅ MATCH en nombre/categoría con token "${token}"`);
          return true;
        }

        // Match en tags
        if (supplierTags.includes(token)) {
          console.log(`      ✅ MATCH en tags con token "${token}"`);
          return true;
        }

        // Match en descripción (solo si token > 4 chars)
        if (token.length > 4 && supplierDesc.includes(token)) {
          console.log(`      ✅ MATCH en descripción con token "${token}"`);
          return true;
        }

        return false;
      });

      if (matches) {
        console.log(`      ✅ ACEPTADO\n`);
      } else {
        console.log(`      ❌ RECHAZADO - No match con ningún token\n`);
      }

      return matches;
    });

    console.log(`\n   📊 Después de filtro nombre: ${finalResults.length} proveedores\n`);

    // 4. Filtrar por ubicación
    console.log('🔍 PASO 3: Filtro por UBICACIÓN\n');
    const locationFiltered = finalResults.filter((supplier) => {
      const city = (supplier.data.location?.city || '').toLowerCase();
      const province = (supplier.data.location?.province || '').toLowerCase();
      const serviceArea = (
        supplier.data.location?.serviceArea ||
        supplier.data.business?.serviceArea ||
        ''
      ).toLowerCase();

      console.log(`   🌍 ${supplier.name}`);
      console.log(`      City: "${city}"`);
      console.log(`      Province: "${province}"`);
      console.log(`      ServiceArea: "${serviceArea}"`);

      const searchLocation = location.toLowerCase();

      // Match directo
      if (city.includes(searchLocation) || province.includes(searchLocation)) {
        console.log(`      ✅ MATCH directo - ACEPTADO\n`);
        return true;
      }

      // Ámbito nacional
      if (
        serviceArea.includes('nacional') ||
        serviceArea.includes('españa') ||
        serviceArea.includes('spain')
      ) {
        console.log(`      ✅ Ámbito nacional - ACEPTADO\n`);
        return true;
      }

      console.log(`      ❌ RECHAZADO\n`);
      return false;
    });

    console.log(`\n   📊 Después de filtro ubicación: ${locationFiltered.length} proveedores\n`);

    // Resultados finales
    console.log('='.repeat(70));
    console.log('\n🎯 RESULTADOS FINALES:\n');

    if (locationFiltered.length === 0) {
      console.log('   ❌ NO SE ENCONTRARON PROVEEDORES');
    } else {
      locationFiltered.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (${s.category})`);
        console.log(`      ID: ${s.id}`);
        console.log(`      Status: ${s.status}`);
        console.log(`      Ciudad: ${s.data.location?.city || 'N/A'}`);
        console.log('');
      });
    }

    console.log('='.repeat(70));
    console.log('');
  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error(error.stack);
  }

  process.exit(0);
}

testSearchResona();
