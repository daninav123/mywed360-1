import { test, expect } from '@playwright/test';
import axios from 'axios';

test.describe('Test Directo a Google Places API', () => {
  
  test('llamar directamente a Google Places API', async () => {
    console.log('\n🧪 TEST: Llamada directa a Google Places API\n');
    
    const API_KEY = 'AIzaSyDntGoRsW-5Bb8ojYqVa-ZIUYclj-nVtVk';
    
    // Prueba 1: Búsqueda genérica de música
    console.log('1️⃣ Búsqueda: "música bodas valencia"');
    try {
      const response1 = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'música bodas valencia',
          key: API_KEY,
          language: 'es',
          region: 'ES'
        }
      });
      
      console.log(`   Status: ${response1.data.status}`);
      console.log(`   Resultados: ${response1.data.results?.length || 0}`);
      
      if (response1.data.results && response1.data.results.length > 0) {
        console.log(`\n   📋 Primeros 3:`);
        response1.data.results.slice(0, 3).forEach((r, i) => {
          console.log(`      ${i+1}. ${r.name} - ${r.formatted_address}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Prueba 2: Búsqueda específica "audioprobe"
    console.log('\n2️⃣ Búsqueda: "audioprobe valencia"');
    try {
      const response2 = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'audioprobe valencia',
          key: API_KEY,
          language: 'es',
          region: 'ES'
        }
      });
      
      console.log(`   Status: ${response2.data.status}`);
      console.log(`   Resultados: ${response2.data.results?.length || 0}`);
      
      if (response2.data.results && response2.data.results.length > 0) {
        console.log(`\n   📋 Resultados:`);
        response2.data.results.forEach((r, i) => {
          console.log(`      ${i+1}. ${r.name} - ${r.formatted_address}`);
        });
      } else {
        console.log(`   ⚠️ Google Places NO tiene resultados para "audioprobe"`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Prueba 3: Búsqueda "audiopr Prueba 3: Búsqueda genérica "dj valencia"
    console.log('\n3️⃣ Búsqueda: "dj valencia"');
    try {
      const response3 = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: 'dj valencia',
          key: API_KEY,
          language: 'es',
          region: 'ES'
        }
      });
      
      console.log(`   Status: ${response3.data.status}`);
      console.log(`   Resultados: ${response3.data.results?.length || 0}`);
      
      if (response3.data.results && response3.data.results.length > 0) {
        console.log(`\n   📋 Primeros 5:`);
        response3.data.results.slice(0, 5).forEach((r, i) => {
          console.log(`      ${i+1}. ${r.name} - ${r.rating}★`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n📊 CONCLUSIÓN:');
    console.log('═══════════════════════════════════════════');
    console.log('Si "audioprobe" devuelve 0 resultados, significa que');
    console.log('Google Places API NO conoce ese negocio específico.');
    console.log('Deberíamos buscar negocios similares o usar otra query.');
  });
});
