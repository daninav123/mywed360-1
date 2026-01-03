import { test, expect } from '@playwright/test';

test.describe('DEBUG SIMPLE - GlobalStylesPanel', () => {
  test('Verificar qué pasa al cambiar una decoración', async ({ page }) => {
    // Capturar logs de consola
    const logs = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      console.log('📋 CONSOLE:', text);
    });

    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'danielnavarrocampos@icloud.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Ir al editor
    await page.goto(
      'http://localhost:5173/wedding/web-builder-craft?webId=web-9EstYa0T-1764819440584-5ea06i'
    );
    await page.waitForTimeout(8000); // Esperar carga completa

    console.log('✅ Página cargada');

    // Screenshot inicial
    await page.screenshot({ path: 'test-results/debug-01-inicial.png', fullPage: true });

    // Buscar el texto "Estilos Globales" en la página
    const estilosGlobales = await page.locator('text=Estilos Globales').count();
    console.log('🔍 "Estilos Globales" encontrado:', estilosGlobales);

    if (estilosGlobales > 0) {
      // Click en Estilos Globales
      await page.locator('text=Estilos Globales').first().click();
      await page.waitForTimeout(2000);
      console.log('✅ Click en Estilos Globales');
      await page.screenshot({ path: 'test-results/debug-02-panel-abierto.png', fullPage: true });
    } else {
      // Click en área vacía del canvas
      const canvas = await page.locator('[data-cy="canvas-root"]');
      if ((await canvas.count()) > 0) {
        await canvas.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(2000);
        console.log('✅ Click en canvas');
        await page.screenshot({ path: 'test-results/debug-02-click-canvas.png', fullPage: true });
      }
    }

    // Buscar panel de decoraciones
    const decoraciones = await page.locator('text=🌸 Decoraciones').count();
    console.log('🌸 Panel "Decoraciones" visible:', decoraciones);

    if (decoraciones > 0) {
      await page.screenshot({
        path: 'test-results/debug-03-decoraciones-visible.png',
        fullPage: true,
      });

      // Buscar todos los switches
      const switches = await page.locator('input[type="checkbox"]').count();
      console.log('🔘 Switches encontrados:', switches);

      // Buscar específicamente el switch de pétalos
      const petalosText = await page.locator('text=✨ Pétalos').count();
      console.log('✨ Texto "Pétalos" encontrado:', petalosText);

      if (petalosText > 0) {
        // Intentar hacer click en el switch de pétalos
        const petalosSwitch = page
          .locator('text=✨ Pétalos')
          .locator('..')
          .locator('input[type="checkbox"]')
          .first();

        // Ver si el switch está visible
        const isVisible = await petalosSwitch.isVisible({ timeout: 5000 }).catch(() => false);
        console.log('👁️ Switch pétalos visible:', isVisible);

        if (isVisible) {
          // Capturar estado ANTES
          const checkedBefore = await petalosSwitch.isChecked();
          console.log('⬜ Estado ANTES:', checkedBefore);

          // Hacer click
          await petalosSwitch.click();
          await page.waitForTimeout(1000);

          // Capturar estado DESPUÉS
          const checkedAfter = await petalosSwitch.isChecked();
          console.log('✅ Estado DESPUÉS:', checkedAfter);

          await page.screenshot({
            path: 'test-results/debug-04-switch-clickeado.png',
            fullPage: true,
          });

          // Esperar más tiempo para ver logs
          await page.waitForTimeout(3000);
        }
      }
    } else {
      console.log('❌ Panel de decoraciones NO encontrado');

      // Debug: mostrar todo el HTML del Settings Panel
      const settingsPanel = await page.locator('[class*="settings"]').first();
      if ((await settingsPanel.count()) > 0) {
        const html = await settingsPanel.innerHTML();
        console.log('📄 HTML del panel (primeros 1000 chars):', html.substring(0, 1000));
      }
    }

    // Filtrar logs relevantes
    const logsRelevantes = logs.filter(
      (log) =>
        log.includes('Pétalos') ||
        log.includes('HANDLE TEMA') ||
        log.includes('Decoraciones') ||
        log.includes('ThemeProvider')
    );

    console.log('\n📊 LOGS RELEVANTES CAPTURADOS:', logsRelevantes.length);
    logsRelevantes.forEach((log) => console.log('  -', log));

    // Verificar si hubo cambios de tema
    const temaChanges = logsRelevantes.filter((log) => log.includes('HANDLE TEMA CHANGE'));
    console.log('\n🔥 Cambios de tema detectados:', temaChanges.length);

    if (temaChanges.length === 0) {
      console.log('❌ PROBLEMA: No se detectó ningún cambio de tema');
      console.log('   Esto significa que el onChange del switch NO está funcionando');
    } else {
      console.log('✅ El switch SÍ dispara onChange');
    }
  });
});
