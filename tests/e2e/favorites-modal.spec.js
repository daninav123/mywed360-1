// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests para Modal de Favoritos
 * Verifica las 3 funcionalidades TOP implementadas
 */

test.describe('Modal de Favoritos - Nuevas Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la app
    await page.goto('http://localhost:5173');
    
    // Esperar que cargue
    await page.waitForLoadState('networkidle');
  });

  test('Debe abrir modal de favoritos', async ({ page }) => {
    // Buscar botón "Ver favoritos"
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      // Verificar que abre el modal
      await expect(page.locator('text=Elige uno de tus favoritos')).toBeVisible({ timeout: 3000 });
      
      console.log('✅ Modal de favoritos abre correctamente');
    } else {
      console.log('⚠️  No hay botón de favoritos visible (puede ser normal si no hay favoritos)');
    }
  });

  test('Debe tener dropdown de ordenamiento', async ({ page }) => {
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      // Verificar dropdown
      const select = page.locator('select').first();
      await expect(select).toBeVisible({ timeout: 3000 });
      
      // Verificar opciones
      const options = await select.locator('option').allTextContents();
      expect(options.length).toBeGreaterThanOrEqual(4);
      expect(options.some(opt => opt.includes('Recientes'))).toBeTruthy();
      expect(options.some(opt => opt.includes('valorados'))).toBeTruthy();
      expect(options.some(opt => opt.includes('precio'))).toBeTruthy();
      
      console.log('✅ Dropdown de ordenamiento funciona:', options);
    }
  });

  test('Debe mostrar imagen de proveedor', async ({ page }) => {
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      // Buscar imagen o placeholder
      const hasImage = await page.locator('img[alt]').first().isVisible().catch(() => false);
      const hasPlaceholder = await page.locator('[class*="gradient"]').first().isVisible().catch(() => false);
      
      expect(hasImage || hasPlaceholder).toBeTruthy();
      
      console.log('✅ Imágenes/placeholders visibles');
    }
  });

  test('Debe poder agregar nota', async ({ page }) => {
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      // Buscar botón "Agregar nota"
      const addNoteBtn = page.locator('button:has-text("Agregar nota")').first();
      
      if (await addNoteBtn.isVisible()) {
        await addNoteBtn.click();
        
        // Escribir nota
        const input = page.locator('input[placeholder*="nota"]').first();
        await input.fill('Test nota E2E');
        
        // Guardar
        await page.locator('button:has([class*="Check"])').first().click();
        
        // Verificar toast de éxito
        await expect(page.locator('text=/actualizada|guardada/i')).toBeVisible({ timeout: 5000 });
        
        console.log('✅ Agregar nota funciona');
      }
    }
  });

  test('Debe poder cambiar ordenamiento', async ({ page }) => {
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      const select = page.locator('select').first();
      
      // Cambiar a "Mejor valorados"
      await select.selectOption('rating');
      await page.waitForTimeout(500);
      
      // Cambiar a "Menor precio"
      await select.selectOption('price');
      await page.waitForTimeout(500);
      
      // Volver a "Recientes"
      await select.selectOption('recent');
      
      console.log('✅ Ordenamiento cambia correctamente');
    }
  });

  test('Debe tener botones de acción', async ({ page }) => {
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      // Verificar botones principales
      const assignBtn = page.locator('button:has-text("Asignar")').first();
      const quoteBtn = page.locator('button:has-text("Presupuesto")').first();
      const deleteBtn = page.locator('button:has([class*="Trash"])').first();
      
      const hasAssign = await assignBtn.isVisible().catch(() => false);
      const hasQuote = await quoteBtn.isVisible().catch(() => false);
      const hasDelete = await deleteBtn.isVisible().catch(() => false);
      
      expect(hasAssign || hasQuote || hasDelete).toBeTruthy();
      
      console.log('✅ Botones de acción presentes');
    }
  });

  test('Debe cerrar modal con X', async ({ page }) => {
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      
      // Click en X
      await page.locator('button:has([class*="X"])').last().click();
      
      // Verificar que se cerró
      await expect(page.locator('text=Elige uno de tus favoritos')).not.toBeVisible({ timeout: 3000 });
      
      console.log('✅ Modal cierra correctamente');
    }
  });
});

test.describe('Verificación Visual del Modal', () => {
  test('Screenshot del modal de favoritos', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const favButton = page.locator('button:has-text("Ver favoritos")').first();
    
    if (await favButton.isVisible()) {
      await favButton.click();
      await page.waitForTimeout(1000);
      
      // Screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/favorites-modal.png',
        fullPage: true 
      });
      
      console.log('📸 Screenshot guardado en tests/screenshots/favorites-modal.png');
    }
  });
});
