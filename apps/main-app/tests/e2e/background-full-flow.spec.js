import { test, expect } from '@playwright/test';

/**
 * Test E2E completo: Login + Web Builder + Sistema de Fondos
 */

const TEST_USER = {
  email: 'danielnavarrocampos@icloud.com',
  password: 'admin123',
};

test.describe('Sistema de Fondos - Flujo Completo con Login', () => {
  test('Flujo completo: Login → Builder → Cambiar Fondo a Gradiente', async ({ page }) => {
    // Escuchar logs del browser
    page.on('console', (msg) => {
      if (msg.text().includes('RENDER FONDO') || msg.text().includes('Tema actualizado')) {
        console.log('🎨 BROWSER:', msg.text());
      }
    });

    console.log('\n📍 PASO 1: Navegar a login');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);

    console.log('\n📍 PASO 2: Hacer login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    const loginBtn = page.locator('button:has-text("Iniciar")');
    await loginBtn.click();

    console.log('⏳ Esperando autenticación...');
    await page.waitForTimeout(3000);

    // Verificar que el login fue exitoso (deberíamos estar en dashboard o home)
    const currentUrl = page.url();
    console.log('✅ URL actual después de login:', currentUrl);

    console.log('\n📍 PASO 3: Navegar al Web Builder Dashboard');
    await page.goto('http://localhost:5173/wedding/web-builder-dashboard');
    await page.waitForTimeout(2000);

    console.log('\n📍 PASO 4: Crear nueva web');

    // Buscar botón de crear
    const crearBtn = page.locator('button:has-text("Crear Nueva Web")');

    await expect(crearBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Botón Crear Nueva Web encontrado');

    await crearBtn.click();
    await page.waitForTimeout(1500);

    // Si aparece modal de plantillas, elegir "Empezar en Blanco"
    const blancoBtn = page.locator('text=Empezar en Blanco');
    const hasBlanco = await blancoBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasBlanco) {
      console.log('📄 Seleccionando: Empezar en Blanco');
      await blancoBtn.click();
    } else {
      console.log('ℹ️  No hay modal de plantillas, continuando...');
    }

    console.log('⏳ Esperando que cargue el builder...');
    await page.waitForTimeout(3000);

    // Verificar que estamos en el builder
    const builderUrl = page.url();
    console.log('✅ URL del builder:', builderUrl);
    expect(builderUrl).toContain('web-builder-craft');

    console.log('\n📍 PASO 5: Abrir panel de Personalizar');
    const personalizarBtn = page.locator('button:has-text("✨ Personalizar")');

    await expect(personalizarBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Botón Personalizar encontrado');

    await personalizarBtn.click();
    await page.waitForTimeout(1000);

    console.log('\n📍 PASO 6: Scroll al panel de fondos');
    await page.evaluate(() => {
      const panels = document.querySelectorAll('.overflow-y-auto');
      for (const panel of panels) {
        if (panel.textContent.includes('Fondo de Página')) {
          panel.scrollTop = 800;
          break;
        }
      }
    });
    await page.waitForTimeout(500);

    console.log('\n📍 PASO 7: Click en botón Gradiente');
    const gradienteBtn = page.locator('button:has-text("🌈 Gradiente")');

    await expect(gradienteBtn).toBeVisible({ timeout: 5000 });
    console.log('✅ Botón Gradiente visible');

    await gradienteBtn.click();
    await page.waitForTimeout(1000);

    console.log('✅ Click en Gradiente realizado');

    console.log('\n📍 PASO 8: Verificar que aparece la sección de gradientes');
    const gradientesSection = page.locator('text=Gradientes Predefinidos');
    await expect(gradientesSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Sección de gradientes visible');

    console.log('\n📍 PASO 9: Seleccionar gradiente "Atardecer"');
    const atardecerBtn = page.locator('button:has-text("Atardecer")').first();
    await atardecerBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Gradiente Atardecer seleccionado');

    console.log('\n📍 PASO 10: Verificar que el gradiente se aplicó');

    // Buscar el canvas root
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      return !!canvas;
    });

    console.log('Canvas existe:', canvasExists);

    // Verificar el div de fondo
    const fondoInfo = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      if (!canvas) return { error: 'Canvas no encontrado' };

      const children = Array.from(canvas.children);
      console.log('Número de hijos del canvas:', children.length);

      // Buscar div con position absolute
      const bgDiv = children.find((child) => {
        const style = window.getComputedStyle(child);
        return style.position === 'absolute';
      });

      if (!bgDiv) {
        return {
          error: 'Div de fondo no encontrado',
          childrenCount: children.length,
          childrenInfo: children.map((c) => ({
            tag: c.tagName,
            position: window.getComputedStyle(c).position,
          })),
        };
      }

      const styles = window.getComputedStyle(bgDiv);
      return {
        found: true,
        backgroundImage: styles.backgroundImage,
        zIndex: styles.zIndex,
        position: styles.position,
        opacity: styles.opacity,
        hasGradient: styles.backgroundImage.includes('gradient'),
      };
    });

    console.log('\n📊 RESULTADO FINAL:');
    console.log(JSON.stringify(fondoInfo, null, 2));

    if (fondoInfo.found && fondoInfo.hasGradient) {
      console.log('\n✅✅✅ ¡ÉXITO! El gradiente se aplicó correctamente ✅✅✅');
    } else {
      console.log('\n❌❌❌ FALLO: El gradiente NO se aplicó ❌❌❌');
      console.log('Detalles:', fondoInfo);
    }

    // Screenshot final
    await page.screenshot({ path: 'test-results/background-final.png', fullPage: true });
    console.log('\n📸 Screenshot guardado en: test-results/background-final.png');

    // Mantener el browser abierto para inspección visual
    console.log('\n⏸️  Pausando para inspección manual...');
    await page.waitForTimeout(5000);
  });

  test('Flujo completo: Cambiar a Imagen de fondo', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.text().includes('RENDER FONDO')) {
        console.log('🎨 BROWSER:', msg.text());
      }
    });

    console.log('\n📍 Login y navegación...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.locator('button:has-text("Iniciar")').click();
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:5173/wedding/web-builder-dashboard');
    await page.waitForTimeout(2000);

    const crearBtn = page.locator('button:has-text("Crear Nueva Web")');
    await crearBtn.click();
    await page.waitForTimeout(1500);

    const blancoBtn = page.locator('text=Empezar en Blanco');
    const hasBlanco = await blancoBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBlanco) {
      await blancoBtn.click();
    }

    await page.waitForTimeout(3000);

    console.log('\n📍 Abriendo panel de personalización...');
    await page.locator('button:has-text("✨ Personalizar")').click();
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const panels = document.querySelectorAll('.overflow-y-auto');
      for (const panel of panels) {
        if (panel.textContent.includes('Fondo de Página')) {
          panel.scrollTop = 800;
        }
      }
    });
    await page.waitForTimeout(500);

    console.log('\n📍 Seleccionando tipo Imagen...');
    await page.locator('button:has-text("🖼️ Imagen")').click();
    await page.waitForTimeout(1000);

    console.log('\n📍 Ingresando URL de imagen...');
    const urlInput = page.locator('input[placeholder*="ejemplo.com/fondo"]');
    await urlInput.fill('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600');
    await page.waitForTimeout(2000);

    const fondoInfo = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      if (!canvas) return { error: 'Canvas no encontrado' };

      const bgDiv = Array.from(canvas.children).find((child) => {
        return window.getComputedStyle(child).position === 'absolute';
      });

      if (!bgDiv) return { error: 'Div de fondo no encontrado' };

      const styles = window.getComputedStyle(bgDiv);
      return {
        found: true,
        backgroundImage: styles.backgroundImage,
        hasImage: styles.backgroundImage.includes('unsplash'),
      };
    });

    console.log('\n📊 RESULTADO:');
    console.log(JSON.stringify(fondoInfo, null, 2));

    if (fondoInfo.found && fondoInfo.hasImage) {
      console.log('\n✅✅✅ ¡ÉXITO! La imagen se aplicó correctamente ✅✅✅');
    } else {
      console.log('\n❌ FALLO: La imagen NO se aplicó');
    }

    await page.screenshot({ path: 'test-results/background-image-final.png', fullPage: true });
    await page.waitForTimeout(3000);
  });

  test('Flujo completo: Cambiar a Patrón', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.text().includes('RENDER FONDO')) {
        console.log('🎨 BROWSER:', msg.text());
      }
    });

    console.log('\n📍 Login rápido...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.locator('button:has-text("Iniciar")').click();
    await page.waitForTimeout(3000);

    await page.goto('http://localhost:5173/wedding/web-builder-dashboard');
    await page.waitForTimeout(2000);

    const crearBtn = page.locator('button:has-text("Crear Nueva Web")');
    await crearBtn.click();
    await page.waitForTimeout(1500);

    const blancoBtn = page.locator('text=Empezar en Blanco');
    if (await blancoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await blancoBtn.click();
    }
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("✨ Personalizar")').click();
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      const panels = document.querySelectorAll('.overflow-y-auto');
      for (const panel of panels) {
        if (panel.textContent.includes('Fondo de Página')) {
          panel.scrollTop = 800;
        }
      }
    });
    await page.waitForTimeout(500);

    console.log('\n📍 Seleccionando tipo Patrón...');
    await page.locator('button:has-text("📐 Patrón")').click();
    await page.waitForTimeout(1000);

    console.log('\n📍 Seleccionando patrón Puntos...');
    await page.locator('button:has-text("Puntos")').first().click();
    await page.waitForTimeout(2000);

    const fondoInfo = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      if (!canvas) return { error: 'Canvas no encontrado' };

      const bgDiv = Array.from(canvas.children).find((child) => {
        return window.getComputedStyle(child).position === 'absolute';
      });

      if (!bgDiv) return { error: 'Div de fondo no encontrado' };

      const styles = window.getComputedStyle(bgDiv);
      return {
        found: true,
        backgroundImage: styles.backgroundImage,
        hasPattern: styles.backgroundImage.includes('data:image/svg'),
      };
    });

    console.log('\n📊 RESULTADO:');
    console.log(JSON.stringify(fondoInfo, null, 2));

    if (fondoInfo.found && fondoInfo.hasPattern) {
      console.log('\n✅✅✅ ¡ÉXITO! El patrón se aplicó correctamente ✅✅✅');
    } else {
      console.log('\n❌ FALLO: El patrón NO se aplicó');
    }

    await page.screenshot({ path: 'test-results/background-pattern-final.png', fullPage: true });
    await page.waitForTimeout(3000);
  });
});
