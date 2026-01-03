import { test, expect } from '@playwright/test';

test.describe('Test del Proxy de Google Places', () => {
  
  test('verificar que el endpoint del proxy existe', async ({ request }) => {
    console.log('\n🧪 TEST: Verificando endpoint /api/google-places/search\n');
    
    const response = await request.post('http://localhost:4004/api/google-places/search', {
      data: {
        query: 'audioprobe',
        location: 'Valencia',
        category: 'musica',
        isSpecificName: true,
      }
    });
    
    console.log(`📡 Status: ${response.status()}`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    console.log(`✅ Respuesta recibida:`);
    console.log(`   - Count: ${data.count}`);
    console.log(`   - Source: ${data.source}`);
    console.log(`   - Results: ${data.results?.length || 0}`);
    
    if (data.results && data.results.length > 0) {
      console.log(`\n📋 PRIMEROS 3 RESULTADOS:`);
      data.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. ${r.name} - ${r.rating}★ (${r.reviewCount} reviews)`);
      });
    }
    
    expect(data.source).toBe('google_places');
  });

  test('llamar desde el navegador a través del frontend', async ({ page }) => {
    console.log('\n🧪 TEST: Llamada desde el navegador\n');
    
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Google Places') || text.includes('searchSuppliersHybrid')) {
        console.log(`📝 ${text}`);
        logs.push(text);
      }
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('\n📡 Ejecutando búsqueda de "audioprobe"...\n');
    
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/suppliers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service: 'musica',
          location: 'Valencia',
          query: 'audioprobe',
          filters: {}
        })
      });
      
      const data = await response.json();
      return { data, status: response.status };
    });
    
    await page.waitForTimeout(3000);
    
    console.log(`\n📊 RESULTADO:`);
    console.log(`Status: ${result.status}`);
    console.log(`Count: ${result.data.count}`);
    console.log(`Breakdown:`, result.data.breakdown);
    console.log(`Has Google Results: ${result.data.hasGoogleResults}`);
    
    if (result.data.suppliers && result.data.suppliers.length > 0) {
      console.log(`\n📋 PROVEEDORES (primeros 5):`);
      result.data.suppliers.slice(0, 5).forEach((s, i) => {
        console.log(`  ${i+1}. ${s.name} (${s.source})`);
      });
    }
    
    // Verificar que NO hay error de CORS
    const hasCorsError = logs.some(log => log.includes('CORS') || log.includes('Access-Control'));
    console.log(`\n✅ Sin errores CORS: ${!hasCorsError}`);
    expect(hasCorsError).toBe(false);
    
    // Verificar que se intentó llamar al proxy
    const hasProxyCall = logs.some(log => log.includes('Google Places Frontend') || log.includes('proxy'));
    console.log(`✅ Llamó al proxy: ${hasProxyCall}`);
    
    // Verificar que hay resultados
    expect(result.data.count).toBeGreaterThan(0);
  });
});
