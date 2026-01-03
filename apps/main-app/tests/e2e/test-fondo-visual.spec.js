import { test } from '@playwright/test';

const TEST_USER = {
  email: 'danielnavarrocampos@icloud.com',
  password: 'admin123',
};

test('Test Visual - Verificar que el gradiente se ve en TODO el canvas', async ({ page }) => {
  // Capturar todos los logs del browser
  page.on('console', (msg) => {
    if (msg.text().includes('ESTILOS DEL CONTENEDOR')) {
      console.log('🌐 BROWSER:', msg.text());
    }
  });

  console.log('\n🎨 TEST VISUAL DE FONDOS');

  // Login
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.locator('button:has-text("Iniciar")').click();
  await page.waitForTimeout(3000);

  // Ir al builder
  await page.goto('http://localhost:5173/web-builder-craft');
  await page.waitForTimeout(3000);

  // Screenshot 1: Estado inicial
  await page.screenshot({ path: 'test-results/visual-1-inicial.png', fullPage: true });
  console.log('📸 Screenshot 1: Estado inicial');

  // Abrir panel
  await page.locator('button:has-text("✨ Personalizar")').click();
  await page.waitForTimeout(1000);

  // Scroll al panel de fondos
  await page.evaluate(() => {
    const panels = document.querySelectorAll('.overflow-y-auto');
    for (const panel of panels) {
      if (panel.textContent.includes('Fondo de Página')) {
        panel.scrollTop = 1000;
      }
    }
  });
  await page.waitForTimeout(500);

  // Aplicar GRADIENTE
  console.log('\n🌈 Aplicando gradiente...');
  await page.locator('button:has-text("🌈 Gradiente")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Atardecer")').first().click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test-results/visual-2-gradiente.png', fullPage: true });
  console.log('📸 Screenshot 2: Con gradiente');

  // Verificar que el canvas es transparente Y que el contenedor tiene el gradiente
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('[data-cy="canvas-root"]');

    // El contenedor es el parentElement del Frame, que es el parentElement del canvas
    // Estructura: div[styles] > Frame > Element (canvas)
    let container = canvas;
    for (let i = 0; i < 3; i++) {
      container = container.parentElement;
      const styles = window.getComputedStyle(container);
      if (styles.backgroundImage && styles.backgroundImage !== 'none') {
        break;
      }
    }

    const canvasStyles = window.getComputedStyle(canvas);
    const containerStyles = window.getComputedStyle(container);

    return {
      canvas: {
        backgroundColor: canvasStyles.backgroundColor,
        isTransparent:
          canvasStyles.backgroundColor === 'rgba(0, 0, 0, 0)' ||
          canvasStyles.backgroundColor === 'transparent',
      },
      container: {
        tag: container.tagName,
        backgroundImage: containerStyles.backgroundImage,
        hasGradient: containerStyles.backgroundImage.includes('gradient'),
      },
    };
  });

  console.log('\n📊 VERIFICACIÓN:');
  console.log('Canvas transparente:', canvasInfo.canvas.isTransparent ? '✅ SÍ' : '❌ NO');
  console.log('Canvas backgroundColor:', canvasInfo.canvas.backgroundColor);
  console.log('Contenedor tiene gradiente:', canvasInfo.container.hasGradient ? '✅ SÍ' : '❌ NO');

  // Aplicar PATRÓN
  console.log('\n📐 Aplicando patrón...');
  await page.locator('button:has-text("📐 Patrón")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Puntos")').first().click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test-results/visual-3-patron.png', fullPage: true });
  console.log('📸 Screenshot 3: Con patrón');

  // Volver a COLOR
  console.log('\n🎨 Volviendo a color sólido...');
  await page.locator('button:has-text("🎨 Color")').click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'test-results/visual-4-color.png', fullPage: true });
  console.log('📸 Screenshot 4: Con color sólido');

  console.log('\n✅ Test completado. Revisa los screenshots en test-results/');
  console.log('   - visual-1-inicial.png');
  console.log('   - visual-2-gradiente.png (DEBE verse el gradiente en TODO el canvas)');
  console.log('   - visual-3-patron.png');
  console.log('   - visual-4-color.png');

  await page.waitForTimeout(5000);
});
