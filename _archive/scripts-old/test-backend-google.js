// Test rápido para verificar la configuración del backend
import dotenv from 'dotenv';
dotenv.config();

console.log('\n🧪 TEST DE CONFIGURACIÓN DEL BACKEND\n');
console.log('═══════════════════════════════════════\n');

// 1. Verificar API Key
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
console.log(`1. API Key configurada: ${apiKey ? '✅ Sí' : '❌ No'}`);
if (apiKey) {
  console.log(`   Valor: ${apiKey.substring(0, 15)}...`);
}

// 2. Verificar el servicio
import * as googlePlacesService from './backend/services/googlePlacesService.js';

console.log(`\n2. shouldUseGooglePlaces("audioprobe"): ${googlePlacesService.shouldUseGooglePlaces('audioprobe')}`);
console.log(`   shouldUseGooglePlaces("musica"): ${googlePlacesService.shouldUseGooglePlaces('musica')}`);
console.log(`   shouldUseGooglePlaces("dj"): ${googlePlacesService.shouldUseGooglePlaces('dj')}`);
console.log(`   shouldUseGooglePlaces("fotografo"): ${googlePlacesService.shouldUseGooglePlaces('fotografo')}`);

// 3. Ver categorías que usan Google Places
console.log(`\n3. Categorías HIGH COVERAGE:`);
console.log(`   ${googlePlacesService.HIGH_COVERAGE_CATEGORIES.slice(0, 10).join(', ')}`);

console.log(`\n4. Categorías MEDIUM COVERAGE:`);
console.log(`   ${googlePlacesService.MEDIUM_COVERAGE_CATEGORIES.slice(0, 10).join(', ')}`);

// 4. Intentar búsqueda real
console.log(`\n5. Intentando búsqueda real de "musica" en "valencia"...`);
try {
  const results = await googlePlacesService.searchGooglePlaces('musica', 'valencia', 5);
  console.log(`   ✅ Encontrados: ${results.length} resultados`);
  if (results.length > 0) {
    console.log(`   Primero: ${results[0].name}`);
  }
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
}

console.log('\n═══════════════════════════════════════\n');
