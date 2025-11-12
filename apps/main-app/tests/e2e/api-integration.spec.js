import { test, expect } from '@playwright/test';

test.describe('Integración de Google Places API', () => {
  
  test('verificar que la API Key está configurada en el entorno', async () => {
    console.log('\n🧪 TEST: Verificando configuración de API Key\n');
    
    // Leer el archivo .env
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '.env');
    
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf-8');
    } catch (error) {
      console.log('❌ No se pudo leer el archivo .env');
      throw error;
    }
    
    console.log('📄 Archivo .env encontrado');
    
    // Verificar que contiene la key de Google Places
    const hasGooglePlacesKey = envContent.includes('VITE_GOOGLE_PLACES_API_KEY');
    console.log(`🔑 VITE_GOOGLE_PLACES_API_KEY presente: ${hasGooglePlacesKey}`);
    
    expect(hasGooglePlacesKey).toBe(true);
    
    // Verificar que no está vacía
    const keyMatch = envContent.match(/VITE_GOOGLE_PLACES_API_KEY=(.+)/);
    if (keyMatch) {
      const keyValue = keyMatch[1].trim();
      console.log(`✅ API Key configurada: ${keyValue.substring(0, 10)}...`);
      expect(keyValue.length).toBeGreaterThan(10);
      expect(keyValue).toContain('AIza');
    }
  });

  test('verificar que webSearchService.js existe y es válido', async () => {
    console.log('\n🧪 TEST: Verificando webSearchService.js\n');
    
    const fs = await import('fs');
    const path = await import('path');
    const servicePath = path.join(process.cwd(), 'src/services/webSearchService.js');
    
    // Verificar que existe
    const exists = fs.existsSync(servicePath);
    console.log(`📄 webSearchService.js existe: ${exists}`);
    expect(exists).toBe(true);
    
    // Leer y verificar contenido
    const content = fs.readFileSync(servicePath, 'utf-8');
    
    // Verificar exports importantes
    const hasSearchGooglePlaces = content.includes('export const searchGooglePlaces');
    const hasSearchWeb = content.includes('export const searchWeb');
    const hasGetUserLocation = content.includes('export const getUserLocation');
    
    console.log(`✅ searchGooglePlaces exportado: ${hasSearchGooglePlaces}`);
    console.log(`✅ searchWeb exportado: ${hasSearchWeb}`);
    console.log(`✅ getUserLocation exportado: ${hasGetUserLocation}`);
    
    expect(hasSearchGooglePlaces).toBe(true);
    expect(hasSearchWeb).toBe(true);
  });

  test('verificar que suppliersService.js importa webSearchService', async () => {
    console.log('\n🧪 TEST: Verificando imports en suppliersService.js\n');
    
    const fs = await import('fs');
    const path = await import('path');
    const servicePath = path.join(process.cwd(), 'src/services/suppliersService.js');
    
    const content = fs.readFileSync(servicePath, 'utf-8');
    
    // Verificar import
    const hasImport = content.includes("import { searchGooglePlaces } from './webSearchService'");
    console.log(`✅ Import de webSearchService: ${hasImport}`);
    expect(hasImport).toBe(true);
    
    // Verificar que se usa en búsqueda paralela
    const usesGooglePlaces = content.includes('searchGooglePlaces(query');
    console.log(`✅ Usa searchGooglePlaces: ${usesGooglePlaces}`);
    expect(usesGooglePlaces).toBe(true);
    
    // Verificar log de búsqueda web
    const hasWebSearchLog = content.includes('🌐 [searchSuppliersHybrid] Buscando también en Google Places');
    console.log(`✅ Tiene log de búsqueda web: ${hasWebSearchLog}`);
    expect(hasWebSearchLog).toBe(true);
  });

  test('verificar estructura de promesas en paralelo', async () => {
    console.log('\n🧪 TEST: Verificando búsquedas en paralelo\n');
    
    const fs = await import('fs');
    const path = await import('path');
    const servicePath = path.join(process.cwd(), 'src/services/suppliersService.js');
    
    const content = fs.readFileSync(servicePath, 'utf-8');
    
    // Verificar Promise.all
    const hasPromiseAll = content.includes('Promise.all([backendPromise, googlePlacesPromise])');
    console.log(`✅ Usa Promise.all para búsquedas paralelas: ${hasPromiseAll}`);
    expect(hasPromiseAll).toBe(true);
    
    // Verificar formato de resultados
    const hasResultsFormatting = content.includes('googleSuppliersFormatted');
    console.log(`✅ Formatea resultados de Google: ${hasResultsFormatting}`);
    expect(hasResultsFormatting).toBe(true);
    
    // Verificar que marca resultados como externos
    const marksAsExternal = content.includes('isExternal: true');
    console.log(`✅ Marca resultados como externos: ${marksAsExternal}`);
    expect(marksAsExternal).toBe(true);
  });

  test('verificar detección de nombres específicos', async () => {
    console.log('\n🧪 TEST: Verificando detección de nombres específicos\n');
    
    const fs = await import('fs');
    const path = await import('path');
    const orchestratorPath = path.join(process.cwd(), 'src/services/aiSearchOrchestrator.js');
    
    const content = fs.readFileSync(orchestratorPath, 'utf-8');
    
    // Verificar lógica de detección
    const hasSpecificNameDetection = content.includes('isSpecificName');
    console.log(`✅ Tiene detección de nombres específicos: ${hasSpecificNameDetection}`);
    expect(hasSpecificNameDetection).toBe(true);
    
    // Verificar regex para mayúsculas
    const hasCapitalRegex = content.includes('looksLikeProperName');
    console.log(`✅ Detecta nombres propios: ${hasCapitalRegex}`);
    expect(hasCapitalRegex).toBe(true);
  });
});

test.describe('Verificación de código sin errores de sintaxis', () => {
  
  test('webSearchService.js no tiene errores de sintaxis', async () => {
    console.log('\n🧪 TEST: Verificando sintaxis de webSearchService.js\n');
    
    try {
      // Intentar importar el módulo
      await import('../../src/services/webSearchService.js');
      console.log('✅ webSearchService.js se importó correctamente');
    } catch (error) {
      console.log('❌ Error al importar webSearchService.js:', error.message);
      throw error;
    }
  });

  test('aiSearchOrchestrator.js no tiene errores de sintaxis', async () => {
    console.log('\n🧪 TEST: Verificando sintaxis de aiSearchOrchestrator.js\n');
    
    try {
      await import('../../src/services/aiSearchOrchestrator.js');
      console.log('✅ aiSearchOrchestrator.js se importó correctamente');
    } catch (error) {
      console.log('❌ Error al importar aiSearchOrchestrator.js:', error.message);
      throw error;
    }
  });
});
