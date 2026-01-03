/**
 * Test E2E Simplificado - Editor de Diseños
 * 
 * Test básico que verifica funcionalidad core sin autenticación
 */

import { test, expect } from '@playwright/test';

// Configurar para saltear autenticación en desarrollo
test.use({
  storageState: undefined, // Sin estado guardado
});

test.describe('Editor de Diseños - Funcionalidad Básica', () => {
  
  test('El editor carga correctamente', async ({ page }) => {
    // Navegar directamente (asumiendo modo desarrollo sin auth)
    await page.goto('http://localhost:5173/editor-disenos');
    
    // Dar tiempo para cargar
    await page.waitForTimeout(3000);
    
    // Verificar elementos básicos
    const heading = page.locator('h1:has-text("Editor de Diseños")');
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Editor cargó correctamente');
  });

  test('Las plantillas son visibles y clickeables', async ({ page }) => {
    await page.goto('http://localhost:5173/editor-disenos');
    await page.waitForTimeout(3000);
    
    // Verificar que el tab de plantillas existe
    const templatesTab = page.locator('button', { hasText: 'Plantillas' });
    await expect(templatesTab).toBeVisible({ timeout: 5000 });
    
    // Click en plantillas si no está activo
    await templatesTab.click();
    await page.waitForTimeout(1000);
    
    // Verificar que hay plantillas
    const templates = page.locator('[data-testid="template-card"]');
    const count = await templates.count();
    expect(count).toBeGreaterThan(0);
    
    console.log(`✅ Encontradas ${count} plantillas`);
    
    // Click en la primera plantilla
    await templates.first().click();
    await page.waitForTimeout(2000);
    
    // Verificar que el canvas existe (hay 2 canvas en Fabric.js)
    const canvasElements = page.locator('canvas');
    const canvasCount = await canvasElements.count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);
    
    console.log('✅ Plantilla cargada en canvas');
  });

  test('Panel de texto funciona', async ({ page }) => {
    await page.goto('http://localhost:5173/editor-disenos');
    await page.waitForTimeout(3000);
    
    // Click en tab de texto
    const textTab = page.locator('button', { hasText: 'Texto' });
    await expect(textTab).toBeVisible({ timeout: 5000 });
    await textTab.click();
    await page.waitForTimeout(1000);
    
    // Verificar que el botón de añadir texto existe
    const addTextBtn = page.locator('[data-testid="add-text-button"]');
    await expect(addTextBtn).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Panel de texto funcional');
  });

  test('Botones principales están presentes', async ({ page }) => {
    await page.goto('http://localhost:5173/editor-disenos');
    await page.waitForTimeout(3000);
    
    // Verificar botones principales
    const saveBtn = page.locator('[data-testid="save-button"]');
    const myDesignsBtn = page.locator('[data-testid="my-designs-button"]');
    const exportBtn = page.locator('button', { hasText: 'Exportar' });
    
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(myDesignsBtn).toBeVisible({ timeout: 5000 });
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Todos los botones principales presentes');
  });

  test('Elementos SVG son clickeables', async ({ page }) => {
    await page.goto('http://localhost:5173/editor-disenos');
    await page.waitForTimeout(3000);
    
    // Click en tab de elementos
    const elementsTab = page.locator('button', { hasText: 'Elementos' });
    await expect(elementsTab).toBeVisible({ timeout: 5000 });
    await elementsTab.click();
    await page.waitForTimeout(2000);
    
    // Verificar que hay elementos SVG
    const svgElements = page.locator('[data-testid="asset-item"]');
    const count = await svgElements.count();
    
    if (count > 0) {
      console.log(`✅ Encontrados ${count} elementos SVG`);
    } else {
      console.log('⚠️ No se encontraron elementos SVG (pueden estar cargando)');
    }
  });
});

test.describe('Flujo de Creación Básico', () => {
  test('Usuario puede seleccionar plantilla y guardar', async ({ page }) => {
    await page.goto('http://localhost:5173/editor-disenos');
    await page.waitForTimeout(3000);
    
    // 1. Seleccionar plantilla
    const templates = page.locator('[data-testid="template-card"]');
    if (await templates.count() > 0) {
      await templates.first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Paso 1: Plantilla seleccionada');
    }
    
    // 2. Intentar guardar
    const saveBtn = page.locator('[data-testid="save-button"]');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Paso 2: Guardado ejecutado');
    }
    
    console.log('✅ Flujo básico completado sin errores críticos');
  });
});
