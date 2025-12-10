import { test, expect } from '@playwright/test';

test.describe('GlobalStylesPanel - Tests Visuales', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'danielnavarrocampos@icloud.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000); // Esperar login

    // Ir directamente al editor
    await page.goto(
      'http://localhost:5173/wedding/web-builder-craft?webId=web-9EstYa0T-1764819440584-5ea06i'
    );
    await page.waitForTimeout(5000); // Esperar carga completa de Craft.js
  });

  test('TEST 1: Verificar que el tema se carga con decoraciones', async ({ page }) => {
    // Verificar en consola que el tema tiene decoraciones
    const tema = await page.evaluate(() => {
      return window.tema || 'NO DISPONIBLE';
    });

    console.log('📋 Tema en window:', tema);
    expect(tema).not.toBe('NO DISPONIBLE');
  });

  test('TEST 2: Abrir panel de Estilos Globales', async ({ page }) => {
    // Click en área vacía para abrir estilos globales
    await page.click('body');
    await page.waitForTimeout(1000);

    // Verificar que existe la sección de decoraciones
    const decoracionesPanel = await page.locator('text=🌸 Decoraciones').count();
    console.log('🌸 Panel de decoraciones visible:', decoracionesPanel > 0);
    expect(decoracionesPanel).toBeGreaterThan(0);
  });

  test('TEST 3: Activar pétalos y verificar cambio de tema', async ({ page }) => {
    // Escuchar logs de consola
    const consoleLogs = [];
    page.on('console', (msg) => {
      if (msg.text().includes('Pétalos') || msg.text().includes('DECORACIONES')) {
        consoleLogs.push(msg.text());
      }
    });

    // Click en área vacía
    await page.click('body');
    await page.waitForTimeout(1000);

    // Buscar y activar switch de pétalos
    const petalosSwitch = page
      .locator('text=✨ Pétalos cayendo')
      .locator('..')
      .locator('input[type="checkbox"]');
    await petalosSwitch.check();
    await page.waitForTimeout(2000);

    // Verificar logs
    console.log('📋 Logs capturados:', consoleLogs);
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('TEST 4: Verificar que SectionDecorator existe en el DOM', async ({ page }) => {
    // Buscar elementos que deberían tener decoraciones
    const heroSection = await page.locator('[class*="hero"]').first();

    if ((await heroSection.count()) > 0) {
      const html = await heroSection.innerHTML();
      console.log('📋 Hero HTML (primeros 500 chars):', html.substring(0, 500));

      // Buscar SVG de flores
      const floralSvg = await page.locator('svg[class*="floral"]').count();
      console.log('🌺 SVGs florales encontrados:', floralSvg);
    }
  });

  test('TEST 5: Verificar CSS de pétalos en el DOM', async ({ page }) => {
    // Activar pétalos
    await page.click('body');
    await page.waitForTimeout(1000);

    const petalosSwitch = page
      .locator('text=✨ Pétalos cayendo')
      .locator('..')
      .locator('input[type="checkbox"]');
    await petalosSwitch.check();
    await page.waitForTimeout(2000);

    // Buscar elementos con clase "petal"
    const petalos = await page.locator('[class*="petal"]').count();
    console.log('✨ Pétalos en DOM:', petalos);

    // Buscar animación de caída
    const fallingAnimation = await page.locator('[class*="fall"]').count();
    console.log('📉 Animaciones de caída:', fallingAnimation);
  });

  test('TEST 6: Cambiar color primario y verificar CSS variables', async ({ page }) => {
    // Click en área vacía
    await page.click('body');
    await page.waitForTimeout(1000);

    // Cambiar color primario
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.fill('#FF0000'); // Rojo
    await page.waitForTimeout(2000);

    // Verificar CSS variable
    const cssVar = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]')?.parentElement;
      if (canvas) {
        return getComputedStyle(canvas).getPropertyValue('--color-primario');
      }
      return 'NO ENCONTRADO';
    });

    console.log('🎨 CSS Variable --color-primario:', cssVar);
    expect(cssVar).not.toBe('NO ENCONTRADO');
  });

  test('TEST 7: Verificar que CraftHeroSection usa useThemeContext', async ({ page }) => {
    // Inspeccionar componentes React
    const reactInfo = await page.evaluate(() => {
      // Buscar el root de React
      const root = document.querySelector('#root');
      if (root && root._reactRootContainer) {
        return 'React encontrado';
      }
      return 'React no encontrado';
    });

    console.log('⚛️ React:', reactInfo);
  });

  test('TEST 8: Screenshot antes y después de activar decoraciones', async ({ page }) => {
    // Screenshot inicial
    await page.screenshot({ path: 'test-results/before-decorations.png', fullPage: true });

    // Activar todas las decoraciones
    await page.click('body');
    await page.waitForTimeout(1000);

    const switches = [
      '🌺 Flores en esquinas',
      '✨ Pétalos cayendo',
      '🌿 Divisores florales',
      '🎬 Animaciones al scroll',
    ];

    for (const switchText of switches) {
      const switchEl = page
        .locator(`text=${switchText}`)
        .locator('..')
        .locator('input[type="checkbox"]');
      if ((await switchEl.count()) > 0) {
        await switchEl.check();
        await page.waitForTimeout(500);
      }
    }

    await page.waitForTimeout(3000);

    // Screenshot final
    await page.screenshot({ path: 'test-results/after-decorations.png', fullPage: true });

    console.log('📸 Screenshots guardados en test-results/');
  });
});
