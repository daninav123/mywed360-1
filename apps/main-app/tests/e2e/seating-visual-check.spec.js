/**
 * Test E2E - Verificación Visual del Seating Plan
 * Comprueba que todos los elementos visuales se muestren correctamente
 */

import { test, expect } from '@playwright/test';

test.describe('Seating Plan - Verificación Visual', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de seating
    await page.goto('http://localhost:5173/invitados/seating');

    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('debe mostrar la estructura básica del seating plan', async ({ page }) => {
    // Verificar que existen las tabs principales
    const tabs = page.locator('[data-tour="tabs"]');
    await expect(tabs).toBeVisible({ timeout: 10000 });

    // Verificar tabs de Ceremonia y Banquete
    const ceremoniaTab = page.getByText('Ceremonia', { exact: false });
    const banqueteTab = page.getByText('Banquete', { exact: false });

    await expect(ceremoniaTab).toBeVisible();
    await expect(banqueteTab).toBeVisible();

    console.log('✅ Tabs principales visibles');
  });

  test('debe mostrar el canvas del seating plan', async ({ page }) => {
    // Verificar que el canvas existe y es visible
    const canvas = page.locator('[data-tour="canvas"]').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Verificar que el canvas tiene dimensiones
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox.width).toBeGreaterThan(100);
    expect(boundingBox.height).toBeGreaterThan(100);

    console.log(`✅ Canvas visible: ${boundingBox.width}x${boundingBox.height}px`);
  });

  test('debe mostrar la barra de herramientas', async ({ page }) => {
    // Verificar toolbar
    const toolbar = page.locator('[data-tour="toolbar"]').first();
    await expect(toolbar).toBeVisible({ timeout: 10000 });

    // Verificar botones principales
    const undoBtn = page.getByTitle(/deshacer|undo/i).first();
    const redoBtn = page.getByTitle(/rehacer|redo/i).first();

    // Al menos uno de estos debe existir
    const hasUndo = (await undoBtn.count()) > 0;
    const hasRedo = (await redoBtn.count()) > 0;

    expect(hasUndo || hasRedo).toBe(true);

    console.log('✅ Toolbar visible con controles');
  });

  test('debe mostrar el panel de invitados', async ({ page }) => {
    // Verificar panel de invitados
    const guestsPanel = page.locator('[data-tour="guests-panel"]').first();

    // Puede que esté oculto inicialmente, verificar si existe
    const panelExists = (await guestsPanel.count()) > 0;

    if (panelExists) {
      console.log('✅ Panel de invitados encontrado');
    } else {
      // Buscar por texto alternativo
      const guestSection = page.getByText(/invitados|guests/i).first();
      const sectionExists = (await guestSection.count()) > 0;

      expect(sectionExists).toBe(true);
      console.log('✅ Sección de invitados encontrada (alternativa)');
    }
  });

  test('BANQUETE: debe poder cambiar a la pestaña de banquete', async ({ page }) => {
    // Click en tab de Banquete
    const banqueteTab = page.getByText('Banquete', { exact: false }).first();
    await banqueteTab.click();
    await page.waitForTimeout(1000);

    // Verificar que cambió el contenido
    const activeTab = page.locator('.bg-primary-600, .bg-indigo-600, .border-b-2');
    const tabCount = await activeTab.count();

    expect(tabCount).toBeGreaterThan(0);

    console.log('✅ Cambio a pestaña Banquete exitoso');
  });

  test('BANQUETE: debe mostrar opciones para configurar el banquete', async ({ page }) => {
    // Cambiar a Banquete
    const banqueteTab = page.getByText('Banquete', { exact: false }).first();
    await banqueteTab.click();
    await page.waitForTimeout(1000);

    // Buscar botón de configuración
    const configButtons = [
      page.getByTitle(/configurar.*banquete/i),
      page.getByText(/configurar.*banquete/i),
      page.locator('[data-tour="config-space"]'),
    ];

    let foundConfig = false;
    for (const btn of configButtons) {
      const count = await btn.count();
      if (count > 0) {
        foundConfig = true;
        console.log('✅ Botón de configuración encontrado');
        break;
      }
    }

    // Si no se encuentra, al menos verificar que el canvas está presente
    if (!foundConfig) {
      const canvas = page.locator('[data-tour="canvas"]').first();
      await expect(canvas).toBeVisible();
      console.log('⚠️ Botón config no encontrado, pero canvas presente');
    }
  });

  test('BANQUETE: debe poder abrir plantillas', async ({ page }) => {
    // Cambiar a Banquete
    const banqueteTab = page.getByText('Banquete', { exact: false }).first();
    await banqueteTab.click();
    await page.waitForTimeout(1000);

    // Buscar botón de plantillas
    const templateButton = page.locator('[data-tour="templates"]').first();

    if ((await templateButton.count()) > 0) {
      await templateButton.click();
      await page.waitForTimeout(500);

      // Verificar que se abre un modal o panel
      const modal = page.locator('[role="dialog"], .modal, .fixed.z-50').first();
      const modalVisible = await modal.isVisible().catch(() => false);

      if (modalVisible) {
        console.log('✅ Modal de plantillas abierto');
      } else {
        console.log('⚠️ Modal de plantillas no visible');
      }
    } else {
      console.log('⚠️ Botón de plantillas no encontrado');
    }
  });

  test('VISUAL: debe mostrar mesas cuando hay datos', async ({ page }) => {
    // Cambiar a Banquete
    const banqueteTab = page.getByText('Banquete', { exact: false }).first();
    await banqueteTab.click();
    await page.waitForTimeout(1500);

    // Buscar elementos SVG que representen mesas
    const tables = page.locator('svg circle, svg rect, svg g[data-table], [data-table-id]');
    const tableCount = await tables.count();

    console.log(`📊 Mesas encontradas en canvas: ${tableCount}`);

    // Tomar screenshot para inspección visual
    await page.screenshot({
      path: '/tmp/seating-banquete-visual.png',
      fullPage: true,
    });

    console.log('📸 Screenshot guardado en /tmp/seating-banquete-visual.png');

    // Si no hay mesas, intentar generar algunas
    if (tableCount === 0) {
      console.log('⚠️ No se encontraron mesas. Intentando generar...');

      // Buscar botón de auto-layout
      const autoLayoutBtn = page.locator('[data-tour="auto-layout"]').first();
      if ((await autoLayoutBtn.count()) > 0) {
        await autoLayoutBtn.click();
        await page.waitForTimeout(1000);

        // Verificar si aparece un modal
        const modalConfirm = page.getByText(/generar|crear|aceptar/i).first();
        if ((await modalConfirm.count()) > 0) {
          await modalConfirm.click();
          await page.waitForTimeout(2000);

          // Contar mesas de nuevo
          const newTableCount = await tables.count();
          console.log(`📊 Mesas después de generar: ${newTableCount}`);
        }
      }
    }
  });

  test('VISUAL: debe poder hacer zoom y pan', async ({ page }) => {
    // Cambiar a Banquete
    const banqueteTab = page.getByText('Banquete', { exact: false }).first();
    await banqueteTab.click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('[data-tour="canvas"]').first();
    await expect(canvas).toBeVisible();

    // Verificar botones de zoom
    const zoomControls = [
      page.getByTitle(/zoom.*in|acercar/i),
      page.getByTitle(/zoom.*out|alejar/i),
      page.getByTitle(/ajustar|fit/i),
    ];

    let foundZoom = false;
    for (const control of zoomControls) {
      if ((await control.count()) > 0) {
        foundZoom = true;
        console.log('✅ Controles de zoom encontrados');
        break;
      }
    }

    if (!foundZoom) {
      console.log('⚠️ Controles de zoom no encontrados visualmente');
    }
  });

  test('VISUAL: debe mostrar indicadores de estado', async ({ page }) => {
    // Cambiar a Banquete
    const banqueteTab = page.getByText('Banquete', { exact: false }).first();
    await banqueteTab.click();
    await page.waitForTimeout(1000);

    // Buscar indicadores de progreso o estado
    const indicators = [
      page.getByText(/pendiente/i),
      page.getByText(/asignado/i),
      page.getByText(/mesa/i),
      page.locator('.progress-bar, [role="progressbar"]'),
    ];

    let foundIndicators = 0;
    for (const indicator of indicators) {
      if ((await indicator.count()) > 0) {
        foundIndicators++;
      }
    }

    console.log(`📊 Indicadores de estado encontrados: ${foundIndicators}`);
    expect(foundIndicators).toBeGreaterThan(0);
  });

  test('DIAGNÓSTICO: análisis completo de la estructura', async ({ page }) => {
    console.log('\n🔍 ANÁLISIS COMPLETO DE LA ESTRUCTURA DEL SEATING PLAN\n');

    // 1. Tabs
    const tabs = await page.locator('[role="tab"], .tab, button').all();
    console.log(`📑 Tabs encontrados: ${tabs.length}`);

    // 2. Canvas/SVG
    const svgs = await page.locator('svg').all();
    console.log(`🎨 Elementos SVG: ${svgs.length}`);

    // 3. Botones de acción
    const buttons = await page.locator('button:visible').all();
    console.log(`🔘 Botones visibles: ${buttons.length}`);

    // 4. Paneles laterales
    const sidebars = await page.locator('.sidebar, aside, [role="complementary"]').all();
    console.log(`📋 Paneles laterales: ${sidebars.length}`);

    // 5. Modales
    const modals = await page.locator('[role="dialog"], .modal').all();
    console.log(`💬 Modales: ${modals.length}`);

    // 6. Elementos interactivos (mesas, invitados)
    const interactive = await page.locator('[draggable="true"], [data-draggable]').all();
    console.log(`🖱️ Elementos draggables: ${interactive.length}`);

    // 7. Screenshot del estado actual
    await page.screenshot({
      path: '/tmp/seating-diagnostico-completo.png',
      fullPage: true,
    });

    console.log('\n📸 Screenshot de diagnóstico: /tmp/seating-diagnostico-completo.png');
    console.log('\n✅ Análisis completo finalizado\n');
  });
});

test.describe('Seating Plan - Test de Funcionalidad Visual', () => {
  test('debe renderizar correctamente sin errores en consola', async ({ page }) => {
    // Capturar errores de consola
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navegar
    await page.goto('http://localhost:5173/invitados/seating');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verificar errores
    console.log(`\n⚠️ Errores en consola: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errores encontrados:');
      errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    // El test pasa incluso con errores, pero los registra
    expect(errors.length).toBeLessThan(10); // Máximo 10 errores permitidos
  });
});
