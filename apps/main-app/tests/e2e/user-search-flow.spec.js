import { test, expect } from '@playwright/test';

test.describe('Flujo Completo de Búsqueda del Usuario', () => {
  
  test('buscar "audioprobe" y verificar resultados en consola', async ({ page }) => {
    console.log('\n🧪 TEST: Flujo completo de búsqueda de usuario\n');
    
    const logs = [];
    const errors = [];
    
    // Capturar TODOS los logs
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log(`📝 [BROWSER]: ${text}`);
    });
    
    // Capturar errores
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ [ERROR]: ${error.message}`);
    });
    
    // Capturar requests fallidos
    page.on('requestfailed', request => {
      console.log(`❌ [REQUEST FAILED]: ${request.url()}`);
      console.log(`   Failure: ${request.failure()?.errorText}`);
    });
    
    console.log('\n1️⃣ Navegando a la home...');
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('\n2️⃣ Ejecutando búsqueda de "audioprobe" via JavaScript...');
    
    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/suppliers/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            service: 'audioprobe',
            location: 'España',
            query: 'audioprobe',
            budget: null,
            filters: {}
          })
        });
        
        if (!response.ok) {
          return { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status
          };
        }
        
        const data = await response.json();
        return { 
          success: true,
          status: response.status,
          data 
        };
      } catch (error) {
        return { 
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    await page.waitForTimeout(3000);
    
    console.log('\n📊 RESULTADO DE LA BÚSQUEDA:');
    console.log('═══════════════════════════════\n');
    
    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      if (result.stack) console.log(`Stack: ${result.stack}`);
    } else {
      console.log(`✅ Status: ${result.status}`);
      console.log(`✅ Success: ${result.success}`);
      console.log(`   Count: ${result.data.count}`);
      console.log(`   Breakdown:`, JSON.stringify(result.data.breakdown, null, 2));
      
      if (result.data.suppliers && result.data.suppliers.length > 0) {
        console.log(`\n📋 PROVEEDORES ENCONTRADOS (${result.data.suppliers.length}):`);
        result.data.suppliers.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.name} [${s.source || 'unknown'}]`);
        });
      } else {
        console.log('\n⚠️ NO SE ENCONTRARON PROVEEDORES');
      }
    }
    
    console.log('\n📝 LOGS RELEVANTES DE searchSuppliersHybrid:');
    console.log('══════════════════════════════════════════════\n');
    const hybridLogs = logs.filter(log => 
      log.includes('searchSuppliersHybrid') || 
      log.includes('Google Places')
    );
    hybridLogs.forEach(log => console.log(`   ${log}`));
    
    console.log('\n🔍 ANÁLISIS:');
    console.log('═══════════\n');
    
    const hasQueryLog = logs.some(l => l.includes('🔎 [searchSuppliersHybrid] Query:'));
    console.log(`   Query detectado: ${hasQueryLog ? '✅' : '❌'}`);
    
    const hasGooglePlacesCall = logs.some(l => l.includes('🌐 [searchSuppliersHybrid] Buscando también en Google Places'));
    console.log(`   Llamó a Google Places: ${hasGooglePlacesCall ? '✅' : '❌'}`);
    
    const hasFrontendLog = logs.some(l => l.includes('Google Places Frontend'));
    console.log(`   Log del Frontend: ${hasFrontendLog ? '✅' : '❌'}`);
    
    const hasProxyResponse = logs.some(l => l.includes('Google Places Frontend] Respuesta del proxy'));
    console.log(`   Respuesta del proxy: ${hasProxyResponse ? '✅' : '❌'}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ ERRORES ENCONTRADOS (${errors.length}):`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    // Assertions
    expect(result.error).toBeUndefined();
    expect(result.data.count).toBeGreaterThan(0);
  });

  test('verificar directamente el endpoint del proxy', async ({ request }) => {
    console.log('\n🧪 TEST: Llamada directa al proxy del backend\n');
    
    try {
      const response = await request.post('http://localhost:4004/api/google-places/search', {
        data: {
          query: 'audioprobe',
          location: 'Valencia',
          category: 'musica',
          isSpecificName: true
        },
        timeout: 15000
      });
      
      console.log(`📡 Status: ${response.status()}`);
      
      if (!response.ok()) {
        const text = await response.text();
        console.log(`❌ Response: ${text}`);
        throw new Error(`HTTP ${response.status()}`);
      }
      
      const data = await response.json();
      console.log(`✅ Source: ${data.source}`);
      console.log(`✅ Count: ${data.count || data.results?.length || 0}`);
      console.log(`✅ Results: ${data.results?.length || 0}`);
      
      if (data.results && data.results.length > 0) {
        console.log(`\n📋 PRIMEROS 3 RESULTADOS:`);
        data.results.slice(0, 3).forEach((r, i) => {
          console.log(`   ${i+1}. ${r.name} - ${r.rating}★`);
        });
      } else {
        console.log('\n⚠️ EL PROXY NO DEVUELVE RESULTADOS');
        if (data.error) {
          console.log(`❌ Error del proxy: ${data.error}`);
        }
      }
      
      expect(response.status()).toBe(200);
      expect(data.source).toBe('google_places');
      
    } catch (error) {
      console.log(`\n❌ ERROR en llamada al proxy:`);
      console.log(`   ${error.message}`);
      throw error;
    }
  });
});
