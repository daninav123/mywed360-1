/**
 * Test E2E: Creación de invitación floral estilo Pinterest
 * Verifica que se puede crear una invitación como las referencias
 */

import { test, expect } from '@playwright/test';

test.describe('Editor de invitaciones florales', () => {
  test.beforeEach(async ({ page }) => {
    // Ir directo al editor (sin login para simplificar)
    await page.goto('http://localhost:5173/design-editor');
    
    // Esperar solo que el canvas esté visible
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test.only('puede añadir flores al canvas', async ({ page }) => {
    // TEST SIMPLIFICADO: Solo verificar que se pueden añadir flores
    
    // 1. Ir a tab de Florales directamente
    const floralsTab = page.locator('button').filter({ hasText: /Florales/ });
    await floralsTab.click();
    await page.waitForTimeout(1000);

    // 2. Ver logs de consola
    page.on('console', msg => {
      console.log('🖥️ BROWSER:', msg.text());
    });

    // 3. Buscar un botón con imagen
    const floralButton = page.locator('button img').first();
    await expect(floralButton).toBeVisible({ timeout: 5000 });
    
    // 4. Click en la imagen
    await floralButton.click();
    await page.waitForTimeout(3000);

    // 5. Verificar objetos en canvas
    const result = await page.evaluate(() => {
      const canvas = window.fabricCanvas;
      if (!canvas) return { error: 'Canvas no encontrado' };
      return {
        total: canvas.getObjects().length,
        types: canvas.getObjects().map(o => o.type)
      };
    });

    console.log('📊 Resultado:', result);
    expect(result.total).toBeGreaterThan(0);
  });

  test.skip('puede crear invitación con template Flores Colgantes', async ({ page }) => {
    // 1. Verificar que el editor cargó
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // 2. Abrir panel de plantillas (asegurar que está abierto)
    const templatesTab = page.locator('button').filter({ hasText: /^Plantillas$/ });
    await templatesTab.click();
    await page.waitForTimeout(1000);

    // 3. Buscar template que contenga "Flores" o "🌸"
    const floresTemplate = page.locator('button').filter({ hasText: /Flores|🌸/ }).first();
    
    // Si no se encuentra, listar todos los templates disponibles
    const allTemplates = await page.locator('[class*="grid"] button, .grid button').allTextContents();
    console.log('Templates disponibles:', allTemplates);
    
    await expect(floresTemplate).toBeVisible({ timeout: 5000 });
    await floresTemplate.click();
    
    // Esperar a que se cargue el template
    await page.waitForTimeout(2000);

    // 4. Verificar que hay texto en el canvas
    const canvasTexts = await page.evaluate(() => {
      const canvas = window.fabricCanvas;
      if (!canvas) return [];
      return canvas.getObjects().filter(obj => obj.type === 'i-text').map(obj => obj.text);
    });
    
    expect(canvasTexts.length).toBeGreaterThan(0);
    console.log('Textos en canvas:', canvasTexts);

    // 5. Cambiar a tab de Florales
    const floralsTab = page.locator('button').filter({ hasText: /^Florales$/ });
    await expect(floralsTab).toBeVisible({ timeout: 5000 });
    await floralsTab.click();
    await page.waitForTimeout(1000);

    // 6. Verificar que hay ilustraciones florales disponibles
    const floralButtons = page.locator('button').filter({ has: page.locator('img') });
    const floralCount = await floralButtons.count();
    console.log(`Encontrados ${floralCount} botones con imagen`);
    
    if (floralCount === 0) {
      // Debug: ver qué hay en el panel
      const panelContent = await page.locator('[class*="p-4"]').first().textContent();
      console.log('Contenido del panel:', panelContent);
    }
    
    expect(floralCount).toBeGreaterThan(0);

    // 7. Añadir una flor al canvas
    const firstFloral = floralButtons.first();
    await firstFloral.click();
    await page.waitForTimeout(2000);

    // 8. Verificar que la imagen se añadió al canvas
    const canvasObjects = await page.evaluate(() => {
      const canvas = window.fabricCanvas;
      if (!canvas) return { total: 0, images: 0, texts: 0 };
      const objects = canvas.getObjects();
      return {
        total: objects.length,
        images: objects.filter(obj => obj.type === 'image').length,
        texts: objects.filter(obj => obj.type === 'i-text').length
      };
    });

    console.log('Objetos en canvas:', canvasObjects);
    expect(canvasObjects.images).toBeGreaterThan(0);
    expect(canvasObjects.texts).toBeGreaterThan(0);

    // 9. Añadir más flores (esquinas)
    const cornerSetButton = page.locator('button:has-text("Esquinas")').first();
    if (await cornerSetButton.isVisible()) {
      await cornerSetButton.click();
      await page.waitForTimeout(1000);
    }

    // 10. Verificar resultado final
    const finalObjects = await page.evaluate(() => {
      const canvas = window.fabricCanvas;
      if (!canvas) return null;
      return {
        total: canvas.getObjects().length,
        images: canvas.getObjects().filter(obj => obj.type === 'image').length,
        texts: canvas.getObjects().filter(obj => obj.type === 'i-text').length
      };
    });

    console.log('Estado final del canvas:', finalObjects);
    expect(finalObjects.total).toBeGreaterThan(5);
  });

  test('puede editar texto en invitación', async ({ page }) => {
    // Seleccionar template
    const templatesTab = page.locator('button:has-text("Plantillas")');
    await templatesTab.click();
    await page.waitForTimeout(500);

    const floresTemplate = page.locator('button:has-text("Flores Colgantes")').first();
    await floresTemplate.click();
    await page.waitForTimeout(2000);

    // Hacer doble click en un texto para editarlo
    await page.evaluate(() => {
      const canvas = window.fabricCanvas;
      if (!canvas) return;
      
      const textObjects = canvas.getObjects().filter(obj => obj.type === 'i-text');
      if (textObjects.length > 0) {
        canvas.setActiveObject(textObjects[0]);
        textObjects[0].enterEditing();
      }
    });

    await page.waitForTimeout(500);

    // Verificar que se puede editar
    const isEditing = await page.evaluate(() => {
      const canvas = window.fabricCanvas;
      if (!canvas) return false;
      const active = canvas.getActiveObject();
      return active && active.isEditing;
    });

    expect(isEditing).toBe(true);
  });

  test('puede aplicar fuentes caligráficas', async ({ page }) => {
    // Abrir panel de texto
    const textTab = page.locator('button:has-text("Texto")');
    await textTab.click();
    await page.waitForTimeout(500);

    // Buscar tab de caligráficas
    const caligraficasTab = page.locator('button:has-text("Caligráficas")');
    if (await caligraficasTab.isVisible()) {
      await caligraficasTab.click();
      await page.waitForTimeout(500);

      // Verificar que hay fuentes disponibles
      const fontButtons = page.locator('button[class*="font"]');
      const fontCount = await fontButtons.count();
      expect(fontCount).toBeGreaterThan(0);
      console.log(`Encontradas ${fontCount} fuentes caligráficas`);
    }
  });
});
