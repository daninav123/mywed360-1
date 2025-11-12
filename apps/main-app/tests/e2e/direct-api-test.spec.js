import { test, expect } from '@playwright/test';

test.describe('Test Directo de API con Query', () => {
  
  test('llamar a API con query "audioprobe" y capturar logs', async ({ page, request }) => {
    console.log('\n🧪 TEST: Llamada con query "audioprobe"\n');
    
    // Configurar captura de logs del navegador
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('searchSuppliersHybrid') || text.includes('Google Places')) {
        console.log(`📝 ${text}`);
      }
    });
    
    // Navegar a la app para tener contexto del navegador
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('\n📡 Llamando a la API con query "audioprobe"...\n');
    
    // Llamar a la API desde el contexto del navegador
    const result = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/suppliers/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            service: 'musica',
            location: 'Valencia',
            query: 'audioprobe',
            filters: {}
          })
        });
        
        const data = await response.json();
        return { success: true, data, status: response.status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('\n📊 RESULTADO:\n');
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log(`Count: ${result.data.count}`);
      console.log(`Breakdown:`, result.data.breakdown);
      console.log(`Suppliers: ${result.data.suppliers?.length || 0}`);
      console.log(`Has Google Results: ${result.data.hasGoogleResults}`);
      
      if (result.data.suppliers && result.data.suppliers.length > 0) {
        console.log('\n📋 PROVEEDORES ENCONTRADOS:');
        result.data.suppliers.forEach((s, i) => {
          console.log(`  ${i+1}. ${s.name} (${s.source || 'local'})`);
        });
      }
    } else {
      console.log(`Error: ${result.error}`);
    }
    
    // Esperar un poco para capturar más logs
    await page.waitForTimeout(2000);
    
    console.log('\n📝 LOGS RELEVANTES CAPTURADOS:');
    const relevantLogs = logs.filter(log => 
      log.includes('searchSuppliersHybrid') ||
      log.includes('Google Places') ||
      log.includes('🔎') ||
      log.includes('🌐')
    );
    relevantLogs.forEach(log => console.log(`  ${log}`));
    
    // Verificar que se intentó buscar en Google Places
    const hasGooglePlacesAttempt = logs.some(log => 
      log.includes('🌐 [searchSuppliersHybrid] Buscando también en Google Places')
    );
    
    console.log(`\n✅ Intentó buscar en Google Places: ${hasGooglePlacesAttempt}`);
  });

  test('llamar a API con query "dj valencia"', async ({ page }) => {
    console.log('\n🧪 TEST: Llamada con query "dj valencia"\n');
    
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('searchSuppliersHybrid') || text.includes('Google Places')) {
        console.log(`📝 ${text}`);
      }
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/suppliers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service: 'dj',
          location: 'Valencia',
          query: 'dj valencia',
          filters: {}
        })
      });
      
      const data = await response.json();
      return { data, status: response.status };
    });
    
    console.log('\n📊 RESULTADO:');
    console.log(`Breakdown:`, result.data.breakdown);
    console.log(`Has Google Results: ${result.data.hasGoogleResults}`);
    
    await page.waitForTimeout(2000);
  });
});
