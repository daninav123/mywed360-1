import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'danielnavarrocampos@icloud.com',
  password: 'admin123',
};

test('Test manual de fondos - Siguiendo la navegación natural', async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.text().includes('RENDER FONDO')) {
      console.log('🎨', msg.text());
    }
  });

  console.log('\n📍 PASO 1: Login');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.locator('button:has-text("Iniciar")').click();
  await page.waitForTimeout(3000);

  console.log('✅ Login completado');

  console.log('\n📍 PASO 2: Probar rutas directas al Web Builder...');

  // Intentar diferentes rutas manualmente
  const routes = [
    '/wedding/web-builder-craft',
    '/wedding/web-builder-dashboard',
    '/wedding/web',
    '/web-builder-craft',
    '/web-builder-dashboard',
  ];

  for (const route of routes) {
    console.log(`\n🔗 Probando: ${route}`);
    await page.goto(`http://localhost:5173${route}`);
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasPersonalizar = await page
      .locator('text=✨ Personalizar')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    console.log(`   URL resultante: ${url}`);
    console.log(`   Tiene botón Personalizar: ${hasPersonalizar}`);

    if (hasPersonalizar) {
      console.log('\n✅✅✅ ¡RUTA ENCONTRADA!', route);

      // Hacer el test completo de fondos
      console.log('\n📍 PASO 4: Abrir panel de personalización');
      await page.locator('text=✨ Personalizar').click();
      await page.waitForTimeout(1000);

      console.log('\n📍 PASO 5: Scroll al panel de fondos');
      await page.evaluate(() => {
        const panels = document.querySelectorAll('.overflow-y-auto');
        for (const panel of panels) {
          if (panel.textContent.includes('Fondo de Página')) {
            panel.scrollTop = 1000;
            break;
          }
        }
      });
      await page.waitForTimeout(500);

      console.log('\n📍 PASO 6: Click en Gradiente');
      await page.locator('button:has-text("🌈 Gradiente")').click();
      await page.waitForTimeout(1000);

      console.log('\n📍 PASO 7: Seleccionar gradiente Atardecer');
      await page.locator('button:has-text("Atardecer")').first().click();
      await page.waitForTimeout(2000);

      console.log('\n📍 PASO 8: Verificar resultado');
      const resultado = await page.evaluate(() => {
        const canvas = document.querySelector('[data-cy="canvas-root"]');
        if (!canvas) return { error: 'Canvas no encontrado' };

        // El fondo está en el DIV PADRE del canvas
        const container = canvas.closest('div[style*="background"]');
        if (!container) return { error: 'Contenedor con fondo no encontrado' };

        // Verificar el backgroundImage del contenedor
        const containerStyles = window.getComputedStyle(container);
        const bgImage = containerStyles.backgroundImage;
        const bgColor = containerStyles.backgroundColor;
        const bgSize = containerStyles.backgroundSize;

        return {
          found: true,
          backgroundImage: bgImage,
          backgroundColor: bgColor,
          backgroundSize: bgSize,
          hasGradient:
            bgImage !== 'none' && (bgImage.includes('gradient') || bgImage.includes('linear')),
        };
      });

      console.log('\n📊 RESULTADO FINAL:');
      console.log(JSON.stringify(resultado, null, 2));

      if (resultado.found && resultado.hasGradient) {
        console.log('\n✅✅✅ ¡ÉXITO! El sistema de fondos funciona correctamente ✅✅✅');
      } else {
        console.log('\n❌ El gradiente no se aplicó:', resultado);
      }

      await page.screenshot({ path: 'test-results/fondos-test-final.png', fullPage: true });
      console.log('\n📸 Screenshot guardado');

      await page.waitForTimeout(5000);
      return; // Salir del loop
    }
  }

  console.log('\n❌ No se encontró ninguna ruta funcional al Web Builder');
  await page.screenshot({ path: 'test-results/no-builder-found.png', fullPage: true });
});
