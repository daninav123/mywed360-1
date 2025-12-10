import { test } from '@playwright/test';

const TEST_USER = {
  email: 'danielnavarrocampos@icloud.com',
  password: 'admin123',
};

test('Verificación Manual - Sistema de Fondos con Screenshots', async ({ page }) => {
  // Configurar para ver todo
  page.on('console', (msg) => console.log('🌐 BROWSER:', msg.text()));

  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFICACIÓN MANUAL DEL SISTEMA DE FONDOS');
  console.log('='.repeat(80));

  // PASO 1: Login
  console.log('\n📍 PASO 1: Login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(2000);

  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.locator('button:has-text("Iniciar")').click();
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/manual-1-login.png', fullPage: true });
  console.log('✅ Login completado - Screenshot guardado');

  // PASO 2: Ir al builder
  console.log('\n📍 PASO 2: Navegando al Web Builder...');
  await page.goto('http://localhost:5173/web-builder-craft');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'test-results/manual-2-builder.png', fullPage: true });
  console.log('✅ Builder cargado - Screenshot guardado');
  console.log('   URL:', page.url());

  // PASO 3: Verificar estado inicial
  console.log('\n📍 PASO 3: Verificando estado inicial...');
  const initialState = await page.evaluate(() => {
    const canvas = document.querySelector('[data-cy="canvas-root"]');
    const container = canvas?.parentElement?.parentElement;

    if (!container) return { error: 'No se encontró el contenedor' };

    const styles = window.getComputedStyle(container);
    return {
      backgroundColor: styles.backgroundColor,
      backgroundImage: styles.backgroundImage,
      containerHTML: container.outerHTML.substring(0, 500),
    };
  });

  console.log('📊 Estado inicial:');
  console.log(JSON.stringify(initialState, null, 2));

  // PASO 4: Abrir panel
  console.log('\n📍 PASO 4: Abriendo panel de personalización...');
  const personalizarBtn = page.locator('button:has-text("✨ Personalizar")');
  await personalizarBtn.waitFor({ timeout: 5000 });
  await personalizarBtn.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-results/manual-3-panel-abierto.png', fullPage: true });
  console.log('✅ Panel abierto - Screenshot guardado');

  // PASO 5: Scroll al panel de fondos
  console.log('\n📍 PASO 5: Scroll al panel de fondos...');
  await page.evaluate(() => {
    const panels = document.querySelectorAll('.overflow-y-auto');
    for (const panel of panels) {
      if (panel.textContent.includes('Fondo de Página')) {
        panel.scrollTop = 1000;
        console.log('✅ Scroll realizado en panel de fondos');
        break;
      }
    }
  });
  await page.waitForTimeout(500);

  // PASO 6: Click en Gradiente
  console.log('\n📍 PASO 6: Seleccionando tipo Gradiente...');
  const gradienteBtn = page.locator('button:has-text("🌈 Gradiente")');
  await gradienteBtn.waitFor({ timeout: 5000 });
  await gradienteBtn.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'test-results/manual-4-gradiente-tipo.png', fullPage: true });
  console.log('✅ Tipo Gradiente seleccionado - Screenshot guardado');

  // PASO 7: Seleccionar gradiente Atardecer
  console.log('\n📍 PASO 7: Seleccionando gradiente Atardecer...');
  const atardecerBtn = page.locator('button:has-text("Atardecer")').first();
  await atardecerBtn.waitFor({ timeout: 5000 });
  await atardecerBtn.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test-results/manual-5-atardecer.png', fullPage: true });
  console.log('✅ Gradiente Atardecer seleccionado - Screenshot guardado');

  // PASO 8: Verificar resultado DETALLADO
  console.log('\n📍 PASO 8: Verificando resultado detallado...');
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('[data-cy="canvas-root"]');

    // Navegar hacia arriba para encontrar el contenedor con el fondo
    let current = canvas;
    const hierarchy = [];

    while (current && hierarchy.length < 10) {
      const styles = window.getComputedStyle(current);
      hierarchy.push({
        tag: current.tagName,
        classes: current.className,
        bgImage: styles.backgroundImage,
        bgColor: styles.backgroundColor,
        hasStyle: !!current.getAttribute('style'),
      });
      current = current.parentElement;
    }

    // Buscar el contenedor con background en el style
    const containerWithBg = canvas.closest('div[style*="background"]');

    let containerInfo = null;
    if (containerWithBg) {
      const styles = window.getComputedStyle(containerWithBg);
      containerInfo = {
        found: true,
        backgroundImage: styles.backgroundImage,
        backgroundColor: styles.backgroundColor,
        backgroundSize: styles.backgroundSize,
        backgroundRepeat: styles.backgroundRepeat,
        styleAttr: containerWithBg.getAttribute('style'),
      };
    }

    return {
      hierarchy,
      containerInfo,
      hasGradient: containerInfo?.backgroundImage?.includes('gradient'),
    };
  });

  console.log('\n📊 RESULTADO FINAL DETALLADO:');
  console.log('='.repeat(80));
  console.log('\n🏗️ JERARQUÍA DE ELEMENTOS:');
  result.hierarchy.forEach((el, i) => {
    console.log(`  ${i}. ${el.tag} - bgImage: ${el.bgImage !== 'none' ? '✅ SÍ' : '❌ NO'}`);
  });

  console.log('\n📦 CONTENEDOR CON FONDO:');
  if (result.containerInfo?.found) {
    console.log('  ✅ Encontrado');
    console.log('  backgroundImage:', result.containerInfo.backgroundImage.substring(0, 100));
    console.log('  backgroundColor:', result.containerInfo.backgroundColor);
    console.log('  backgroundSize:', result.containerInfo.backgroundSize);
  } else {
    console.log('  ❌ NO ENCONTRADO');
  }

  console.log('\n🎨 ¿TIENE GRADIENTE?:', result.hasGradient ? '✅ SÍ' : '❌ NO');
  console.log('='.repeat(80));

  // Screenshot final
  await page.screenshot({ path: 'test-results/manual-FINAL.png', fullPage: true });
  console.log('\n📸 Screenshot final guardado en: test-results/manual-FINAL.png');

  // RESULTADO
  if (result.hasGradient) {
    console.log('\n🎉🎉🎉 ¡ÉXITO! El sistema de fondos FUNCIONA correctamente 🎉🎉🎉\n');
  } else {
    console.log('\n❌❌❌ FALLO: El sistema de fondos NO está funcionando ❌❌❌\n');
    console.log('Detalles del contenedor:', JSON.stringify(result.containerInfo, null, 2));
  }

  // Mantener abierto para inspección visual
  console.log('\n⏸️  Manteniendo browser abierto 10 segundos para inspección visual...\n');
  await page.waitForTimeout(10000);
});
