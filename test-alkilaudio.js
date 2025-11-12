// Test directo para verificar si alkilaudio existe en Google Places
import axios from 'axios';

const API_KEY = 'AIzaSyDntGoRsW-5Bb8ojYqVa-ZIUYclj-nVtVk';

console.log('\n🧪 TEST: Búsqueda de "alkilaudio" en Google Places API\n');
console.log('═══════════════════════════════════════════════════\n');

async function testSearch() {
  try {
    console.log('1️⃣ Buscando "alkilaudio españa"...');
    const startTime = Date.now();
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'alkilaudio españa',
        key: API_KEY,
        language: 'es',
        region: 'ES'
      },
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Respuesta en ${duration}ms`);
    console.log(`Status: ${response.data.status}`);
    console.log(`Resultados: ${response.data.results?.length || 0}`);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n📋 RESULTADOS:\n');
      response.data.results.forEach((place, i) => {
        console.log(`${i+1}. ${place.name}`);
        console.log(`   ${place.formatted_address}`);
        console.log(`   Rating: ${place.rating || 'N/A'}★`);
        console.log('');
      });
    } else {
      console.log('\n⚠️ Google Places NO tiene resultados para "alkilaudio"');
      console.log('Esto es normal si el negocio no está registrado en Google Maps\n');
    }
    
    // Prueba alternativa
    console.log('\n2️⃣ Intentando búsqueda alternativa: "alkil audio españa"...');
    const response2 = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'alkil audio españa',
        key: API_KEY,
        language: 'es',
        region: 'ES'
      },
      timeout: 30000
    });
    
    console.log(`Status: ${response2.data.status}`);
    console.log(`Resultados: ${response2.data.results?.length || 0}\n`);
    
    if (response2.data.results && response2.data.results.length > 0) {
      console.log('📋 RESULTADOS:\n');
      response2.data.results.slice(0, 3).forEach((place, i) => {
        console.log(`${i+1}. ${place.name} - ${place.formatted_address}`);
      });
    }
    
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ TIMEOUT - Google Places tardó más de 30 segundos');
    }
  }
}

testSearch();
