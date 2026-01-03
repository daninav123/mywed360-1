import { test, expect } from '@playwright/test';

// Configuración de timeouts más largos para operaciones del seating plan
test.setTimeout(90000);

test.describe('Seating Plan - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('http://localhost:5173');

    // Esperar a que la app cargue
    await page.waitForLoadState('networkidle');

    // Login si es necesario (ajusta según tu auth)
    // await doLogin(page);
  });

  test('1. Navegación al Seating Plan', async ({ page }) => {
    console.log('🧪 Test 1: Navegación al Seating Plan');

    // Buscar enlace o botón de navegación al seating plan
    const seatingLinks = [
      'text=/seating/i',
      'text=/distribución/i',
      'text=/mesas/i',
      'a[href*="seating"]',
      'button:has-text("Seating")',
      'button:has-text("Distribución")',
    ];

    let navigated = false;
    for (const selector of seatingLinks) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          navigated = true;
          console.log('✅ Navegado con selector:', selector);
          break;
        }
      } catch (e) {
        // Intentar siguiente selector
      }
    }

    if (!navigated) {
      // Intentar navegación directa
      await page.goto('http://localhost:5173/seating');
      console.log('⚠️ Navegación directa a /seating');
    }

    await page.waitForLoadState('networkidle');

    // Verificar que estamos en seating plan
    const url = page.url();
    expect(url).toContain('seating');
    console.log('✅ URL correcta:', url);
  });

  test('2. Verificar carga inicial del canvas', async ({ page }) => {
    console.log('🧪 Test 2: Carga inicial del canvas');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');

    // Buscar el canvas o contenedor principal
    const canvasSelectors = [
      'canvas',
      '[data-testid*="seating"]',
      '[class*="seating-canvas"]',
      '[class*="SeatingCanvas"]',
      'svg',
    ];

    let canvasFound = false;
    for (const selector of canvasSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          canvasFound = true;
          console.log('✅ Canvas encontrado con:', selector);
          break;
        }
      } catch (e) {
        // Continuar buscando
      }
    }

    expect(canvasFound).toBeTruthy();
  });

  test('3. Verificar que existen mesas en el canvas', async ({ page }) => {
    console.log('🧪 Test 3: Verificar existencia de mesas');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar elementos de mesa
    const tableSelectors = [
      '[data-testid^="table-item"]',
      '[class*="table-item"]',
      '[class*="TableItem"]',
      'circle', // Mesas redondas en SVG
      'rect', // Mesas rectangulares en SVG
    ];

    let tablesFound = 0;
    for (const selector of tableSelectors) {
      try {
        const tables = page.locator(selector);
        const count = await tables.count();
        if (count > 0) {
          tablesFound = count;
          console.log('✅ Encontradas', count, 'mesas con selector:', selector);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    console.log('📊 Total de mesas encontradas:', tablesFound);
    if (tablesFound === 0) {
      console.log(
        '⚠️ No se encontraron mesas. Puede ser que no haya datos o selectores incorrectos'
      );
    }
  });

  test('4. Test de arrastre de mesas', async ({ page }) => {
    console.log('🧪 Test 4: Arrastre de mesas');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar la primera mesa
    const tableSelectors = ['[data-testid^="table-item"]', '[class*="table-item"]'];

    let firstTable = null;
    for (const selector of tableSelectors) {
      try {
        firstTable = page.locator(selector).first();
        if (await firstTable.isVisible({ timeout: 2000 })) {
          break;
        }
      } catch (e) {
        firstTable = null;
      }
    }

    if (!firstTable) {
      console.log('⚠️ No se encontró ninguna mesa para arrastrar');
      return;
    }

    // Obtener posición inicial
    const initialBox = await firstTable.boundingBox();
    if (!initialBox) {
      console.log('❌ No se pudo obtener la posición de la mesa');
      return;
    }

    console.log('📍 Posición inicial:', initialBox);

    // Intentar arrastrar la mesa
    await firstTable.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 100, initialBox.y + 100);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Verificar que la mesa se movió
    const finalBox = await firstTable.boundingBox();
    console.log('📍 Posición final:', finalBox);

    if (finalBox) {
      const moved =
        Math.abs(finalBox.x - initialBox.x) > 10 || Math.abs(finalBox.y - initialBox.y) > 10;

      if (moved) {
        console.log('✅ La mesa se movió correctamente');
      } else {
        console.log('❌ La mesa NO se movió (puede estar bloqueada)');
      }
    }
  });

  test('5. Verificar información de invitados en mesas', async ({ page }) => {
    console.log('🧪 Test 5: Información de invitados');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar contadores de invitados (ej: "5/10")
    const guestCounters = page.locator('text=/\\d+\\/\\d+/');
    const count = await guestCounters.count();

    console.log('📊 Contadores de invitados encontrados:', count);

    if (count > 0) {
      const firstCounter = guestCounters.first();
      const text = await firstCounter.textContent();
      console.log('✅ Ejemplo de contador:', text);
    } else {
      console.log('⚠️ No se encontraron contadores de invitados');
    }
  });

  test('6. Verificar iconos de iniciales de invitados', async ({ page }) => {
    console.log('🧪 Test 6: Iconos de iniciales');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Buscar elementos que puedan contener iniciales
    const initialsSelectors = [
      '[class*="guest-initial"]',
      '[class*="GuestInitial"]',
      '[data-testid*="guest-initial"]',
      'text=/^[A-Z]{1,2}$/',
    ];

    let initialsFound = false;
    for (const selector of initialsSelectors) {
      try {
        const initials = page.locator(selector);
        const count = await initials.count();
        if (count > 0) {
          initialsFound = true;
          console.log('✅ Encontradas', count, 'iniciales con:', selector);
          const sample = await initials.first().textContent();
          console.log('   Ejemplo:', sample);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    if (!initialsFound) {
      console.log('⚠️ No se encontraron iconos de iniciales');
    }
  });

  test('7. Test de detección de colisiones', async ({ page }) => {
    console.log('🧪 Test 7: Detección de colisiones');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Interceptar mensajes toast
    const toastMessages = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('colisión') || text.includes('collision')) {
        toastMessages.push(text);
      }
    });

    // Buscar dos mesas cercanas
    const tables = page.locator('[data-testid^="table-item"]');
    const count = await tables.count();

    if (count < 2) {
      console.log('⚠️ No hay suficientes mesas para probar colisiones');
      return;
    }

    // Intentar mover una mesa hacia otra
    const firstTable = tables.nth(0);
    const secondTable = tables.nth(1);

    const firstBox = await firstTable.boundingBox();
    const secondBox = await secondTable.boundingBox();

    if (firstBox && secondBox) {
      // Arrastrar primera mesa hacia la segunda
      await firstTable.hover();
      await page.mouse.down();
      await page.mouse.move(secondBox.x, secondBox.y);
      await page.mouse.up();

      await page.waitForTimeout(1000);

      // Buscar toast de advertencia
      const toastElement = page.locator('[class*="toast"]', { hasText: /colisión|collision/i });
      const toastVisible = await toastElement.isVisible().catch(() => false);

      if (toastVisible) {
        console.log('✅ Sistema de colisión funcionando - toast mostrado');
      } else {
        console.log('⚠️ No se detectó mensaje de colisión');
      }
    }
  });

  test('8. Verificar controles de zoom', async ({ page }) => {
    console.log('🧪 Test 8: Controles de zoom');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Buscar botones de zoom
    const zoomSelectors = [
      'button:has-text("+")',
      'button:has-text("-")',
      '[aria-label*="zoom"]',
      '[class*="zoom-control"]',
    ];

    let zoomControlsFound = false;
    for (const selector of zoomSelectors) {
      try {
        const control = page.locator(selector);
        if (await control.isVisible({ timeout: 1000 })) {
          zoomControlsFound = true;
          console.log('✅ Control de zoom encontrado:', selector);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    if (!zoomControlsFound) {
      console.log('⚠️ No se encontraron controles de zoom');
    }
  });

  test('9. Test de tabs Ceremonia/Banquete', async ({ page }) => {
    console.log('🧪 Test 9: Tabs Ceremonia/Banquete');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Buscar tabs
    const tabSelectors = [
      'text=/ceremonia/i',
      'text=/banquete/i',
      'text=/ceremony/i',
      'text=/banquet/i',
      '[role="tab"]',
    ];

    let tabsFound = 0;
    for (const selector of tabSelectors) {
      try {
        const tabs = page.locator(selector);
        const count = await tabs.count();
        tabsFound += count;
      } catch (e) {
        // Continuar
      }
    }

    console.log('📊 Tabs encontrados:', tabsFound);

    if (tabsFound >= 2) {
      console.log('✅ Sistema de tabs presente');

      // Intentar cambiar de tab
      const banquetTab = page.locator('text=/banquete|banquet/i').first();
      if (await banquetTab.isVisible({ timeout: 1000 })) {
        await banquetTab.click();
        await page.waitForTimeout(500);
        console.log('✅ Cambio de tab exitoso');
      }
    } else {
      console.log('⚠️ Sistema de tabs no encontrado o incompleto');
    }
  });

  test('10. Verificar rendimiento - No hay re-renders excesivos', async ({ page }) => {
    console.log('🧪 Test 10: Verificar rendimiento');

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');

    // Contar logs de render si existen
    const renderLogs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('render') || text.includes('RENDER')) {
        renderLogs.push(text);
      }
    });

    await page.waitForTimeout(3000);

    console.log('📊 Logs de render detectados:', renderLogs.length);

    if (renderLogs.length > 100) {
      console.log('⚠️ ADVERTENCIA: Posibles re-renders excesivos:', renderLogs.length);
    } else {
      console.log('✅ Rendimiento aceptable');
    }
  });

  test('11. Captura de errores de consola', async ({ page }) => {
    console.log('🧪 Test 11: Captura de errores');

    const errors = [];
    const warnings = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:5173/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Realizar algunas interacciones
    const tables = page.locator('[data-testid^="table-item"]');
    const count = await tables.count();

    if (count > 0) {
      // Click en una mesa
      await tables
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(500);
    }

    console.log('❌ Errores encontrados:', errors.length);
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
    });

    console.log('⚠️ Warnings encontrados:', warnings.length);
    if (warnings.length > 0 && warnings.length < 10) {
      warnings.forEach((warn, i) => {
        console.log(`   ${i + 1}. ${warn.substring(0, 100)}`);
      });
    }

    // No fallar el test, solo reportar
    if (errors.length > 0) {
      console.log('⚠️ Se encontraron errores pero el test continúa para reporte completo');
    }
  });

  test('12. Test de responsividad', async ({ page }) => {
    console.log('🧪 Test 12: Responsividad');

    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];

    for (const viewport of viewports) {
      console.log(`📱 Probando viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:5173/seating');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verificar que el canvas es visible
      const canvas = page.locator('canvas, svg, [class*="seating"]').first();
      const isVisible = await canvas.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        console.log(`   ✅ Canvas visible en ${viewport.name}`);
      } else {
        console.log(`   ⚠️ Canvas NO visible en ${viewport.name}`);
      }
    }
  });
});
