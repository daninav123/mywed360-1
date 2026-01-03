import { test, expect } from '@playwright/test';

test.describe('Seating Plan - Quick Diagnostic', () => {
  test('Diagnóstico rápido del seating plan', async ({ page }) => {
    console.log('='.repeat(80));
    console.log('🔍 DIAGNÓSTICO RÁPIDO DEL SEATING PLAN');
    console.log('='.repeat(80));

    // Capturar todos los errores
    const errors = [];
    const warnings = [];
    const consoleLogs = [];

    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text });

      if (msg.type() === 'error') {
        errors.push(text);
        console.log('❌ ERROR:', text.substring(0, 200));
      } else if (msg.type() === 'warning') {
        warnings.push(text);
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log('❌ PAGE ERROR:', error.message);
    });

    // 1. Intentar login (si es necesario)
    console.log('\n📍 Paso 1: Verificando autenticación...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Verificar si estamos en la página de login
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('⚠️ Requiere login. Intentando autenticar...');

      // Intentar login con credenciales de test (ajusta según tu configuración)
      try {
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passwordInput = page
          .locator('input[type="password"], input[name="password"]')
          .first();
        const submitButton = page
          .locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")')
          .first();

        if (await emailInput.isVisible({ timeout: 2000 })) {
          await emailInput.fill('test@test.com');
          await passwordInput.fill('password');
          await submitButton.click();

          await page.waitForTimeout(3000);
          console.log('✅ Login intentado');
        } else {
          console.log('⚠️ No se encontró formulario de login, usando storage directo...');

          // Intentar setear storage directamente
          await page.evaluate(() => {
            localStorage.setItem('token', 'test-token');
            localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@test.com' }));
          });
        }
      } catch (e) {
        console.log('⚠️ Error en login:', e.message);
      }
    } else {
      console.log('✅ Ya autenticado o no requiere login');
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/home.png', fullPage: true });
    console.log('📸 Screenshot guardado');

    // 2. Navegar directamente al seating plan
    console.log('\n📍 Paso 2: Navegando a /invitados/seating...');
    await page.goto('http://localhost:5173/invitados/seating', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    await page.waitForTimeout(3000);

    // 3. Verificar URL
    console.log('\n📍 Paso 3: Verificando URL...');
    const seatingUrl = page.url();
    console.log('URL actual:', seatingUrl);

    if (!seatingUrl.includes('seating')) {
      console.log('❌ No estamos en la página de seating');
      await page.screenshot({ path: 'tests/e2e/screenshots/wrong-page.png', fullPage: true });
      return;
    }

    // 4. Tomar screenshot del seating plan
    console.log('\n📍 Paso 4: Capturando screenshot del seating plan...');
    await page.screenshot({ path: 'tests/e2e/screenshots/seating-plan.png', fullPage: true });
    console.log('📸 Screenshot guardado en tests/e2e/screenshots/seating-plan.png');

    // 5. Buscar elementos del canvas
    console.log('\n📍 Paso 5: Buscando elementos del canvas...');

    const canvasElements = await page.evaluate(() => {
      const results = {
        canvasElements: document.querySelectorAll('canvas').length,
        svgElements: document.querySelectorAll('svg').length,
        seatingContainers: document.querySelectorAll('[class*="seating"], [class*="Seating"]')
          .length,
        tableItems: document.querySelectorAll(
          '[data-testid^="table-item"], [class*="table-item"], [class*="TableItem"]'
        ).length,
        allDivs: document.querySelectorAll('div').length,
      };
      return results;
    });

    console.log('Canvas elements:', canvasElements.canvasElements);
    console.log('SVG elements:', canvasElements.svgElements);
    console.log('Seating containers:', canvasElements.seatingContainers);
    console.log('Table items:', canvasElements.tableItems);
    console.log('Total divs:', canvasElements.allDivs);

    // 6. Verificar si hay mesas
    console.log('\n📍 Paso 6: Buscando mesas...');

    const tables = page.locator('[data-testid^="table-item"]');
    const tableCount = await tables.count();
    console.log('Mesas encontradas:', tableCount);

    if (tableCount > 0) {
      console.log('✅ Hay mesas en el canvas');

      // Intentar obtener info de la primera mesa
      const firstTable = tables.first();
      const box = await firstTable.boundingBox().catch(() => null);
      if (box) {
        console.log('Primera mesa posición:', box);
      }
    } else {
      console.log('⚠️ No se encontraron mesas con data-testid');

      // Buscar de otras formas
      const alternativeSelectors = ['circle', 'rect', '[class*="table"]', '[class*="Table"]'];

      for (const sel of alternativeSelectors) {
        const count = await page.locator(sel).count();
        if (count > 0) {
          console.log(`✅ Encontrados ${count} elementos con selector: ${sel}`);
        }
      }
    }

    // 7. Verificar errores y warnings
    console.log('\n📍 Paso 7: Resumen de errores y warnings...');
    console.log('='.repeat(80));
    console.log(`❌ Total de errores: ${errors.length}`);
    if (errors.length > 0) {
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.substring(0, 150)}`);
      });
    }

    console.log(`\n⚠️  Total de warnings: ${warnings.length}`);
    if (warnings.length > 0 && warnings.length < 10) {
      warnings.forEach((warn, i) => {
        console.log(`   ${i + 1}. ${warn.substring(0, 150)}`);
      });
    }

    // 8. Logs de iniciales y mesas
    console.log('\n📍 Paso 8: Buscando logs relacionados con mesas...');
    const relevantLogs = consoleLogs.filter(
      (log) =>
        log.text.includes('Mesa') ||
        log.text.includes('table') ||
        log.text.includes('arrastrable') ||
        log.text.includes('inicial')
    );

    if (relevantLogs.length > 0) {
      console.log(`Encontrados ${relevantLogs.length} logs relevantes (mostrando primeros 10):`);
      relevantLogs.slice(0, 10).forEach((log) => {
        console.log(`   [${log.type}] ${log.text.substring(0, 150)}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🏁 DIAGNÓSTICO COMPLETADO');
    console.log('='.repeat(80));

    // No fallar el test, solo reportar
    expect(true).toBe(true);
  });
});
