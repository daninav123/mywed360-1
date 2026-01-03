import { test, expect } from '@playwright/test';

test.describe('Búsqueda de Proveedores con Google Places', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar listeners para logs de consola
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`[BROWSER ${msg.type()}]:`, msg.text());
      }
    });
    
    // Ir a la página de proveedores
    await page.goto('/proveedores');
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar logs de Google Places al buscar "audioprobe"', async ({ page }) => {
    console.log('\n🧪 TEST: Buscando "audioprobe"\n');
    
    // Esperar logs específicos
    const googlePlacesLog = page.waitForEvent('console', msg => 
      msg.text().includes('🌐 [searchSuppliersHybrid] Buscando también en Google Places')
    );
    
    // Buscar en el campo de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]').first();
    await searchInput.fill('audioprobe');
    await searchInput.press('Enter');
    
    // Esperar a que se complete la búsqueda
    await page.waitForTimeout(3000);
    
    // Verificar que se llamó a Google Places
    try {
      await googlePlacesLog;
      console.log('✅ Google Places fue llamado');
    } catch (error) {
      console.log('❌ Google Places NO fue llamado');
      throw error;
    }
  });

  test('debería mostrar resultados de Google Places', async ({ page }) => {
    console.log('\n🧪 TEST: Verificando resultados de Google Places\n');
    
    // Buscar
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
    await searchInput.fill('dj valencia');
    await searchInput.press('Enter');
    
    // Esperar resultados
    await page.waitForTimeout(3000);
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/search-results.png', fullPage: true });
    
    // Verificar que hay resultados
    const resultsContainer = page.locator('[class*="result"], [class*="card"], [class*="supplier"]');
    const count = await resultsContainer.count();
    
    console.log(`📊 Encontrados ${count} elementos de resultados`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('debería verificar llamadas a la API', async ({ page }) => {
    console.log('\n🧪 TEST: Verificando llamadas a API\n');
    
    // Capturar requests
    const apiCalls = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/suppliers') || url.includes('googleapis.com')) {
        apiCalls.push({
          url,
          method: request.method(),
        });
        console.log(`📡 API Call: ${request.method()} ${url}`);
      }
    });
    
    // Buscar
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
    await searchInput.fill('fotógrafo');
    await searchInput.press('Enter');
    
    // Esperar
    await page.waitForTimeout(3000);
    
    console.log(`\n📊 Total API calls: ${apiCalls.length}`);
    apiCalls.forEach(call => console.log(`  - ${call.method} ${call.url}`));
    
    // Verificar que se hizo al menos 1 llamada a la API de suppliers
    const suppliersCalls = apiCalls.filter(c => c.url.includes('/api/suppliers'));
    expect(suppliersCalls.length).toBeGreaterThan(0);
  });

  test('debería verificar variable de entorno GOOGLE_PLACES_API_KEY', async ({ page }) => {
    console.log('\n🧪 TEST: Verificando API Key de Google Places\n');
    
    // Ejecutar código en el navegador para verificar la variable
    const apiKey = await page.evaluate(() => {
      return import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    });
    
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NO CONFIGURADA');
    
    if (!apiKey) {
      console.log('❌ VITE_GOOGLE_PLACES_API_KEY no está configurada');
      throw new Error('Google Places API Key no configurada');
    }
    
    expect(apiKey).toBeTruthy();
    expect(apiKey).toContain('AIza');
  });

  test('debería verificar que webSearchService está importado', async ({ page }) => {
    console.log('\n🧪 TEST: Verificando imports de módulos\n');
    
    // Verificar errores de módulos
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('❌ Error en página:', error.message);
    });
    
    // Recargar para capturar errores de carga
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Buscar para forzar el uso del módulo
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    await page.waitForTimeout(2000);
    
    console.log(`\n📊 Errores encontrados: ${errors.length}`);
    errors.forEach(err => console.log(`  - ${err}`));
    
    // Verificar que no hay errores de módulos
    const moduleErrors = errors.filter(e => 
      e.includes('import') || 
      e.includes('module') || 
      e.includes('webSearchService')
    );
    
    expect(moduleErrors.length).toBe(0);
  });
});
