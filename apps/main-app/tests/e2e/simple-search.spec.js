import { test, expect } from '@playwright/test';

test.describe('Búsqueda Simple - Sin Auth', () => {
  
  test('verificar que la app carga sin errores', async ({ page }) => {
    console.log('\n🧪 TEST: Verificando carga de la app\n');
    
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ Error:', error.message);
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log(`📊 Errores encontrados: ${errors.length}`);
    
    // Screenshot
    await page.screenshot({ path: 'test-results/home-page.png' });
    
    expect(errors.length).toBe(0);
  });

  test('verificar consola para logs de Google Places en home', async ({ page }) => {
    console.log('\n🧪 TEST: Capturando logs de consola\n');
    
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('Google Places') || text.includes('searchSuppliersHybrid')) {
        console.log(`📝 Log relevante: ${text}`);
      }
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    
    console.log(`📊 Total logs capturados: ${logs.length}`);
    
    // Buscar logs específicos
    const googlePlacesLogs = logs.filter(log => 
      log.includes('Google Places') || 
      log.includes('VITE_GOOGLE_PLACES_API_KEY')
    );
    
    console.log(`🔍 Logs de Google Places: ${googlePlacesLogs.length}`);
    googlePlacesLogs.forEach(log => console.log(`  - ${log}`));
  });

  test('verificar variables de entorno en el navegador', async ({ page }) => {
    console.log('\n🧪 TEST: Verificando variables en navegador\n');
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    const apiKey = await page.evaluate(() => {
      try {
        return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || 'NO_CONFIGURADA';
      } catch (error) {
        return `ERROR: ${error.message}`;
      }
    });
    
    console.log(`🔑 API Key en navegador: ${typeof apiKey === 'string' && apiKey.length > 10 ? apiKey.substring(0, 15) + '...' : apiKey}`);
    
    if (apiKey === 'NO_CONFIGURADA') {
      console.log('⚠️ API Key no está disponible en el navegador');
      console.log('💡 Asegúrate de reiniciar el servidor después de modificar .env');
    } else if (apiKey.startsWith('ERROR')) {
      console.log('❌ Error al acceder a import.meta.env:', apiKey);
    } else {
      console.log('✅ API Key disponible en el navegador');
      expect(apiKey).toContain('AIza');
    }
  });

  test('simular llamada directa a la API de búsqueda', async ({ page, request }) => {
    console.log('\n🧪 TEST: Llamada directa a /api/suppliers/search\n');
    
    try {
      const response = await request.post('http://localhost:4004/api/suppliers/search', {
        data: {
          service: 'audioprobe',
          location: 'España',
          query: 'audioprobe',
          filters: {}
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Respuesta recibida:`);
        console.log(`   - Count: ${data.count}`);
        console.log(`   - Breakdown:`, data.breakdown);
        console.log(`   - Suppliers: ${data.suppliers?.length || 0}`);
        
        if (data.hasGoogleResults) {
          console.log(`✅ ¡Tiene resultados de Google Places!`);
        } else {
          console.log(`⚠️ No hay resultados de Google Places`);
        }
      } else {
        console.log(`❌ Error en respuesta: ${response.statusText()}`);
      }
      
    } catch (error) {
      console.log(`❌ Error en llamada: ${error.message}`);
    }
  });
});
